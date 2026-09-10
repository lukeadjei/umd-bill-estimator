"use server";

import { createClient } from "@supabase/supabase-js";
import { getServerUser } from "@/lib/supabase/authServer";
import { getRatesBundle } from "@/lib/supabase/getRatesBundle";
import { validateSelections } from "@/lib/calculator/validateSelections";
import { calculateTotal } from "@/lib/calculator/calculateTotal";
import {
  MAX_MISC_GRANTS,
  MISC_GRANT_MAX_AMOUNT,
  MISC_GRANT_NOTE_MAX_LENGTH,
  NAMED_GRANT_MAX_AMOUNT,
  isValidGrantAmount,
} from "@/lib/calculator/constants";
import type { DashboardSelections } from "@/components/dashboard/selections";
import type { Database } from "@/lib/supabase/database.types";

export type SaveScenarioResult = { success: true; scenarioId: string } | { success: false; error: string };

// The only path that writes to `scenarios` -- there is no public insert
// policy on that table by design (see the init migration's RLS comment), so
// this has to run with the service_role key. Every check here is server-side
// and re-derived, never trusting what the client sent: the disabled
// "Generate Plan" button is a UI convenience, not a security boundary.
export async function saveScenario(selections: DashboardSelections, note?: string): Promise<SaveScenarioResult> {
  const user = await getServerUser();
  if (!user) {
    return { success: false, error: "You must be signed in to save a scenario." };
  }

  const validation = validateSelections(selections);
  if (!validation.valid) {
    return { success: false, error: "This plan has errors and can't be saved yet." };
  }

  // Optional -- never trust the client's own character-count enforcement,
  // re-check server-side (matches the DB's own `scenarios_note_length`
  // check constraint, added as real insurance on top of this, not a
  // duplicate of it).
  const trimmedNote = note?.trim() || null;
  if (trimmedNote && trimmedNote.length > 100) {
    return { success: false, error: "Note must be 100 characters or fewer." };
  }

  // Same never-trust-the-client re-check as the note above, for every grant
  // amount -- the AidPanel's own input clamping is a UI convenience, not a
  // security/data-integrity boundary. Untouched misc rows (never given a
  // note or an amount) are dropped rather than rejected -- they're not an
  // error, just nothing the user actually filled in.
  const cleanedMiscGrants = selections.grants.misc
    .map((grant) => ({ ...grant, note: grant.note.trim() }))
    .filter((grant) => grant.amount > 0 || grant.note.length > 0);

  if (cleanedMiscGrants.length > MAX_MISC_GRANTS) {
    return { success: false, error: `No more than ${MAX_MISC_GRANTS} miscellaneous grants are allowed.` };
  }
  if (!isValidGrantAmount(selections.grants.pell, NAMED_GRANT_MAX_AMOUNT)) {
    return { success: false, error: `Pell Grant must be between $1 and $${NAMED_GRANT_MAX_AMOUNT.toLocaleString()}.` };
  }
  if (!isValidGrantAmount(selections.grants.terrapinCommitment, NAMED_GRANT_MAX_AMOUNT)) {
    return {
      success: false,
      error: `Terrapin Commitment Grant must be between $1 and $${NAMED_GRANT_MAX_AMOUNT.toLocaleString()}.`,
    };
  }
  if (!isValidGrantAmount(selections.grants.rawlingsEA, NAMED_GRANT_MAX_AMOUNT)) {
    return {
      success: false,
      error: `Rawlings EA Grant must be between $1 and $${NAMED_GRANT_MAX_AMOUNT.toLocaleString()}.`,
    };
  }
  for (const grant of cleanedMiscGrants) {
    if (!isValidGrantAmount(grant.amount, MISC_GRANT_MAX_AMOUNT)) {
      return {
        success: false,
        error: `Each miscellaneous grant must be between $1 and $${MISC_GRANT_MAX_AMOUNT.toLocaleString()}.`,
      };
    }
    if (grant.note.length > MISC_GRANT_NOTE_MAX_LENGTH) {
      return {
        success: false,
        error: `Miscellaneous grant notes must be ${MISC_GRANT_NOTE_MAX_LENGTH} characters or fewer.`,
      };
    }
  }

  // Past this point, validateSelections guarantees educationLevel, residency,
  // creditHours, and livingSituation are all non-null -- that's exactly what
  // "always-required" means there. TypeScript can't see across the function
  // call, so the non-null assertions below are asserting something already
  // actually checked, not bypassing a real gap.
  const rates = await getRatesBundle();
  const computedTotal = calculateTotal(selections, rates);

  // Resolve every composite selection into its real row id by matching
  // against the same RatesBundle calculateTotal itself just used -- never
  // trust a client-supplied id, only the selection shape.
  const tuitionRateId =
    selections.educationLevel === "undergraduate"
      ? (rates.tuitionRates.find((r) => r.residency === selections.residency)?.id ?? null)
      : null;
  const graduateTuitionRateId =
    selections.educationLevel === "graduate"
      ? (rates.graduateTuitionRates.find((r) => r.residency === selections.residency)?.id ?? null)
      : null;

  if (selections.educationLevel === "undergraduate" && !tuitionRateId) {
    return { success: false, error: "Couldn't find a matching tuition rate. Try again." };
  }
  if (selections.educationLevel === "graduate" && !graduateTuitionRateId) {
    return { success: false, error: "Couldn't find a matching graduate tuition rate. Try again." };
  }

  const housingRateId = selections.housing
    ? (rates.housingRates.find(
        (r) => r.room_type === selections.housing!.roomType && r.building_category === selections.housing!.buildingCategory
      )?.id ?? null)
    : null;
  const residentDiningPlanId = selections.residentDiningPlan
    ? (rates.residentDiningPlans.find((r) => r.plan_name === selections.residentDiningPlan!.planName)?.id ?? null)
    : null;
  const blockDiningPlanId = selections.blockDiningPlan
    ? (rates.blockDiningPlans.find((r) => r.plan_label === selections.blockDiningPlan!.planLabel)?.id ?? null)
    : null;
  const parkingPermitId = selections.parking
    ? (rates.parkingPermits.find(
        (r) => r.permit_type === selections.parking!.permitType && r.term === selections.parking!.term
      )?.id ?? null)
    : null;

  // No new naming UI yet (deliberately deferred) -- auto-generate something
  // readable instead of asking the user for a name right now.
  const name = `${rates.academicYear.label} ${selections.semester === "fall" ? "Fall" : "Spring"} Estimate`;

  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      user_id: user.id,
      name,
      note: trimmedNote,
      academic_year_id: rates.academicYear.id,
      major: selections.major.trim() || null,
      semester: selections.semester,
      living_situation: selections.livingSituation!,
      credit_hours: selections.creditHours!,
      applies_differential_tuition: selections.appliesDifferentialTuition,
      insurance_selected: selections.insurance,
      tuition_rate_id: tuitionRateId,
      graduate_tuition_rate_id: graduateTuitionRateId,
      housing_rate_id: housingRateId,
      resident_dining_plan_id: residentDiningPlanId,
      block_dining_plan_id: blockDiningPlanId,
      parking_permit_id: parkingPermitId,
      computed_total: computedTotal,
      pell_grant_amount: selections.grants.pell,
      terrapin_commitment_amount: selections.grants.terrapinCommitment,
      rawlings_ea_amount: selections.grants.rawlingsEA,
      misc_grants: cleanedMiscGrants,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Failed to save the scenario. Try again." };
  }

  return { success: true, scenarioId: data.id };
}
