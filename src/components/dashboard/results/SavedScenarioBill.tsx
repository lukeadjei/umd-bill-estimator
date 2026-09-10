import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BillDocument } from "@/components/dashboard/results/BillDocument";
import { PrintButton } from "@/components/dashboard/results/PrintButton";
import type { DashboardSelections } from "@/components/dashboard/selections";
import type { RatesBundle } from "@/lib/calculator/types";

// The read-only counterpart to ResultsShell: no sessionStorage, no client
// data-fetching, no validity re-check (a saved scenario was already
// validated by saveScenario before it was ever written, so there's nothing
// left to re-gate here) -- selections and rates arrive fully resolved from
// the server (resolveScenarioForViewing + getRatesBundleForYear), for
// whichever academic year the scenario actually belongs to, current or not.
// Deliberately a plain Server Component -- the only client-side piece
// needed anywhere on this page is the print button itself.
export function SavedScenarioBill({ selections, rates }: { selections: DashboardSelections; rates: RatesBundle }) {
  return (
    <div className="flex flex-1 flex-col items-center bg-background px-4 py-8">
      <div className="mb-6 flex w-full max-w-[8.5in] items-center justify-between print:hidden">
        <Button
          variant="ghost"
          className="rounded-full"
          nativeButton={false}
          render={<Link href="/settings?tab=scenarios" />}
        >
          <ArrowLeftIcon className="size-4" />
          Back to Saved Scenarios
        </Button>
        <PrintButton />
      </div>

      <BillDocument selections={selections} rates={rates} />
    </div>
  );
}
