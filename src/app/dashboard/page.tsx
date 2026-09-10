import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getRatesBundle } from "@/lib/supabase/getRatesBundle";
import { getServerUser } from "@/lib/supabase/authServer";
import { resolveScenarioForEditing } from "@/lib/supabase/scenarios";

export const metadata: Metadata = {
  title: "Dashboard — UMD Bill Estimator",
  description: "Build your estimated UMD bill: tuition, housing, dining, and parking.",
};

// Public route, no auth gating -- matches the homepage's own "save it, or
// just walk away, no account required" flow. Inherits fonts/Footer/flex
// shell from the root layout automatically.
//
// force-dynamic: this page must render per-request, not be statically
// pre-rendered at build time. Without this, `next build` tries to actually
// run getRatesBundle() -> a real Supabase call during the build itself --
// which fails in CI (no .env.local, correctly not committed) and would
// defeat the point of the unstable_cache design either way: that caching
// strategy assumes a live per-request render (first real visitor after a
// cache miss pays the round-trip cost), not one HTML snapshot frozen into
// the build output.
export const dynamic = "force-dynamic";

// The rates fetch itself is cached (see getRatesBundle.ts) -- this await
// only pays the real Supabase round-trip cost for whichever request is
// first to hit a cache miss, not every visitor.
// ?scenario=<id> loads a previously-saved scenario's selections into the
// dashboard instead of starting from the empty defaults -- e.g. clicking a
// saved plan on the Settings page links here. Resolution happens through
// resolveScenarioForEditing, which only ever returns a scenario that
// actually belongs to the signed-in user AND belongs to the current academic
// year -- a scenario from a past year is real, owned by this user, and
// resolvable, but deliberately blocked from loading into the editable
// dashboard (see scenarios.ts's own comment on why). A guest, a signed-in
// user passing someone else's id, or an id that doesn't exist at all all
// just fail closed back to the normal empty defaults, silently -- only the
// "real scenario, wrong year" case gets an explicit message, since that's
// the one case where silently showing an empty form would be confusing
// rather than appropriately non-revealing.
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const [rates, user, { scenario: scenarioId }] = await Promise.all([getRatesBundle(), getServerUser(), searchParams]);

  let initialSelections = null;
  let lockedScenarioMessage: string | null = null;

  if (scenarioId && user) {
    const result = await resolveScenarioForEditing(scenarioId, user.id, rates);
    if (result.status === "editable") {
      initialSelections = result.selections;
    } else if (result.status === "locked") {
      lockedScenarioMessage = `"${result.scenarioName}" is from a past academic year and can no longer be loaded for editing. You can still view or print it from Settings -> Saved Scenarios.`;
    }
    // "not_found" (doesn't exist, or isn't this user's) -- fails closed to
    // the empty defaults below, same as always, no message shown.
  }

  return (
    <DashboardShell
      academicYearLabel={rates.academicYear.label}
      rates={rates}
      isSignedIn={user !== null}
      userName={(user?.user_metadata?.full_name as string | undefined) ?? null}
      avatarUrl={(user?.user_metadata?.avatar_url as string | undefined) ?? null}
      initialSelections={initialSelections}
      lockedScenarioMessage={lockedScenarioMessage}
    />
  );
}
