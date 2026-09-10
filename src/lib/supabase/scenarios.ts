import { createAuthServerClient } from "./authServer";
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
};

// Queries AS the signed-in user (via the cookie-bound session client, not
// the service role) -- the scenarios RLS policy (`auth.uid() = user_id`)
// does the real filtering at the database level. The explicit .eq(userId)
// below is a second, redundant filter on top of that -- defense in depth,
// not the actual security boundary, so application code doesn't rely on
// RLS alone to avoid ever returning someone else's rows.
export async function getUserScenarios(userId: string): Promise<SavedScenario[]> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("scenarios")
    .select("id, name, note, computed_total, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    note: row.note,
    computedTotal: row.computed_total,
    createdAt: row.created_at,
  }));
}

// Same defense-in-depth pattern as getUserScenarios: the session-bound
// client means RLS already restricts this to rows the caller owns, and the
// explicit .eq("user_id", userId) is a second, redundant check on top --
// this is the function that guards against someone loading a scenario that
// isn't theirs by guessing/editing an id in the dashboard's ?scenario= URL
// param, so it's deliberately not relying on RLS alone.
async function getOwnedScenarioRow(scenarioId: string, userId: string) {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase.from("scenarios").select("*").eq("id", scenarioId).eq("user_id", userId).single();

  if (error || !data) return null;
  return data;
}

// Reverses what saveScenario's id-resolution did: turns stored row ids back
// into the {roomType, buildingCategory} / {permitType, term} / plan-name
// shapes the dashboard actually works with, by matching them against the
// same RatesBundle the dashboard already fetches. Returns null if the
// scenario doesn't belong to this user (getOwnedScenarioRow) or if a stored
// id no longer matches anything in the current rates (e.g. a stale
// reference into a since-changed academic year) -- fails closed rather than
// seeding the dashboard with a half-resolved, inconsistent state.
export async function resolveScenarioToSelections(
  scenarioId: string,
  userId: string,
  rates: RatesBundle
): Promise<DashboardSelections | null> {
  const scenario = await getOwnedScenarioRow(scenarioId, userId);
  if (!scenario) return null;

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
