import { describe, expect, it } from "vitest";
import { EMPTY_SELECTIONS } from "@/lib/calculator/constants";
import { evaluateBudgetTool } from "./evaluateBudget";
import type { EvaluateBudgetResult } from "./evaluateBudget";
import type { RatesBundle, Selections } from "@/lib/calculator/types";

const rates: RatesBundle = {
  academicYear: {
    id: "year-1",
    label: "Test Year",
    is_current: true,
    undergrad_tuition_full_time_credit_threshold: 12,
    full_time_fee_credit_threshold: 9,
  },
  tuitionRates: [
    { id: "t1", academic_year_id: "year-1", residency: "non_resident", full_time_rate: 20000, per_credit_rate: 1200 },
  ],
  graduateTuitionRates: [],
  mandatoryFees: [{ id: "f1", academic_year_id: "year-1", part_time_rate: 500, full_time_rate: 1000 }],
  graduateFees: [],
  differentialTuition: [{ id: "d1", academic_year_id: "year-1", full_time_rate: 2000, per_credit_rate: 150 }],
  housingRates: [
    { id: "h1", academic_year_id: "year-1", room_type: "Double", building_category: "Traditional With AC", rate: 10000 },
  ],
  residentDiningPlans: [
    { id: "rd1", academic_year_id: "year-1", plan_name: "Preferred", dining_dollars: 200, guest_passes: 10, fall_price: 2600, spring_price: 2700 },
  ],
  blockDiningPlans: [],
  parkingPermits: [],
  healthInsuranceRates: [{ id: "i1", academic_year_id: "year-1", fall_price: 1000, spring_price: 1000 }],
};

// A student with everything already answered, including dining (Traditional
// With AC isn't an Apartment, so validateSelections requires one) -- the
// realistic "I've already set up my plan, now what if..." starting point.
const currentSelections: Selections = {
  ...EMPTY_SELECTIONS,
  semester: "fall",
  educationLevel: "undergraduate",
  residency: "non_resident",
  creditHours: 15,
  livingSituation: "on_campus",
  housing: { roomType: "Double", buildingCategory: "Traditional With AC" },
  residentDiningPlan: { planName: "Preferred" },
};

function resultOf(executeResult: Awaited<ReturnType<typeof evaluateBudgetTool.execute>>): EvaluateBudgetResult {
  if (!executeResult.ok) throw new Error(`Expected ok:true, got errors: ${executeResult.errors.join(", ")}`);
  return executeResult.result as EvaluateBudgetResult;
}

describe("evaluateBudgetTool -- happy path", () => {
  it("evaluates a single scenario against a budget using the real calculateTotal", async () => {
    const executeResult = await evaluateBudgetTool.execute(
      { targetBudget: 8000, scenarios: [{ label: "With Preferred plan", changes: { residentDiningPlan: { planName: "Preferred" } } }] },
      { rates, currentSelections }
    );
    const result = resultOf(executeResult);

    expect(result.scenarios).toHaveLength(1);
    const scenario = result.scenarios[0];
    expect(scenario.valid).toBe(true);
    // Tuition 20000 + differential 0 (not toggled) + fees 1000 + insurance 0 + housing 5000 (10000/2) + dining 2600 = 28600
    expect(scenario.total).toBe(28600);
    expect(scenario.underBudgetGross).toBe(false);
  });

  it("computes both gross and net totals when aid is present, per the 2026-09-16 decision", async () => {
    const withAid: Selections = { ...currentSelections, grants: { ...currentSelections.grants, pell: 20000 } };
    const executeResult = await evaluateBudgetTool.execute(
      { targetBudget: 10000, scenarios: [{ label: "Current plan", changes: {} }] },
      { rates, currentSelections: withAid }
    );
    const result = resultOf(executeResult);
    const scenario = result.scenarios[0];

    // 20000 tuition + 1000 fees + 5000 housing (10000/2) + 2600 dining (fall) = 28600
    expect(scenario.total).toBe(28600);
    expect(scenario.aid).toBe(20000);
    expect(scenario.netTotal).toBe(8600);
    expect(scenario.underBudgetGross).toBe(false);
    expect(scenario.underBudgetNet).toBe(true);
  });

  it("evaluates up to 3 scenarios in one call, each independently", async () => {
    const executeResult = await evaluateBudgetTool.execute(
      {
        scenarios: [
          { label: "Fall", changes: { semester: "fall" } },
          { label: "Spring", changes: { semester: "spring" } },
        ],
      },
      { rates, currentSelections }
    );
    const result = resultOf(executeResult);
    expect(result.scenarios).toHaveLength(2);
    expect(result.scenarios[0].valid).toBe(true);
    expect(result.scenarios[0].semester).toBe("fall");
    expect(result.scenarios[1].valid).toBe(true);
    expect(result.scenarios[1].semester).toBe("spring");
    // Spring dining is priced differently (spring_price: 2700 vs fall_price: 2600)
    expect(result.scenarios[0].total).not.toBe(result.scenarios[1].total);
  });

  it("returns null totals with real validation error messages when a scenario is still missing required fields", async () => {
    const executeResult = await evaluateBudgetTool.execute(
      { scenarios: [{ label: "Fresh start", changes: {} }] },
      { rates, currentSelections: EMPTY_SELECTIONS }
    );
    const result = resultOf(executeResult);
    const scenario = result.scenarios[0];

    expect(scenario.valid).toBe(false);
    expect(scenario.total).toBeNull();
    expect(scenario.validationErrors.length).toBeGreaterThan(0);
  });
});

describe("evaluateBudgetTool -- never mutates the real selections", () => {
  it("does not alter currentSelections -- only returns a description of the hypothetical", async () => {
    const before = JSON.stringify(currentSelections);
    await evaluateBudgetTool.execute(
      { scenarios: [{ label: "Hypothetical", changes: { residentDiningPlan: { planName: "Preferred" } } }] },
      { rates, currentSelections }
    );
    expect(JSON.stringify(currentSelections)).toBe(before);
  });
});

describe("evaluateBudgetTool -- rejects bad input the same way setSelections does", () => {
  it("rejects a nonexistent dining plan name via the same verifyAiPatch rigor", async () => {
    const executeResult = await evaluateBudgetTool.execute(
      { scenarios: [{ label: "Bad plan", changes: { residentDiningPlan: { planName: "Deluxe" } } }] },
      { rates, currentSelections }
    );
    expect(executeResult.ok).toBe(false);
  });

  it("rejects a request with zero scenarios", async () => {
    const executeResult = await evaluateBudgetTool.execute({ scenarios: [] }, { rates, currentSelections });
    expect(executeResult.ok).toBe(false);
  });

  it("rejects more than 3 scenarios", async () => {
    const executeResult = await evaluateBudgetTool.execute(
      { scenarios: [{ label: "A" }, { label: "B" }, { label: "C" }, { label: "D" }] },
      { rates, currentSelections }
    );
    expect(executeResult.ok).toBe(false);
  });

  it("ignores an invalid targetBudget rather than failing the whole call", async () => {
    const executeResult = await evaluateBudgetTool.execute(
      { targetBudget: "a lot", scenarios: [{ label: "Current plan", changes: {} }] },
      { rates, currentSelections }
    );
    const result = resultOf(executeResult);
    expect(result.targetBudget).toBeNull();
    expect(result.notes.length).toBeGreaterThan(0);
  });
});
