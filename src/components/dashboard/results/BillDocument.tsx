import type { DashboardSelections } from "@/components/dashboard/selections";
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
  );
}
