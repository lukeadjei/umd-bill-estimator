import { createAuthServerClient } from "./authServer";
import { getRatesBundleForYear } from "./getRatesBundle";
import type { RatesBundle } from "@/lib/calculator/types";
import { buildSelectionsFromScenarioRow } from "./scenarioMapping";
import type { DashboardSelections } from "@/components/dashboard/selections";

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
