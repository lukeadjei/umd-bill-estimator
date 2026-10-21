import { describe, expect, it } from "vitest";
import { validateSelections } from "./validateSelections";
import type { RatesBundle, Selections } from "./types";

// Only what validateSelections reads: the winter credit cap (academicYear) and
// whether winter data exists at all (winter). Every rate table is irrelevant to it.
const winterRates: NonNullable<RatesBundle["winter"]> = {
  undergraduateTuition: [{ id: "wu1", academic_year_id: "year-1", residency: "resident", credit_hours: 1, price: 459 }],
  graduateTuition: [{ id: "wg1", academic_year_id: "year-1", residency: "resident", credit_hours: 1, price: 913 }],
  fees: { id: "wf1", academic_year_id: "year-1", campus_services_rate: 116, distance_learning_rate: 55 },
};

const rates: RatesBundle = {
  academicYear: {
    id: "year-1",
    label: "2026-2027",
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
  housingRates: [],
  residentDiningPlans: [],
  blockDiningPlans: [],
  parkingPermits: [],
  healthInsuranceRates: [],
  winter: winterRates,
};

// Valid on the face of it: on-campus in an Apartment (kitchen, so no dining plan
// required), nothing else selected. Tests mutate from here.
const baseOnCampus: Selections = {
  semester: "fall",
  winterClassFormat: null,
  educationLevel: "undergraduate",
  residency: "resident",
  creditHours: 15,
  appliesDifferentialTuition: false,
  insurance: false,
  livingSituation: "on_campus",
  housing: { roomType: "Double", buildingCategory: "Apartment" },
  residentDiningPlan: null,
  blockDiningPlan: null,
  parking: null,
  grants: { pell: 0, terrapinCommitment: 0, rawlingsEA: 0, misc: [] },
};

const baseCommuter: Selections = {
  ...baseOnCampus,
  livingSituation: "commuter",
  housing: null,
};

function fieldsOf(errors: { field: string }[]) {
  return errors.map((e) => e.field);
}

describe("validateSelections -- credit hours", () => {
  it("accepts the boundaries, 1 and 20", () => {
    expect(validateSelections({ ...baseOnCampus, creditHours: 1 }, rates).valid).toBe(true);
    expect(validateSelections({ ...baseOnCampus, creditHours: 20 }, rates).valid).toBe(true);
  });

  it("rejects below 1", () => {
    const result = validateSelections({ ...baseOnCampus, creditHours: 0 }, rates);
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("creditHours");
  });

  it("rejects above 20", () => {
    const result = validateSelections({ ...baseOnCampus, creditHours: 21 }, rates);
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("creditHours");
  });

  it("reports null credit hours as required, not as an out-of-bounds error", () => {
    const result = validateSelections({ ...baseOnCampus, creditHours: null }, rates);
    expect(result.valid).toBe(false);
    const creditHoursErrors = result.errors.filter((e) => e.field === "creditHours");
    expect(creditHoursErrors).toHaveLength(1);
    expect(creditHoursErrors[0].message).toMatch(/enter your credit hours/i);
  });
});

describe("validateSelections -- required fields not yet answered", () => {
  const untouched: Selections = {
    semester: "fall",
    winterClassFormat: null,
    educationLevel: null,
    residency: null,
    creditHours: null,
    appliesDifferentialTuition: false,
    insurance: false,
    livingSituation: null,
    housing: null,
    residentDiningPlan: null,
    blockDiningPlan: null,
    parking: null,
    grants: { pell: 0, terrapinCommitment: 0, rawlingsEA: 0, misc: [] },
  };

  it("reports every always-required field for a brand-new, untouched selection", () => {
    const result = validateSelections(untouched, rates);
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toEqual(
      expect.arrayContaining(["educationLevel", "residency", "creditHours", "livingSituation"])
    );
  });

  it("does not fall through to the on_campus housing-required check while livingSituation is unanswered", () => {
    // If null silently fell through to the "else" (on_campus) branch, this
    // would also report a "housing" error alongside "livingSituation" --
    // it should report only that living situation itself needs answering.
    const result = validateSelections(untouched, rates);
    expect(fieldsOf(result.errors)).not.toContain("housing");
  });

  it("does not misjudge parking eligibility while livingSituation is unanswered (the original reported bug)", () => {
    // Regression test: picking a parking permit before ever visiting the
    // Housing tab used to produce a misleading "on-campus students can only
    // buy Resident" / "commuter students can only buy Commuter" error against
    // a living-situation choice the user never actually made.
    const result = validateSelections({ ...untouched, parking: { permitType: "Commuter", term: "annual" } }, rates);
    expect(fieldsOf(result.errors)).not.toContain("parking");
    expect(fieldsOf(result.errors)).toContain("livingSituation");
  });
});

describe("validateSelections -- living situation vs. housing", () => {
  it("is valid: on-campus with housing selected", () => {
    expect(validateSelections(baseOnCampus, rates).valid).toBe(true);
  });

  it("is valid: commuter with no housing", () => {
    expect(validateSelections(baseCommuter, rates).valid).toBe(true);
  });

  it("rejects on-campus with no housing selected", () => {
    const result = validateSelections({ ...baseOnCampus, housing: null }, rates);
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("housing");
  });

  it("rejects commuter with a housing selection", () => {
    const result = validateSelections({
      ...baseCommuter,
      housing: { roomType: "Double", buildingCategory: "Apartment" },
    }, rates);
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("housing");
  });
});

describe("validateSelections -- dining plan requirement", () => {
  it("is valid: Apartment housing with no dining plan (optional)", () => {
    expect(validateSelections(baseOnCampus, rates).valid).toBe(true);
  });

  it("is valid: Apartment housing with a resident dining plan chosen anyway", () => {
    const result = validateSelections({ ...baseOnCampus, residentDiningPlan: { planName: "Base" } }, rates);
    expect(result.valid).toBe(true);
  });

  it("rejects non-Apartment housing with no dining plan at all", () => {
    const result = validateSelections({
      ...baseOnCampus,
      housing: { roomType: "Double", buildingCategory: "Traditional With AC" },
    }, rates);
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("residentDiningPlan");
  });

  it("rejects non-Apartment housing even when a block plan (not resident) is selected", () => {
    const result = validateSelections({
      ...baseOnCampus,
      housing: { roomType: "Double", buildingCategory: "Traditional With AC" },
      blockDiningPlan: { planLabel: "80 Block" },
    }, rates);
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("residentDiningPlan");
  });

  it("accepts non-Apartment housing with a resident dining plan selected", () => {
    const result = validateSelections({
      ...baseOnCampus,
      housing: { roomType: "Double", buildingCategory: "Traditional With AC" },
      residentDiningPlan: { planName: "Base" },
    }, rates);
    expect(result.valid).toBe(true);
  });
});

describe("validateSelections -- commuter dining restriction", () => {
  it("is valid: commuter with a block dining plan", () => {
    const result = validateSelections({ ...baseCommuter, blockDiningPlan: { planLabel: "80 Block" } }, rates);
    expect(result.valid).toBe(true);
  });

  it("rejects a commuter with a resident dining plan", () => {
    const result = validateSelections({ ...baseCommuter, residentDiningPlan: { planName: "Base" } }, rates);
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("residentDiningPlan");
  });
});

describe("validateSelections -- mutually exclusive dining plans", () => {
  it("rejects both a resident and a block plan set at once", () => {
    const result = validateSelections({
      ...baseOnCampus,
      residentDiningPlan: { planName: "Base" },
      blockDiningPlan: { planLabel: "80 Block" },
    }, rates);
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("diningPlan");
  });
});

describe("validateSelections -- parking eligibility", () => {
  it("accepts a Resident permit for on-campus students", () => {
    const result = validateSelections({ ...baseOnCampus, parking: { permitType: "Resident", term: "annual" } }, rates);
    expect(result.valid).toBe(true);
  });

  it("rejects a Commuter permit for on-campus students", () => {
    const result = validateSelections({ ...baseOnCampus, parking: { permitType: "Commuter", term: "annual" } }, rates);
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("parking");
  });

  it("accepts a Commuter permit for commuters", () => {
    const result = validateSelections({ ...baseCommuter, parking: { permitType: "Commuter", term: "annual" } }, rates);
    expect(result.valid).toBe(true);
  });

  it("accepts an Overnight Storage permit for commuters", () => {
    const result = validateSelections({
      ...baseCommuter,
      parking: { permitType: "Overnight Storage", term: "annual" },
    }, rates);
    expect(result.valid).toBe(true);
  });

  it("rejects a Resident permit for commuters", () => {
    const result = validateSelections({ ...baseCommuter, parking: { permitType: "Resident", term: "annual" } }, rates);
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("parking");
  });

  it("is valid when no parking is selected at all, for either living situation", () => {
    expect(validateSelections(baseOnCampus, rates).valid).toBe(true);
    expect(validateSelections(baseCommuter, rates).valid).toBe(true);
  });
});

describe("validateSelections -- multiple simultaneous errors", () => {
  it("reports every violated rule, not just the first one found", () => {
    const result = validateSelections({
      ...baseOnCampus,
      creditHours: 25,
      housing: null,
      parking: { permitType: "Commuter", term: "annual" },
    }, rates);
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toEqual(
      expect.arrayContaining(["creditHours", "housing", "parking"])
    );
    expect(result.errors.length).toBe(3);
  });
});

const winterBase: Selections = {
  ...baseCommuter,
  semester: "winter",
  creditHours: 3,
  winterClassFormat: "in_person",
  // Winter ignores these -- left at fall/spring-shaped values to prove it.
  livingSituation: null,
  housing: null,
};

describe("validateSelections -- winter session", () => {
  it("accepts a complete winter plan and ignores fall/spring-only fields", () => {
    expect(validateSelections(winterBase, rates).valid).toBe(true);
    // A stray on-campus housing selection would be an error in fall -- not in winter.
    expect(
      validateSelections({ ...winterBase, livingSituation: "on_campus", housing: { roomType: "Double", buildingCategory: "Suite" } }, rates).valid
    ).toBe(true);
  });

  it("limits credit hours to the cap on academic_years, not the semester maximum", () => {
    expect(validateSelections({ ...winterBase, creditHours: 4 }, rates).valid).toBe(true);
    const over = validateSelections({ ...winterBase, creditHours: 5 }, rates);
    expect(over.valid).toBe(false);
    expect(over.errors.find((e) => e.field === "creditHours")?.message).toBe("Credit hours must be between 1 and 4.");
    // Follows the database value: a different cap changes what is legal.
    const lowerCap: RatesBundle = { ...rates, academicYear: { ...rates.academicYear, winter_max_credit_hours: 3 } };
    expect(validateSelections({ ...winterBase, creditHours: 4 }, lowerCap).valid).toBe(false);
  });

  it("rejects zero and fractional credit hours", () => {
    expect(validateSelections({ ...winterBase, creditHours: 0 }, rates).valid).toBe(false);
    const fractional = validateSelections({ ...winterBase, creditHours: 2.5 }, rates);
    expect(fieldsOf(fractional.errors)).toContain("creditHours");
  });

  it("requires education level, residency, credit hours and the fee choice", () => {
    const result = validateSelections(
      { ...winterBase, educationLevel: null, residency: null, creditHours: null, winterClassFormat: null },
      rates
    );
    expect(fieldsOf(result.errors).sort()).toEqual(["creditHours", "educationLevel", "residency", "winterClassFormat"]);
  });

  it("reports winter as unavailable when the year has no winter data, without a nonsense credit range", () => {
    const noWinter: RatesBundle = { ...rates, winter: null };
    const result = validateSelections(winterBase, noWinter);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.message)).toContain("Winter Session isn't available for this academic year.");

    const noCap: RatesBundle = { ...rates, academicYear: { ...rates.academicYear, winter_max_credit_hours: null }, winter: null };
    const noCapResult = validateSelections(winterBase, noCap);
    expect(noCapResult.errors.some((e) => /between 1 and 0/.test(e.message))).toBe(false);
  });

  it("does not apply the winter cap to fall or spring", () => {
    expect(validateSelections({ ...baseOnCampus, creditHours: 12 }, rates).valid).toBe(true);
  });
});
