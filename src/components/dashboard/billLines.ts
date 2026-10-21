import {
  calculateDifferentialTuition,
  calculateDining,
  calculateFees,
  calculateHousing,
  calculateInsurance,
  calculateParking,
  calculateTuition,
} from "@/lib/calculator/calculateTotal";
import { calculateWinterFee, calculateWinterTuition } from "@/lib/calculator/calculateWinter";
import type { RatesBundle, Semester } from "@/lib/calculator/types";
import type { DashboardSelections } from "@/components/dashboard/selections";

// What each semester's bill shows, in one place so the dashboard's cost breakdown and the
// printed bill can't drift apart. Both are Record<Semester, ...> so a new semester is a
// compile error until it says what its bill looks like. These only arrange numbers the
// calculator already produces -- no price is computed here (CLAUDE.md rule 1).

export type LabeledAmount = { label: string; amount: number };
export type SummaryRow = { label: string; value: string };

// ---------------------------------------------------------------- cost breakdown

function regularSemesterLines(selections: DashboardSelections, rates: RatesBundle): LabeledAmount[] {
  return [
    // Differential tuition is folded into the Tuition line rather than getting its own row.
    { label: "Tuition", amount: calculateTuition(selections, rates) + calculateDifferentialTuition(selections, rates) },
    { label: "Fees", amount: calculateFees(selections, rates) },
    { label: "Housing", amount: calculateHousing(selections, rates) },
    { label: "Meals", amount: calculateDining(selections, rates) },
    { label: "Parking", amount: calculateParking(selections, rates) },
    { label: "Insurance", amount: calculateInsurance(selections, rates) },
  ];
}

function winterSessionLines(selections: DashboardSelections, rates: RatesBundle): LabeledAmount[] {
  return [
    { label: "Tuition", amount: calculateWinterTuition(selections, rates) },
    { label: "Winter fee", amount: calculateWinterFee(selections, rates) },
  ];
}

const LINE_BUILDERS: Record<Semester, (selections: DashboardSelections, rates: RatesBundle) => LabeledAmount[]> = {
  fall: regularSemesterLines,
  spring: regularSemesterLines,
  winter: winterSessionLines,
};

export function breakdownLines(selections: DashboardSelections, rates: RatesBundle): LabeledAmount[] {
  return LINE_BUILDERS[selections.semester](selections, rates);
}

// ---------------------------------------------------------------- bill "Your selections"

function educationLevelLabel(selections: DashboardSelections): string {
  // Matches the old CSS `capitalize` on the raw value; empty when unanswered.
  return selections.educationLevel === null
    ? ""
    : selections.educationLevel.charAt(0).toUpperCase() + selections.educationLevel.slice(1);
}

function residencyLabel(selections: DashboardSelections): string {
  return selections.residency === "resident" ? "Maryland resident" : "Non-resident";
}

function regularSemesterSummary(selections: DashboardSelections): SummaryRow[] {
  const rows: SummaryRow[] = [];
  if (selections.major.trim()) rows.push({ label: "Major", value: selections.major });
  rows.push(
    { label: "Education level", value: educationLevelLabel(selections) },
    { label: "Residency", value: residencyLabel(selections) },
    { label: "Credit hours", value: String(selections.creditHours ?? "") },
    { label: "Living situation", value: selections.livingSituation === "commuter" ? "Commuter" : "On-campus" }
  );
  if (selections.housing) {
    rows.push({ label: "Housing", value: `${selections.housing.roomType}, ${selections.housing.buildingCategory}` });
  }
  if (selections.residentDiningPlan) {
    rows.push({ label: "Dining plan", value: `${selections.residentDiningPlan.planName} (resident)` });
  }
  if (selections.blockDiningPlan) {
    rows.push({ label: "Dining plan", value: `${selections.blockDiningPlan.planLabel} (block)` });
  }
  if (selections.parking) {
    rows.push({ label: "Parking permit", value: `${selections.parking.permitType}, ${selections.parking.term}` });
  }
  rows.push({ label: "Health insurance", value: selections.insurance ? "Opted in" : "Not selected" });
  return rows;
}

function winterSessionSummary(selections: DashboardSelections): SummaryRow[] {
  const classFormat =
    selections.winterClassFormat === "in_person"
      ? "At least one class in person (campus services fee)"
      : selections.winterClassFormat === "online_only"
        ? "All classes online (distance learning fee)"
        : "Not selected";
  return [
    { label: "Education level", value: educationLevelLabel(selections) },
    { label: "Residency", value: residencyLabel(selections) },
    { label: "Credit hours", value: String(selections.creditHours ?? "") },
    { label: "Class format", value: classFormat },
  ];
}

const SUMMARY_BUILDERS: Record<Semester, (selections: DashboardSelections) => SummaryRow[]> = {
  fall: regularSemesterSummary,
  spring: regularSemesterSummary,
  winter: winterSessionSummary,
};

export function selectionSummaryRows(selections: DashboardSelections): SummaryRow[] {
  return SUMMARY_BUILDERS[selections.semester](selections);
}

// ---------------------------------------------------------------- bill footnote

// An extra, semester-specific sentence for the printed bill's accuracy note (null = nothing beyond
// the general disclaimer). Winter is billed differently from a semester and UMD publishes that some
// courses carry their own charges, so the printout says what the estimate leaves out.
const BILL_NOTES: Record<Semester, string | null> = {
  fall: null,
  spring: null,
  winter:
    "Winter Session estimates cover per-credit tuition and the one flat Winter fee only. Some courses add lab, studio or materials fees (shown on Testudo), and some programs set their own Winter rates -- confirm your specific sections with UMD.",
};

export function billNote(semester: Semester): string | null {
  return BILL_NOTES[semester];
}
