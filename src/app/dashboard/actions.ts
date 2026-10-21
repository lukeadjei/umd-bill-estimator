"use server";

import { SEMESTER_LABELS } from "@/lib/calculator/constants";
import { createClient } from "@supabase/supabase-js";
import { getServerUser } from "@/lib/supabase/authServer";
import { getRatesBundle } from "@/lib/supabase/getRatesBundle";
import { buildScenarioFields } from "@/lib/supabase/scenarioMapping";
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

  // Loaded before validating: some limits (winter's credit cap) come from the rates.
  const rates = await getRatesBundle();
  const validation = validateSelections(selections, rates);
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

  // Past this point, validateSelections guarantees the always-required fields
  // are non-null for this semester, so the non-null assertions below assert
  // something already checked, not a bypass of a real gap.
  const computedTotal = calculateTotal(selections, rates);

  // Which rate-row ids and flags get stored depends on the semester (winter
  // saves only winter's fields) -- see scenarioMapping.ts.
  const scenarioFields = buildScenarioFields(selections, rates);
  if (!scenarioFields.ok) {
    return { success: false, error: scenarioFields.error };
  }

  // No new naming UI yet (deliberately deferred) -- auto-generate something
  // readable instead of asking the user for a name right now.
  const name = `${rates.academicYear.label} ${SEMESTER_LABELS[selections.semester]} Estimate`;

  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      user_id: user.id,
      name,
      note: trimmedNote,
      academic_year_id: rates.academicYear.id,
      semester: selections.semester,
      credit_hours: selections.creditHours!,
      computed_total: computedTotal,
      pell_grant_amount: selections.grants.pell,
      terrapin_commitment_amount: selections.grants.terrapinCommitment,
      rawlings_ea_amount: selections.grants.rawlingsEA,
      misc_grants: cleanedMiscGrants,
      ...scenarioFields.fields,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Failed to save the scenario. Try again." };
  }

  return { success: true, scenarioId: data.id };
}
