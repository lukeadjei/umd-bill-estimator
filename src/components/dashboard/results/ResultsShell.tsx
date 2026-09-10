"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readStoredSelections, type DashboardSelections } from "@/components/dashboard/selections";
import { BillDocument } from "@/components/dashboard/results/BillDocument";
import { PrintButton } from "@/components/dashboard/results/PrintButton";
import type { RatesBundle } from "@/lib/calculator/types";
import { validateSelections } from "@/lib/calculator/validateSelections";

export function ResultsShell({ rates }: { rates: RatesBundle }) {
  // undefined = "haven't checked sessionStorage yet" (true during the
  // server-rendered pass and the very first client render), distinct from
  // null ("checked, there's nothing there"). Reading sessionStorage directly
  // during render (rather than in the effect below) would make the server's
  // render and the client's first render disagree -- see DashboardShell's
  // identical pattern/comment for the full reasoning.
  const [selections, setSelections] = useState<DashboardSelections | null | undefined>(undefined);

  useEffect(() => {
    // Same deliberate rehydrate-from-sessionStorage-after-mount pattern as
    // DashboardShell, for the same hydration-mismatch reason.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelections(readStoredSelections());
  }, []);

  if (selections === undefined) {
    // The instant between the server-rendered pass and this effect firing --
    // avoids a flash of "no plan" content before we've actually checked.
    return null;
  }

  if (!selections) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">No plan to show yet</p>
        <p className="max-w-sm text-muted-foreground">
          Head back to the dashboard, make your selections, and click Generate.
        </p>
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  const validation = validateSelections(selections);

  if (!validation.valid) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">This plan has some issues</p>
        <ul className="flex flex-col gap-1">
          {validation.errors.map((error) => (
            <li key={error.field} className="text-sm text-destructive">
              {error.message}
            </li>
          ))}
        </ul>
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-background px-4 py-8">
      {/* On-screen only -- print:hidden means neither of these show up in
          the printed/PDF output, only the actual estimate below does. */}
      <div className="mb-6 flex w-full max-w-[8.5in] items-center justify-between print:hidden">
        <Button variant="ghost" className="rounded-full" nativeButton={false} render={<Link href="/dashboard" />}>
          <ArrowLeftIcon className="size-4" />
          Back to dashboard
        </Button>
        <PrintButton />
      </div>

      <BillDocument selections={selections} rates={rates} />
    </div>
  );
}
