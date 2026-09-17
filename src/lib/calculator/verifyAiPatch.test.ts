import { describe, expect, it } from "vitest";
import { buildAiPatchToolSchema, verifyAiPatch } from "./verifyAiPatch";
import type { RatesBundle } from "./types";

// Same fixture shape/conventions as calculateTotal.test.ts -- made-up but
// internally-consistent numbers, real column shapes.
const rates: RatesBundle = {
  academicYear: {
    id: "year-1",
    label: "Test Year",
    is_current: true,
    undergrad_tuition_full_time_credit_threshold: 12,
    full_time_fee_credit_threshold: 9,
  },
  tuitionRates: [
    { id: "t1", academic_year_id: "year-1", residency: "resident", full_time_rate: 10000, per_credit_rate: 400 },
  ],
  graduateTuitionRates: [{ id: "gt1", academic_year_id: "year-1", residency: "resident", per_credit_rate: 600 }],
  mandatoryFees: [{ id: "f1", academic_year_id: "year-1", part_time_rate: 500, full_time_rate: 1800 }],
  graduateFees: [{ id: "gf1", academic_year_id: "year-1", part_time_rate: 400, full_time_rate: 1500 }],
  differentialTuition: [{ id: "d1", academic_year_id: "year-1", full_time_rate: 2000, per_credit_rate: 150 }],
  housingRates: [
    { id: "h1", academic_year_id: "year-1", room_type: "Double", building_category: "Traditional With AC", rate: 10290 },
    { id: "h2", academic_year_id: "year-1", room_type: "Single", building_category: "Apartment", rate: 12000 },
  ],
  residentDiningPlans: [
    { id: "rd1", academic_year_id: "year-1", plan_name: "Base", dining_dollars: 100, guest_passes: 5, fall_price: 2500, spring_price: 2600 },
  ],
  blockDiningPlans: [
    { id: "bd1", academic_year_id: "year-1", plan_label: "80 Block", meal_count: 80, dining_dollars: 50, price: 1200 },
  ],
  parkingPermits: [
    { id: "p1", academic_year_id: "year-1", permit_type: "Commuter", term: "annual", price: 600 },
    { id: "p2", academic_year_id: "year-1", permit_type: "Resident", term: "annual", price: 900 },
  ],
  healthInsuranceRates: [{ id: "i1", academic_year_id: "year-1", fall_price: 1232, spring_price: 1707 }],
};

describe("verifyAiPatch -- scalar fields", () => {
  it("accepts a well-formed patch with several valid fields", () => {
    const result = verifyAiPatch(
      { residency: "non_resident", creditHours: 15, livingSituation: "commuter" },
      rates
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.patch).toEqual({ residency: "non_resident", creditHours: 15, livingSituation: "commuter" });
    }
  });

  it("accepts an empty patch (model chose to set nothing)", () => {
    expect(verifyAiPatch({}, rates)).toEqual({ ok: true, patch: {} });
  });

  it("rejects a residency value outside the fixed enum", () => {
    const result = verifyAiPatch({ residency: "martian" }, rates);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes("residency"))).toBe(true);
  });

  it("rejects credit hours outside the shared bounds", () => {
    const result = verifyAiPatch({ creditHours: 21 }, rates);
    expect(result.ok).toBe(false);
  });

  it("rejects a non-integer credit hours value", () => {
    const result = verifyAiPatch({ creditHours: 12.5 }, rates);
    expect(result.ok).toBe(false);
  });

  it("rejects an unrecognized field -- e.g. a computed dollar amount the AI has no business setting", () => {
    const result = verifyAiPatch({ total: 6417.5 }, rates);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes("total"))).toBe(true);
  });

  it("rejects the raw arguments not being an object at all", () => {
    expect(verifyAiPatch("not an object", rates).ok).toBe(false);
    expect(verifyAiPatch(null, rates).ok).toBe(false);
    expect(verifyAiPatch(["array"], rates).ok).toBe(false);
  });
});

describe("verifyAiPatch -- housing (composite, must match a real row)", () => {
  it("accepts a real roomType/buildingCategory pair", () => {
    const result = verifyAiPatch({ housing: { roomType: "Double", buildingCategory: "Traditional With AC" } }, rates);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.patch.housing).toEqual({ roomType: "Double", buildingCategory: "Traditional With AC" });
  });

  it("rejects a syntactically plausible but non-existent combination -- the exact class of bug this exists to catch", () => {
    // Double only exists under Traditional With AC in this fixture, not Apartment.
    const result = verifyAiPatch({ housing: { roomType: "Double", buildingCategory: "Apartment" } }, rates);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes("housing"))).toBe(true);
  });

  it("rejects housing with only one of the two required fields", () => {
    const result = verifyAiPatch({ housing: { roomType: "Double" } }, rates);
    expect(result.ok).toBe(false);
  });
});

describe("verifyAiPatch -- dining and parking (composite/lookup fields)", () => {
  it("accepts a real resident dining plan name", () => {
    const result = verifyAiPatch({ residentDiningPlan: { planName: "Base" } }, rates);
    expect(result.ok).toBe(true);
  });

  it("rejects a resident dining plan name that doesn't exist", () => {
    const result = verifyAiPatch({ residentDiningPlan: { planName: "Deluxe" } }, rates);
    expect(result.ok).toBe(false);
  });

  it("accepts a real block dining plan label", () => {
    expect(verifyAiPatch({ blockDiningPlan: { planLabel: "80 Block" } }, rates).ok).toBe(true);
  });

  it("accepts a real permitType/term pair", () => {
    const result = verifyAiPatch({ parking: { permitType: "Resident", term: "annual" } }, rates);
    expect(result.ok).toBe(true);
  });

  it("rejects a permitType/term pair with no matching rate row", () => {
    const result = verifyAiPatch({ parking: { permitType: "Resident", term: "fall" } }, rates);
    expect(result.ok).toBe(false);
  });
});

describe("verifyAiPatch -- does not enforce cross-field legality", () => {
  it("accepts residentDiningPlan and blockDiningPlan set together -- validateSelections' job, not this function's", () => {
    const result = verifyAiPatch(
      { residentDiningPlan: { planName: "Base" }, blockDiningPlan: { planLabel: "80 Block" } },
      rates
    );
    expect(result.ok).toBe(true);
  });
});

describe("buildAiPatchToolSchema", () => {
  it("derives enum values from the live RatesBundle rather than hardcoding them", () => {
    const schema = buildAiPatchToolSchema(rates) as {
      properties: { housing: { properties: { roomType: { enum: string[] } } } };
    };
    expect(schema.properties.housing.properties.roomType.enum).toEqual(["Double", "Single"]);
  });

  it("never exposes a grants field -- excluded from the AI-writable surface entirely", () => {
    const schema = buildAiPatchToolSchema(rates) as { properties: Record<string, unknown> };
    expect(schema.properties.grants).toBeUndefined();
  });
});
