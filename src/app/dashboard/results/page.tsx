import type { Metadata } from "next";
import Link from "next/link";
import { getRatesBundle } from "@/lib/supabase/getRatesBundle";
import { getServerUser } from "@/lib/supabase/authServer";
import { resolveScenarioForViewing } from "@/lib/supabase/scenarios";
import { ResultsShell } from "@/components/dashboard/results/ResultsShell";
import { SavedScenarioBill } from "@/components/dashboard/results/SavedScenarioBill";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Your Estimate — UMD Bill Estimator",
  description: "Printable summary of your UMD cost estimate.",
};

// Same reasoning as dashboard/page.tsx: this calls getRatesBundle() (a real,
// cached Supabase fetch) -- must not run at build time, or it fails in CI
// the same way /dashboard originally did.
export const dynamic = "force-dynamic";

// Two independent ways to land on this page:
// 1. No ?scenario= -- the live, in-session flow. Selections only exist
//    client-side (sessionStorage, written by DashboardShell), which a
//    Server Component can't read -- ResultsShell handles that read itself,
//    this just supplies the current rate data, same as before this feature.
// 2. ?scenario=<id> -- viewing/printing a SAVED scenario, from Settings.
//    Deliberately allowed regardless of which academic year it belongs to
//    (unlike loading it into the editable dashboard) -- resolveScenarioForViewing
//    has no year lock, see its own comment in scenarios.ts for why. Resolved
//    entirely server-side (that scenario's own year's rates, via
//    getRatesBundleForYear), no sessionStorage involved at all.
export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const { scenario: scenarioId } = await searchParams;

  if (scenarioId) {
    const user = await getServerUser();
    const result = user ? await resolveScenarioForViewing(scenarioId, user.id) : { status: "not_found" as const };

    if (result.status === "not_found") {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-lg font-semibold text-foreground">Scenario not found</p>
          <p className="max-w-sm text-muted-foreground">
            This scenario doesn&apos;t exist, or isn&apos;t saved to your account.
          </p>
          <Button nativeButton={false} render={<Link href="/settings?tab=scenarios" />}>
            Back to Saved Scenarios
          </Button>
        </div>
      );
    }

    return <SavedScenarioBill selections={result.selections} rates={result.rates} />;
  }

  const rates = await getRatesBundle();
  return <ResultsShell rates={rates} />;
}
