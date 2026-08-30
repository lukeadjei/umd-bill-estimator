import { findRowByFirstCellContaining } from "./cheerioUtils";
import { fetchAndLoad } from "./fetchHtml";
import { parseDollarAmount } from "./parseUtils";
import type { GraduateTuitionPageData } from "./types";

const URL = "https://billpay.umd.edu/GraduateTuition";

export async function fetchGraduateTuitionPage(): Promise<GraduateTuitionPageData> {
  const $ = await fetchAndLoad(URL);

  // First content block: an overview table (no <th> at all -- header row is
  // plain <td>) with columns [label, per-credit-hour, example at 10 credits],
  // then a second, itemized fee-breakdown table (has real <th>) used only as
  // a cross-check. No credit threshold here -- grad tuition is always
  // per-credit, confirmed no full-time flat rate exists at that level.
  const tuitionSection = $(".field--name-field-content").eq(0);
  const overviewTable = tuitionSection.find("table").first();

  const residentRow = findRowByFirstCellContaining($, overviewTable, "Tuition Resident");
  const nonResidentRow = findRowByFirstCellContaining($, overviewTable, "Tuition Non-Resident");
  const feesRow = findRowByFirstCellContaining($, overviewTable, "Total Fees");

  const residentPerCredit = parseDollarAmount(residentRow.find("td").eq(1).text());
  const nonResidentPerCredit = parseDollarAmount(nonResidentRow.find("td").eq(1).text());
  // "Per Credit Hour" column for the flat fee row is really "at 1 credit
  // (part-time)"; the "example of 10 credits" column is "at 10 credits
  // (full-time, since 9+)" -- these are flat tiers, not a literal per-credit rate.
  const feePartTime = parseDollarAmount(feesRow.find("td").eq(1).text());
  const feeFullTime = parseDollarAmount(feesRow.find("td").eq(2).text());

  // Cross-check against the second, itemized fee-breakdown table's totals.
  const breakdownTable = tuitionSection.find("table").eq(1);
  const totalRow = findRowByFirstCellContaining($, breakdownTable, "Total Fees");
  const breakdownFullTime = parseDollarAmount(totalRow.find("td").eq(1).text());
  const breakdownPartTime = parseDollarAmount(totalRow.find("td").eq(2).text());
  if (breakdownFullTime !== feeFullTime || breakdownPartTime !== feePartTime) {
    throw new Error("Graduate fee totals disagree between the overview table and the itemized breakdown table");
  }

  return {
    tuitionRates: [
      { residency: "resident", perCreditRate: residentPerCredit },
      { residency: "non_resident", perCreditRate: nonResidentPerCredit },
    ],
    fees: { partTimeRate: feePartTime, fullTimeRate: feeFullTime },
  };
}
