import { describe, expect, it } from "vitest";
import { validateSelections } from "./validateSelections";
import type { Selections } from "./types";

// Valid on the face of it: on-campus in an Apartment (kitchen, so no dining plan
// required), nothing else selected. Tests mutate from here.
const baseOnCampus: Selections = {
  semester: "fall",
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
    expect(validateSelections({ ...baseOnCampus, creditHours: 1 }).valid).toBe(true);
    expect(validateSelections({ ...baseOnCampus, creditHours: 20 }).valid).toBe(true);
  });

  it("rejects below 1", () => {
    const result = validateSelections({ ...baseOnCampus, creditHours: 0 });
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("creditHours");
  });

  it("rejects above 20", () => {
    const result = validateSelections({ ...baseOnCampus, creditHours: 21 });
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("creditHours");
  });
});

describe("validateSelections -- living situation vs. housing", () => {
  it("is valid: on-campus with housing selected", () => {
    expect(validateSelections(baseOnCampus).valid).toBe(true);
  });

  it("is valid: commuter with no housing", () => {
    expect(validateSelections(baseCommuter).valid).toBe(true);
  });

  it("rejects on-campus with no housing selected", () => {
    const result = validateSelections({ ...baseOnCampus, housing: null });
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("housing");
  });

  it("rejects commuter with a housing selection", () => {
    const result = validateSelections({
      ...baseCommuter,
      housing: { roomType: "Double", buildingCategory: "Apartment" },
    });
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("housing");
  });
});

describe("validateSelections -- dining plan requirement", () => {
  it("is valid: Apartment housing with no dining plan (optional)", () => {
    expect(validateSelections(baseOnCampus).valid).toBe(true);
  });

  it("is valid: Apartment housing with a resident dining plan chosen anyway", () => {
    const result = validateSelections({ ...baseOnCampus, residentDiningPlan: { planName: "Base" } });
    expect(result.valid).toBe(true);
  });

  it("rejects non-Apartment housing with no dining plan at all", () => {
    const result = validateSelections({
      ...baseOnCampus,
      housing: { roomType: "Double", buildingCategory: "Traditional With AC" },
    });
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("residentDiningPlan");
  });

  it("rejects non-Apartment housing even when a block plan (not resident) is selected", () => {
    const result = validateSelections({
      ...baseOnCampus,
      housing: { roomType: "Double", buildingCategory: "Traditional With AC" },
      blockDiningPlan: { planLabel: "80 Block" },
    });
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("residentDiningPlan");
  });

  it("accepts non-Apartment housing with a resident dining plan selected", () => {
    const result = validateSelections({
      ...baseOnCampus,
      housing: { roomType: "Double", buildingCategory: "Traditional With AC" },
      residentDiningPlan: { planName: "Base" },
    });
    expect(result.valid).toBe(true);
  });
});

describe("validateSelections -- commuter dining restriction", () => {
  it("is valid: commuter with a block dining plan", () => {
    const result = validateSelections({ ...baseCommuter, blockDiningPlan: { planLabel: "80 Block" } });
    expect(result.valid).toBe(true);
  });

  it("rejects a commuter with a resident dining plan", () => {
    const result = validateSelections({ ...baseCommuter, residentDiningPlan: { planName: "Base" } });
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
    });
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("diningPlan");
  });
});

describe("validateSelections -- parking eligibility", () => {
  it("accepts a Resident permit for on-campus students", () => {
    const result = validateSelections({ ...baseOnCampus, parking: { permitType: "Resident", term: "annual" } });
    expect(result.valid).toBe(true);
  });

  it("rejects a Commuter permit for on-campus students", () => {
    const result = validateSelections({ ...baseOnCampus, parking: { permitType: "Commuter", term: "annual" } });
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("parking");
  });

  it("accepts a Commuter permit for commuters", () => {
    const result = validateSelections({ ...baseCommuter, parking: { permitType: "Commuter", term: "annual" } });
    expect(result.valid).toBe(true);
  });

  it("accepts an Overnight Storage permit for commuters", () => {
    const result = validateSelections({
      ...baseCommuter,
      parking: { permitType: "Overnight Storage", term: "annual" },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects a Resident permit for commuters", () => {
    const result = validateSelections({ ...baseCommuter, parking: { permitType: "Resident", term: "annual" } });
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toContain("parking");
  });

  it("is valid when no parking is selected at all, for either living situation", () => {
    expect(validateSelections(baseOnCampus).valid).toBe(true);
    expect(validateSelections(baseCommuter).valid).toBe(true);
  });
});

describe("validateSelections -- multiple simultaneous errors", () => {
  it("reports every violated rule, not just the first one found", () => {
    const result = validateSelections({
      ...baseOnCampus,
      creditHours: 25,
      housing: null,
      parking: { permitType: "Commuter", term: "annual" },
    });
    expect(result.valid).toBe(false);
    expect(fieldsOf(result.errors)).toEqual(
      expect.arrayContaining(["creditHours", "housing", "parking"])
    );
    expect(result.errors.length).toBe(3);
  });
});
