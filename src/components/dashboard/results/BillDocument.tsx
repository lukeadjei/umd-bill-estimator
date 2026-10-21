import { Fragment } from "react";
import { SEMESTER_LABELS } from "@/lib/calculator/constants";
import type { DashboardSelections } from "@/components/dashboard/selections";
import type { RatesBundle } from "@/lib/calculator/types";
import { calculateAid, calculateTotal, calculateNetTotal } from "@/lib/calculator/calculateTotal";
import { billNote, breakdownLines, selectionSummaryRows } from "@/components/dashboard/billLines";

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// The actual printable bill -- pure from props, no data-fetching, no client
// state, server-renderable. Split out of ResultsShell so both the live/
// in-session flow (ResultsShell, sessionStorage-driven) and the saved-
// scenario view (SavedScenarioBill, database-driven, a different year's
// rates) render identical output from two different data sources instead of
// duplicating this markup. `rates` must be the bundle for whatever academic
// year `selections` actually belongs to -- the caller's responsibility, not
// this component's; it just prices whatever it's given.
export function BillDocument({ selections, rates }: { selections: DashboardSelections; rates: RatesBundle }) {
  // Same rows the dashboard's cost breakdown shows (billLines) -- the two can't drift apart.
  const breakdownRows = breakdownLines(selections, rates).map((line) => ({ label: line.label, value: line.amount }));
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
    <div className="w-full max-w-[8.5in] rounded-none bg-white p-12 text-black ring-1 ring-foreground/10 print:rounded-none print:p-0 print:ring-0">
      <header className="mb-8 flex flex-col gap-1 border-b border-black/20 pb-4">
        <h1 className="font-spicy-rice text-3xl">UMD Bill Estimator</h1>
        <p className="text-sm text-black/60">Unofficial estimate -- not affiliated with the University of Maryland</p>
        <p className="text-sm text-black/60">
          {rates.academicYear.label} {SEMESTER_LABELS[selections.semester]} — generated {generatedDate}
        </p>
      </header>

      <section className="mb-8 break-inside-avoid">
        <h2 className="mb-2 text-lg font-semibold">Your selections</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {selectionSummaryRows(selections).map((row, index) => (
            <Fragment key={`${row.label}-${index}`}>
              <dt className="text-black/60">{row.label}</dt>
              <dd>{row.value}</dd>
            </Fragment>
          ))}
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

      {/* Accuracy caveat -- a different concern from the header's affiliation
          disclaimer above. That one says who built this; this one says the
          number itself is an estimate, not a guarantee. Worth stating plainly
          here since this document is the one artifact that leaves the live
          app (printed, screenshotted, saved as PDF) and could otherwise be
          mistaken for an official figure once it's out of context. */}
      <p className="mt-8 border-t border-black/20 pt-4 text-xs text-black/50">
        This is an estimate based on published UMD rates and the selections above -- actual charges from the
        University of Maryland may differ. Always confirm your official bill through UMD&apos;s own billing systems.
        {billNote(selections.semester) && <> {billNote(selections.semester)}</>}
      </p>
    </div>
  );
}
