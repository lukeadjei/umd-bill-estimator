import { createAuthServerClient } from "./authServer";
import { getRatesBundleForYear } from "./getRatesBundle";
import { MAX_MISC_GRANTS } from "@/lib/calculator/constants";
import type { MiscGrant, RatesBundle, Residency } from "@/lib/calculator/types";
import type { DashboardSelections } from "@/components/dashboard/selections";

// Defensive, not just a cast -- misc_grants is a jsonb column, so its shape is
// only ever as trustworthy as whatever was last written to it. Malformed or
// unexpected entries are dropped rather than crashing the dashboard load,
// consistent with this file's existing "fail closed" philosophy elsewhere.
function parseMiscGrants(raw: unknown): MiscGrant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map(
      (entry): MiscGrant => ({
        id: typeof entry.id === "string" ? entry.id : crypto.randomUUID(),
        note: typeof entry.note === "string" ? entry.note : "",
        amount: typeof entry.amount === "number" ? entry.amount : 0,
      })
    )
    .slice(0, MAX_MISC_GRANTS);
}

export type SavedScenario = {
  id: string;
  name: string;
  note: string | null;
  computedTotal: number;
  createdAt: string;
  academicYearLabel: string;
  isCurrentYear: boolean;
};

// Queries AS the signed-in user (via the cookie-bound session client, not
// the service role) -- the scenarios RLS policy (`auth.uid() = user_id`)
// does the real filtering at the database level. The explicit .eq(userId)
// below is a second, redundant filter on top of that -- defense in depth,
// not the actual security boundary, so application code doesn't rely on
// RLS alone to avoid ever returning someone else's rows.
//
// academic_years(label, is_current) is an embedded (joined) select through
// the scenarios_academic_year_id_fkey relationship -- academic_years is
// publicly readable (see the init migration's RLS policy), so this doesn't
// need any extra permission beyond what scenarios' own policy already grants.
// One round trip instead of N+1 fetches to label every row's year.
export async function getUserScenarios(userId: string): Promise<SavedScenario[]> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("scenarios")
    .select("id, name, note, computed_total, created_at, academic_years(label, is_current)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    note: row.note,
    computedTotal: row.computed_total,
    createdAt: row.created_at,
    academicYearLabel: row.academic_years?.label ?? "Unknown year",
    isCurrentYear: row.academic_years?.is_current ?? false,
  }));
}

// Same defense-in-depth pattern as getUserScenarios: the session-bound
// client means RLS already restricts this to rows the caller owns, and the
// explicit .eq("user_id", userId) is a second, redundant check on top --
// this is the function that guards against someone loading a scenario that
// isn't theirs by guessing/editing an id in a URL, so it's deliberately not
// relying on RLS alone.
async function getOwnedScenarioRow(scenarioId: string, userId: string) {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase.from("scenarios").select("*").eq("id", scenarioId).eq("user_id", userId).single();

  if (error || !data) return null;
  return data;
}

// Reverses what saveScenario's id-resolution did: turns stored row ids back
// into the {roomType, buildingCategory} / {permitType, term} / plan-name
// shapes the dashboard actually works with, by matching them against the
// given RatesBundle. Shared by both resolveScenarioForEditing (always
// passed the CURRENT bundle, since editing is only ever allowed for a
// current-year scenario) and resolveScenarioForViewing (passed that
// scenario's OWN year's bundle, whatever year that is) -- the resolution
// logic itself doesn't care which one it's given, only the callers differ
// in which bundle -- and therefore which scenarios -- they're allowed to use.
function buildSelectionsFromScenarioRow(
  scenario: NonNullable<Awaited<ReturnType<typeof getOwnedScenarioRow>>>,
  rates: RatesBundle
): DashboardSelections {
  // Cast: residency is plain `string` at the DB layer (not a literal union),
  // trusted here because it only ever came from values calculateTotal itself
  // already validated against when the scenario was originally saved.
  const residency = (scenario.tuition_rate_id
    ? (rates.tuitionRates.find((r) => r.id === scenario.tuition_rate_id)?.residency ?? null)
    : scenario.graduate_tuition_rate_id
      ? (rates.graduateTuitionRates.find((r) => r.id === scenario.graduate_tuition_rate_id)?.residency ?? null)
      : null) as Residency | null;
  const educationLevel = scenario.tuition_rate_id ? "undergraduate" : scenario.graduate_tuition_rate_id ? "graduate" : null;

  const housingRow = scenario.housing_rate_id ? rates.housingRates.find((r) => r.id === scenario.housing_rate_id) : null;
  const residentPlanRow = scenario.resident_dining_plan_id
    ? rates.residentDiningPlans.find((r) => r.id === scenario.resident_dining_plan_id)
    : null;
  const blockPlanRow = scenario.block_dining_plan_id
    ? rates.blockDiningPlans.find((r) => r.id === scenario.block_dining_plan_id)
    : null;
  const parkingRow = scenario.parking_permit_id ? rates.parkingPermits.find((r) => r.id === scenario.parking_permit_id) : null;

  return {
    major: scenario.major ?? "",
    semester: scenario.semester === "spring" ? "spring" : "fall",
    educationLevel,
    residency,
    creditHours: scenario.credit_hours,
    appliesDifferentialTuition: scenario.applies_differential_tuition,
    insurance: scenario.insurance_selected,
    livingSituation: scenario.living_situation === "commuter" ? "commuter" : "on_campus",
    housing: housingRow ? { roomType: housingRow.room_type, buildingCategory: housingRow.building_category } : null,
    residentDiningPlan: residentPlanRow ? { planName: residentPlanRow.plan_name } : null,
    blockDiningPlan: blockPlanRow ? { planLabel: blockPlanRow.plan_label } : null,
    parking: parkingRow ? { permitType: parkingRow.permit_type, term: parkingRow.term } : null,
    grants: {
      pell: scenario.pell_grant_amount,
      terrapinCommitment: scenario.terrapin_commitment_amount,
      rawlingsEA: scenario.rawlings_ea_amount,
      misc: parseMiscGrants(scenario.misc_grants),
    },
  };
}

export type ResolveForEditingResult =
  | { status: "not_found" }
  | { status: "locked"; scenarioName: string; academicYearId: string }
  | { status: "editable"; selections: DashboardSelections };

// Loading a scenario into the LIVE, editable dashboard. Only ever allowed
// for a scenario whose own academic_year_id matches the CURRENT year --
// there's no reason to let someone edit a plan for a year that's already
// over, and more concretely, the dashboard is wired to the current year's
// rates (`rates` here is always the current bundle, fetched once by the
// caller), so a past-year scenario's stored rate ids wouldn't even resolve
// against it correctly. This check is the actual enforcement (not just a UI
// convenience) -- it runs regardless of what the Settings page does or
// doesn't render, so hitting /dashboard?scenario=<old-id> directly can't
// bypass it. See resolveScenarioForViewing for the separate, unlocked path.
export async function resolveScenarioForEditing(
  scenarioId: string,
  userId: string,
  rates: RatesBundle
): Promise<ResolveForEditingResult> {
  const scenario = await getOwnedScenarioRow(scenarioId, userId);
  if (!scenario) return { status: "not_found" };

  if (scenario.academic_year_id !== rates.academicYear.id) {
    return { status: "locked", scenarioName: scenario.name, academicYearId: scenario.academic_year_id };
  }

  return { status: "editable", selections: buildSelectionsFromScenarioRow(scenario, rates) };
}

export type ResolveForViewingResult =
  | { status: "not_found" }
  | { status: "found"; selections: DashboardSelections; rates: RatesBundle; scenarioName: string };

// Generating a read-only PDF/print view of a saved scenario -- deliberately
// has NO year lock, unlike resolveScenarioForEditing above. There's no
// integrity risk in letting someone view an old estimate (nothing gets
// mutated), so this stays available for every scenario regardless of which
// academic year it belongs to. Fetches that scenario's OWN year's rates
// (getRatesBundleForYear), not whatever's current -- a past year's numbers
// have to come from the rates that were actually in effect for that year.
export async function resolveScenarioForViewing(scenarioId: string, userId: string): Promise<ResolveForViewingResult> {
  const scenario = await getOwnedScenarioRow(scenarioId, userId);
  if (!scenario) return { status: "not_found" };

  const rates = await getRatesBundleForYear(scenario.academic_year_id);
  return { status: "found", selections: buildSelectionsFromScenarioRow(scenario, rates), rates, scenarioName: scenario.name };
}
