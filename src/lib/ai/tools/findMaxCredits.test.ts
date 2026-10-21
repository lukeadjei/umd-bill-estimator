import { describe, expect, it } from "vitest";
import { EMPTY_SELECTIONS } from "@/lib/calculator/constants";
import { calculateTotal } from "@/lib/calculator/calculateTotal";
import type { RatesBundle, Selections } from "@/lib/calculator/types";
import { findMaxCreditsTool } from "./findMaxCredits";
import type { FindMaxCreditsResult } from "./findMaxCredits";

// Chosen so the totals are easy to verify by hand. Undergrad resident: per-credit $400 below 12
// credits, flat $5,000 from 12; fees $400 below 9 credits, $900 from 9. So a commuter's total is:
//   n credits (1-8): 400n + 400    9: 4,500    10: 4,900    11: 5,300    12-20: 5,900
const rates: RatesBundle = {
  academicYear: {
    id: "y",
    label: "Test Year",
    is_current: true,
    undergrad_tuition_full_time_credit_threshold: 12,
    full_time_fee_credit_threshold: 9,
    winter_max_credit_hours: 4,
  },
  tuitionRates: [{ id: "t", academic_year_id: "y", residency: "resident", full_time_rate: 5000, per_credit_rate: 400 }],
  graduateTuitionRates: [],
  mandatoryFees: [{ id: "f", academic_year_id: "y", part_time_rate: 400, full_time_rate: 900 }],
  graduateFees: [],
  differentialTuition: [],
  housingRates: [{ id: "h", academic_year_id: "y", room_type: "Double", building_category: "Suite", rate: 10000 }],
  residentDiningPlans: [],
  blockDiningPlans: [],
  parkingPermits: [],
  healthInsuranceRates: [],
  // Deliberately non-linear: 2 credits is not 2 x the 1-credit price.
  winter: {
    undergraduateTuition: [
      { id: "w1", academic_year_id: "y", residency: "resident", credit_hours: 1, price: 100 },
      { id: "w2", academic_year_id: "y", residency: "resident", credit_hours: 2, price: 150 },
      { id: "w3", academic_year_id: "y", residency: "resident", credit_hours: 3, price: 190 },
      { id: "w4", academic_year_id: "y", residency: "resident", credit_hours: 4, price: 220 },
    ],
    graduateTuition: [],
    fees: { id: "wf", academic_year_id: "y", campus_services_rate: 116, distance_learning_rate: 55 },
  },
};

const commuter: Selections = {
  ...EMPTY_SELECTIONS,
  educationLevel: "undergraduate",
  residency: "resident",
  livingSituation: "commuter",
};

async function run(args: unknown, currentSelections: Selections = commuter): Promise<FindMaxCreditsResult> {
  const result = await findMaxCreditsTool.execute(args, { rates, currentSelections });
  if (!result.ok) throw new Error(`Expected ok:true, got: ${result.errors.join(" ")}`);
  return result.result as FindMaxCreditsResult;
}

describe("findMaxCredits -- fall/spring", () => {
  it("finds the most credits that fit under a budget (the 'under $5,000' question)", async () => {
    const result = await run({ targetBudget: 5000 });
    expect(result.status).toBe("found");
    expect(result.maxCreditHours).toBe(10);
    expect(result.atMax?.total).toBe(4900);
    // And it shows what the very next credit would cost, so the answer is checkable.
    expect(result.firstOver).toEqual({ creditHours: 11, total: 5300, netTotal: 5300 });
  });

  it("never reports a credit count whose total is over the budget", async () => {
    for (const budget of [800, 1500, 3600, 4500, 4899, 5000, 5299, 5300, 5899, 5900, 100000]) {
      const result = await run({ targetBudget: budget });
      if (result.status === "found") {
        expect(result.atMax!.netTotal).toBeLessThanOrEqual(budget);
        // ...and it's genuinely the largest: one more credit would not fit.
        if (result.firstOver) expect(result.firstOver.netTotal).toBeGreaterThan(budget);
      }
    }
  });

  it("agrees with calculateTotal for the credit count it picks", async () => {
    const result = await run({ targetBudget: 5000 });
    expect(result.atMax?.total).toBe(calculateTotal({ ...commuter, creditHours: result.maxCreditHours }, rates));
  });

  it("flat full-time tuition: reports the semester max and where the same price starts", async () => {
    const result = await run({ targetBudget: 6000 });
    expect(result.maxCreditHours).toBe(20);
    expect(result.atMax?.total).toBe(5900);
    expect(result.sameCostFrom).toBe(12);
    expect(result.firstOver).toBeNull();
  });

  it("says none fit (with the cheapest option) when even the fewest credits is over budget", async () => {
    const result = await run({ targetBudget: 700 });
    expect(result.status).toBe("none_fit");
    expect(result.maxCreditHours).toBeNull();
    expect(result.cheapest).toEqual({ creditHours: 1, total: 800, netTotal: 800 });
  });

  it("compares against what the student owes AFTER aid", async () => {
    const withAid: Selections = { ...commuter, grants: { ...commuter.grants, pell: 1000 } };
    const result = await run({ targetBudget: 4000 }, withAid);
    // Gross 4,900 / net 3,900 fits 4,000; gross 5,300 / net 4,300 does not.
    expect(result.maxCreditHours).toBe(10);
    expect(result.atMax).toEqual({ creditHours: 10, total: 4900, netTotal: 3900 });
    expect(result.aid).toBe(1000);
  });

  it("holds `changes` fixed (e.g. a different semester's choices) on top of the known plan", async () => {
    const onCampus: Selections = { ...commuter, livingSituation: "on_campus", housing: { roomType: "Double", buildingCategory: "Suite" } };
    // Suite needs a resident dining plan, which this fixture doesn't have -> needs info, not a number.
    const result = await run({ targetBudget: 9000 }, onCampus);
    expect(result.status).toBe("needs_info");
  });
});

describe("findMaxCredits -- missing context", () => {
  it("asks for what's missing instead of inventing a number", async () => {
    const result = await run({ targetBudget: 5000 }, EMPTY_SELECTIONS);
    expect(result.status).toBe("needs_info");
    expect(result.maxCreditHours).toBeNull();
    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        "Select undergraduate or graduate.",
        "Select Maryland resident or non-resident.",
        "Select whether you're living on-campus or commuting.",
      ])
    );
  });

  it("does not treat missing credit hours as a problem (that's what it solves for)", async () => {
    const result = await run({ targetBudget: 5000 }, { ...commuter, creditHours: null });
    expect(result.status).toBe("found");
  });
});

describe("findMaxCredits -- winter", () => {
  const winterPlan: Selections = {
    ...EMPTY_SELECTIONS,
    semester: "winter",
    educationLevel: "undergraduate",
    residency: "resident",
    winterClassFormat: "in_person",
  };

  it("searches the winter credit range from the database cap, looking prices up", async () => {
    // Totals incl. the $116 campus fee: 1 -> 216, 2 -> 266, 3 -> 306, 4 -> 336.
    const result = await run({ targetBudget: 300 }, winterPlan);
    expect(result.creditRange).toEqual({ min: 1, max: 4 });
    expect(result.maxCreditHours).toBe(2);
    expect(result.atMax?.total).toBe(266);
    expect(result.firstOver?.total).toBe(306);
  });

  it("needs the class format before it can price winter", async () => {
    const result = await run({ targetBudget: 300 }, { ...winterPlan, winterClassFormat: null });
    expect(result.status).toBe("needs_info");
    expect(result.validationErrors.join(" ")).toMatch(/in person or all of them are online/);
  });

  it("can price a switch to winter as a hypothetical without touching the plan", async () => {
    const result = await run({ targetBudget: 300, changes: { semester: "winter", winterClassFormat: "online_only" } });
    // Online-only fee is $55: 1 -> 155, 2 -> 205, 3 -> 245, 4 -> 275 -- all fit under 300.
    expect(result.semester).toBe("winter");
    expect(result.maxCreditHours).toBe(4);
    expect(result.atMax?.total).toBe(275);
  });

  it("rejects fall-only fields in a winter question so the model corrects itself", async () => {
    const result = await findMaxCreditsTool.execute(
      { targetBudget: 300, changes: { housing: { roomType: "Double", buildingCategory: "Suite" } } },
      { rates, currentSelections: winterPlan }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/housing doesn't apply to Winter/);
  });
});

describe("findMaxCredits -- bad input", () => {
  it("requires a numeric, non-negative budget", async () => {
    for (const bad of [undefined, "5000", -1, NaN]) {
      const result = await findMaxCreditsTool.execute({ targetBudget: bad }, { rates, currentSelections: commuter });
      expect(result.ok).toBe(false);
    }
  });

  it("refuses creditHours inside changes, since that is what it solves for", async () => {
    const result = await findMaxCreditsTool.execute(
      { targetBudget: 5000, changes: { creditHours: 12 } },
      { rates, currentSelections: commuter }
    );
    expect(result.ok).toBe(false);
  });
});
