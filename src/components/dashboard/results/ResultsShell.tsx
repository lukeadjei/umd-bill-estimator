"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readStoredSelections, type DashboardSelections } from "@/components/dashboard/selections";
import type { RatesBundle } from "@/lib/calculator/types";
import {
  calculateTuition,
  calculateDifferentialTuition,
  calculateFees,
  calculateHousing,
  calculateDining,
  calculateParking,
  calculateInsurance,
  calculateAid,
  calculateTotal,
  calculateNetTotal,
} from "@/lib/calculator/calculateTotal";
import { validateSelections } from "@/lib/calculator/validateSelections";

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

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

  const breakdownRows: { label: string; value: number }[] = [
    { label: "Tuition", value: calculateTuition(selections, rates) + calculateDifferentialTuition(selections, rates) },
    { label: "Fees", value: calculateFees(selections, rates) },
    { label: "Housing", value: calculateHousing(selections, rates) },
    { label: "Meals", value: calculateDining(selections, rates) },
    { label: "Parking", value: calculateParking(selections, rates) },
    { label: "Insurance", value: calculateInsurance(selections, rates) },
  ];
  const total = calculateTotal(selections, rates);
  const aid = calculateAid(selections);
  const netTotal = calculateNetTotal(selections, rates);
  const isRefund = aid > 0 && netTotal < 0;

  // Itemized so the bill shows exactly what was applied, not just a lump sum
  // -- same reasoning as the breakdown rows above. Only entries with a
  // nonzero amount show up; an untouched named grant or an emptied-out misc
  // row shouldn't leave a "$0.00" line on the printed bill.
  const aidRows: { label: string; value: number }[] = [
    ...(selections.grants.pell > 0 ? [{ label: "Pell Grant", value: selections.grants.pell }] : []),
    ...(selections.grants.terrapinCommitment > 0
      ? [{ label: "Terrapin Commitment Grant", value: selections.grants.terrapinCommitment }]
      : []),
    ...(selections.grants.rawlingsEA > 0 ? [{ label: "Rawlings EA Grant", value: selections.grants.rawlingsEA }] : []),
    ...selections.grants.misc
      .filter((grant) => grant.amount > 0)
      .map((grant) => ({ label: grant.note.trim() || "Miscellaneous grant", value: grant.amount })),
  ];

  const generatedDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="flex flex-1 flex-col items-center bg-background px-4 py-8">
      {/* On-screen only -- print:hidden means neither of these show up in
          the printed/PDF output, only the actual estimate below does. */}
      <div className="mb-6 flex w-full max-w-[8.5in] items-center justify-between print:hidden">
        <Button variant="ghost" className="rounded-full" nativeButton={false} render={<Link href="/dashboard" />}>
          <ArrowLeftIcon className="size-4" />
          Back to dashboard
        </Button>
        <Button type="button" className="rounded-full" onClick={() => window.print()}>
          <PrinterIcon className="size-4" />
          Print / Save as PDF
        </Button>
      </div>

      {/* The actual printable content. Sized/margined to roughly match the
          @page rule (globals.css) even on-screen, so what's shown here is
          close to what actually prints -- print:p-0/ring-0 drop the
          on-screen card framing once @page's own margin takes over. */}
      <div className="w-full max-w-[8.5in] rounded-none bg-white p-12 text-black ring-1 ring-foreground/10 print:rounded-none print:p-0 print:ring-0">
        <header className="mb-8 flex flex-col gap-1 border-b border-black/20 pb-4">
          <h1 className="font-spicy-rice text-3xl">UMD Bill Estimator</h1>
          <p className="text-sm text-black/60">Unofficial estimate -- not affiliated with the University of Maryland</p>
          <p className="text-sm text-black/60">
            {rates.academicYear.label} {selections.semester === "fall" ? "Fall" : "Spring"} — generated {generatedDate}
          </p>
        </header>

        <section className="mb-8 break-inside-avoid">
          <h2 className="mb-2 text-lg font-semibold">Your selections</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {selections.major.trim() && (
              <>
                <dt className="text-black/60">Major</dt>
                <dd>{selections.major}</dd>
              </>
            )}
            <dt className="text-black/60">Education level</dt>
            <dd className="capitalize">{selections.educationLevel}</dd>
            <dt className="text-black/60">Residency</dt>
            <dd>{selections.residency === "resident" ? "Maryland resident" : "Non-resident"}</dd>
            <dt className="text-black/60">Credit hours</dt>
            <dd>{selections.creditHours}</dd>
            <dt className="text-black/60">Living situation</dt>
            <dd>{selections.livingSituation === "commuter" ? "Commuter" : "On-campus"}</dd>
            {selections.housing && (
              <>
                <dt className="text-black/60">Housing</dt>
                <dd>
                  {selections.housing.roomType}, {selections.housing.buildingCategory}
                </dd>
              </>
            )}
            {selections.residentDiningPlan && (
              <>
                <dt className="text-black/60">Dining plan</dt>
                <dd>{selections.residentDiningPlan.planName} (resident)</dd>
              </>
            )}
            {selections.blockDiningPlan && (
              <>
                <dt className="text-black/60">Dining plan</dt>
                <dd>{selections.blockDiningPlan.planLabel} (block)</dd>
              </>
            )}
            {selections.parking && (
              <>
                <dt className="text-black/60">Parking permit</dt>
                <dd>
                  {selections.parking.permitType}, {selections.parking.term}
                </dd>
              </>
            )}
            <dt className="text-black/60">Health insurance</dt>
            <dd>{selections.insurance ? "Opted in" : "Not selected"}</dd>
          </dl>
        </section>

        <section className="break-inside-avoid">
          <h2 className="mb-2 text-lg font-semibold">Cost breakdown</h2>
          <table className="w-full text-sm">
            <tbody>
              {breakdownRows.map((row) => (
                <tr key={row.label} className="border-b border-black/10">
                  <td className="py-1.5">{row.label}</td>
                  <td className="py-1.5 text-right">{formatCurrency(row.value)}</td>
                </tr>
              ))}

              {aidRows.length === 0 ? (
                <tr className="font-bold">
                  <td className="py-2 text-base">Total</td>
                  <td className="py-2 text-right text-base">{formatCurrency(total)}</td>
                </tr>
              ) : (
                <>
                  <tr className="border-b border-black/10 font-semibold">
                    <td className="py-2">Total before aid</td>
                    <td className="py-2 text-right">{formatCurrency(total)}</td>
                  </tr>
                  {aidRows.map((row) => (
                    <tr key={row.label} className="border-b border-black/10">
                      <td className="py-1.5">{row.label}</td>
                      <td className="py-1.5 text-right">-{formatCurrency(row.value)}</td>
                    </tr>
                  ))}
                  <tr className={`font-bold ${isRefund ? "text-emerald-700" : ""}`}>
                    <td className="py-2 text-base">Total after aid{isRefund ? " (estimated refund)" : ""}</td>
                    <td className="py-2 text-right text-base">
                      {isRefund ? `+${formatCurrency(Math.abs(netTotal))}` : formatCurrency(netTotal)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
