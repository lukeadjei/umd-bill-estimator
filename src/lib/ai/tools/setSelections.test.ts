import { describe, expect, it } from "vitest";
import { EMPTY_SELECTIONS } from "@/lib/calculator/constants";
import { buildAiPatchToolSchema, verifyAiPatch } from "@/lib/calculator/verifyAiPatch";
import type { RatesBundle, Selections } from "@/lib/calculator/types";
import { setSelectionsTool } from "./setSelections";

const withWinter: RatesBundle = {
  academicYear: {
    id: "y",
    label: "Test Year",
    is_current: true,
    undergrad_tuition_full_time_credit_threshold: 12,
    full_time_fee_credit_threshold: 9,
    winter_max_credit_hours: 4,
  },
  tuitionRates: [],
  graduateTuitionRates: [],
  mandatoryFees: [],
  graduateFees: [],
  differentialTuition: [],
  housingRates: [{ id: "h", academic_year_id: "y", room_type: "Double", building_category: "Suite", rate: 10000 }],
  residentDiningPlans: [],
  blockDiningPlans: [],
  parkingPermits: [],
  healthInsuranceRates: [],
  winter: {
    undergraduateTuition: [{ id: "w", academic_year_id: "y", residency: "resident", credit_hours: 1, price: 100 }],
    graduateTuition: [],
    fees: { id: "wf", academic_year_id: "y", campus_services_rate: 116, distance_learning_rate: 55 },
  },
};
const withoutWinter: RatesBundle = { ...withWinter, winter: null };

const fallPlan: Selections = {
  ...EMPTY_SELECTIONS,
  educationLevel: "undergraduate",
  residency: "resident",
  creditHours: 15,
  livingSituation: "commuter",
};
const winterPlan: Selections = { ...EMPTY_SELECTIONS, semester: "winter", educationLevel: "undergraduate", residency: "resident" };

async function run(args: unknown, currentSelections: Selections, rates: RatesBundle = withWinter) {
  return setSelectionsTool.execute(args, { rates, currentSelections });
}

describe("winter in the AI patch schema and verification", () => {
  it("offers Winter only when the year has winter data", () => {
    const semesterEnum = (rates: RatesBundle) =>
      ((buildAiPatchToolSchema(rates) as { properties: { semester: { enum: string[] } } }).properties.semester.enum);
    expect(semesterEnum(withWinter)).toEqual(["fall", "spring", "winter"]);
    expect(semesterEnum(withoutWinter)).toEqual(["fall", "spring"]);
  });

  it("accepts winter and the class format, rejects them when winter is unavailable", () => {
    expect(verifyAiPatch({ semester: "winter", winterClassFormat: "online_only" }, withWinter)).toEqual({
      ok: true,
      patch: { semester: "winter", winterClassFormat: "online_only" },
    });
    expect(verifyAiPatch({ semester: "winter" }, withoutWinter).ok).toBe(false);
    expect(verifyAiPatch({ winterClassFormat: "hybrid" }, withWinter).ok).toBe(false);
  });
});

describe("setSelections guards", () => {
  it("applies a normal patch unchanged", async () => {
    expect(await run({ creditHours: 12 }, fallPlan)).toEqual({ ok: true, result: { creditHours: 12 } });
  });

  it("refuses to switch to winter over an existing plan (it would clear it)", async () => {
    const result = await run({ semester: "winter" }, fallPlan);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/would clear the student's current plan/);
      expect(result.errors[0]).toMatch(/semester buttons/);
    }
  });

  it("allows the switch when there is nothing to lose", async () => {
    const nearlyEmpty: Selections = { ...EMPTY_SELECTIONS, educationLevel: "graduate", residency: "resident" };
    expect(await run({ semester: "winter", creditHours: 3, winterClassFormat: "in_person" }, nearlyEmpty)).toEqual({
      ok: true,
      result: { semester: "winter", creditHours: 3, winterClassFormat: "in_person" },
    });
  });

  it("allows fall <-> spring over an existing plan (same kind of bill)", async () => {
    expect((await run({ semester: "spring" }, fallPlan)).ok).toBe(true);
  });

  it("refuses fields Winter ignores, naming them", async () => {
    const result = await run({ housing: { roomType: "Double", buildingCategory: "Suite" }, insurance: true }, winterPlan);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/housing/);
      expect(result.errors[0]).toMatch(/insurance/);
      expect(result.errors[0]).toMatch(/don't apply to Winter Session/);
    }
  });

  it("refuses the winter fee choice outside winter", async () => {
    const result = await run({ winterClassFormat: "in_person" }, fallPlan);
    expect(result.ok).toBe(false);
  });

  it("limits winter credit hours to the database cap, and fall to its own range", async () => {
    const tooMany = await run({ creditHours: 12 }, winterPlan);
    expect(tooMany.ok).toBe(false);
    if (!tooMany.ok) expect(tooMany.errors[0]).toMatch(/Winter allows 1 to 4 credit hours; 12 isn't possible/);
    expect((await run({ creditHours: 4 }, winterPlan)).ok).toBe(true);
    expect((await run({ creditHours: 18 }, fallPlan)).ok).toBe(true);
  });
});
