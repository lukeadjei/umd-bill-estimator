import { describe, expect, it } from "vitest";
import { calculateTotal } from "@/lib/calculator/calculateTotal";
import { availableSemesters, sameSemesterKind } from "@/lib/calculator/semesterConfig";
import type { RatesBundle } from "@/lib/calculator/types";
import { breakdownLines, selectionSummaryRows } from "./billLines";
import { DEFAULT_SELECTIONS, hasProgressToLose, resetForSemesterChange, type DashboardSelections } from "./selections";
import { getTabItems } from "./tabs";

const rates: RatesBundle = {
  academicYear: {
    id: "y",
    label: "2026-2027",
    is_current: true,
    undergrad_tuition_full_time_credit_threshold: 12,
    full_time_fee_credit_threshold: 9,
    winter_max_credit_hours: 4,
  },
  tuitionRates: [{ id: "t", academic_year_id: "y", residency: "resident", full_time_rate: 5000, per_credit_rate: 400 }],
  graduateTuitionRates: [],
  mandatoryFees: [{ id: "m", academic_year_id: "y", part_time_rate: 400, full_time_rate: 900 }],
  graduateFees: [],
  differentialTuition: [{ id: "d", academic_year_id: "y", full_time_rate: 1600, per_credit_rate: 130 }],
  housingRates: [{ id: "h", academic_year_id: "y", room_type: "Double", building_category: "Suite", rate: 10000 }],
  residentDiningPlans: [
    { id: "r", academic_year_id: "y", plan_name: "Base", dining_dollars: 0, guest_passes: 0, fall_price: 2000, spring_price: 2100 },
  ],
  blockDiningPlans: [],
  parkingPermits: [],
  healthInsuranceRates: [],
  winter: {
    undergraduateTuition: [{ id: "wu", academic_year_id: "y", residency: "resident", credit_hours: 2, price: 150 }],
    graduateTuition: [{ id: "wg", academic_year_id: "y", residency: "resident", credit_hours: 2, price: 580 }],
    fees: { id: "wf", academic_year_id: "y", campus_services_rate: 116, distance_learning_rate: 55 },
  },
};

const fall: DashboardSelections = {
  ...DEFAULT_SELECTIONS,
  major: "Computer Science",
  semester: "fall",
  educationLevel: "undergraduate",
  residency: "resident",
  creditHours: 15,
  appliesDifferentialTuition: true,
  livingSituation: "on_campus",
  housing: { roomType: "Double", buildingCategory: "Suite" },
  residentDiningPlan: { planName: "Base" },
};

const winter: DashboardSelections = {
  ...DEFAULT_SELECTIONS,
  semester: "winter",
  educationLevel: "undergraduate",
  residency: "resident",
  creditHours: 2,
  winterClassFormat: "in_person",
};

describe("breakdownLines", () => {
  it("fall/spring show the six categories, and they add up to calculateTotal", () => {
    const lines = breakdownLines(fall, rates);
    expect(lines.map((l) => l.label)).toEqual(["Tuition", "Fees", "Housing", "Meals", "Parking", "Insurance"]);
    expect(lines.reduce((sum, l) => sum + l.amount, 0)).toBe(calculateTotal(fall, rates));
    expect(lines[0].amount).toBe(5000 + 1600); // tuition + differential folded together
  });

  it("winter shows only tuition and the winter fee, and they add up to calculateTotal", () => {
    const lines = breakdownLines(winter, rates);
    expect(lines).toEqual([
      { label: "Tuition", amount: 150 },
      { label: "Winter fee", amount: 116 },
    ]);
    expect(lines.reduce((sum, l) => sum + l.amount, 0)).toBe(calculateTotal(winter, rates));
  });
});

describe("selectionSummaryRows", () => {
  it("fall lists the regular selections (unchanged from the original bill)", () => {
    expect(selectionSummaryRows(fall)).toEqual([
      { label: "Major", value: "Computer Science" },
      { label: "Education level", value: "Undergraduate" },
      { label: "Residency", value: "Maryland resident" },
      { label: "Credit hours", value: "15" },
      { label: "Living situation", value: "On-campus" },
      { label: "Housing", value: "Double, Suite" },
      { label: "Dining plan", value: "Base (resident)" },
      { label: "Health insurance", value: "Not selected" },
    ]);
  });

  it("winter lists only what winter uses", () => {
    expect(selectionSummaryRows(winter)).toEqual([
      { label: "Education level", value: "Undergraduate" },
      { label: "Residency", value: "Maryland resident" },
      { label: "Credit hours", value: "2" },
      { label: "Class format", value: "At least one class in person (campus services fee)" },
    ]);
    expect(selectionSummaryRows({ ...winter, winterClassFormat: "online_only" })[3].value).toBe(
      "All classes online (distance learning fee)"
    );
  });
});

describe("semesters and tabs", () => {
  it("offers winter only when the year has winter data", () => {
    expect(availableSemesters(rates)).toEqual(["fall", "spring", "winter"]);
    expect(availableSemesters({ ...rates, winter: null })).toEqual(["fall", "spring"]);
  });

  it("treats a stale cached bundle with no winter property at all as winter-unavailable", () => {
    // A bundle cached before winter existed has no `winter` key (undefined, not null).
    const stale = { ...rates, winter: undefined } as unknown as RatesBundle;
    expect(availableSemesters(stale)).toEqual(["fall", "spring"]);
  });

  it("treats fall and spring as the same kind, and winter as different", () => {
    expect(sameSemesterKind("fall", "spring")).toBe(true);
    expect(sameSemesterKind("fall", "winter")).toBe(false);
    expect(sameSemesterKind("winter", "spring")).toBe(false);
  });

  it("winter shows only the Tuition and Aid & Grants tabs", () => {
    expect(getTabItems("winter").map((t) => t.id)).toEqual(["tuition", "aid"]);
    expect(getTabItems("fall").map((t) => t.id)).toEqual(["major", "tuition", "housing", "parking", "meals", "aid"]);
  });
});

describe("switching semester kind", () => {
  it("keeps only education level and residency, and resets everything else", () => {
    const reset = resetForSemesterChange(fall, "winter");
    expect(reset).toEqual({
      ...DEFAULT_SELECTIONS,
      semester: "winter",
      educationLevel: "undergraduate",
      residency: "resident",
    });
    expect(reset.housing).toBeNull();
    expect(reset.creditHours).toBeNull();
    expect(reset.major).toBe("");
  });

  it("also resets grants", () => {
    const withAid = { ...fall, grants: { ...fall.grants, pell: 1000 } };
    expect(resetForSemesterChange(withAid, "winter").grants.pell).toBe(0);
  });

  it("only warns when there is something to lose", () => {
    expect(hasProgressToLose(DEFAULT_SELECTIONS)).toBe(false);
    // Education level and residency survive the switch, so they never count.
    expect(hasProgressToLose({ ...DEFAULT_SELECTIONS, educationLevel: "graduate", residency: "resident" })).toBe(false);
    expect(hasProgressToLose({ ...DEFAULT_SELECTIONS, creditHours: 12 })).toBe(true);
    expect(hasProgressToLose(fall)).toBe(true);
    expect(hasProgressToLose({ ...DEFAULT_SELECTIONS, grants: { ...DEFAULT_SELECTIONS.grants, pell: 500 } })).toBe(true);
  });
});
