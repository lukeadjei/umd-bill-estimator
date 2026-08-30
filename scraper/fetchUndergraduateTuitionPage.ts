import { findTableByFirstHeader } from "./cheerioUtils";
import { fetchAndLoad } from "./fetchHtml";
import { parseDollarAmount, parseLeadingInteger } from "./parseUtils";
import type { UndergraduateTuitionPageData } from "./types";

const URL = "https://billpay.umd.edu/UndergraduateTuition";

export async function fetchUndergraduateTuitionPage(): Promise<UndergraduateTuitionPageData> {
  const $ = await fetchAndLoad(URL);

  // Page has two rich-text content blocks, no other distinguishing markers:
  // the first holds the tuition/fee tables, the second holds health insurance.
  const contentBlocks = $(".field--name-field-content");
  const tuitionSection = contentBlocks.eq(0);
  const insuranceSection = contentBlocks.eq(1);

  function parseResidencyTable(headerText: string) {
    const table = findTableByFirstHeader($, tuitionSection, headerText);
    const rows = table.find("tbody tr");
    const partTime = rows.eq(0).find("td");
    const fullTime = rows.eq(1).find("td");
    // Column order: [label, credit hours, *TUITION, *MANDATORY FEES, total, *DIFFERENTIAL, total w/ differential]
    return {
      perCreditRate: parseDollarAmount(partTime.eq(2).text()),
      fullTimeRate: parseDollarAmount(fullTime.eq(2).text()),
      feePartTimeText: partTime.eq(3).text(),
      feeFullTime: parseDollarAmount(fullTime.eq(3).text()),
      differentialPerCredit: parseDollarAmount(partTime.eq(5).text()),
      differentialFullTime: parseDollarAmount(fullTime.eq(5).text()),
      fullTimeCreditThreshold: parseLeadingInteger(fullTime.eq(1).text()),
    };
  }

  const resident = parseResidencyTable("RESIDENT TUITION");
  const nonResident = parseResidencyTable("NON-RESIDENT TUITION");

  // Differential tuition and mandatory fees are supposed to be identical
  // across residency -- only the base tuition rate itself differs. Confirm
  // both tables actually agree rather than silently trusting one of them.
  const residentFeePartTime = parseDollarAmount(resident.feePartTimeText);
  const nonResidentFeePartTime = parseDollarAmount(nonResident.feePartTimeText);
  if (
    resident.differentialPerCredit !== nonResident.differentialPerCredit ||
    resident.differentialFullTime !== nonResident.differentialFullTime
  ) {
    throw new Error("Differential tuition differs between the resident and non-resident tables -- expected identical");
  }
  if (residentFeePartTime !== nonResidentFeePartTime || resident.feeFullTime !== nonResident.feeFullTime) {
    throw new Error("Mandatory fees differ between the resident and non-resident tables -- expected identical");
  }

  // Only the resident table's part-time fee cell has this extra parenthetical
  // text: "$422.00 (1-8 credits)(9+ Credits is Full time rate as shown below)"
  const feeThresholdMatch = resident.feePartTimeText.match(/(\d+)\+\s*Credits is Full time/i);
  if (!feeThresholdMatch) {
    throw new Error(`Could not find the fee credit threshold in: "${resident.feePartTimeText}"`);
  }

  // "Fall term will be assessed $1,232, and Spring term will be assessed $1,707"
  const insuranceText = insuranceSection.text();
  const fallMatch = insuranceText.match(/Fall term will be assessed\s*\$([\d,]+\.?\d*)/i);
  const springMatch = insuranceText.match(/Spring term will be assessed\s*\$([\d,]+\.?\d*)/i);
  if (!fallMatch || !springMatch) throw new Error("Could not find health insurance fall/spring prices");

  return {
    tuitionRates: [
      { residency: "resident", fullTimeRate: resident.fullTimeRate, perCreditRate: resident.perCreditRate },
      { residency: "non_resident", fullTimeRate: nonResident.fullTimeRate, perCreditRate: nonResident.perCreditRate },
    ],
    differentialTuition: {
      fullTimeRate: resident.differentialFullTime,
      perCreditRate: resident.differentialPerCredit,
    },
    mandatoryFees: {
      partTimeRate: residentFeePartTime,
      fullTimeRate: resident.feeFullTime,
    },
    healthInsurance: {
      fallPrice: Number(fallMatch[1].replace(/,/g, "")),
      springPrice: Number(springMatch[1].replace(/,/g, "")),
    },
    thresholds: {
      undergradTuitionFullTimeCreditThreshold: resident.fullTimeCreditThreshold,
      fullTimeFeeCreditThreshold: Number(feeThresholdMatch[1]),
    },
  };
}
