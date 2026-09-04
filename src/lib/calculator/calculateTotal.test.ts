import { describe, expect, it } from "vitest";
import {
  calculateDifferentialTuition,
  calculateDining,
  calculateFees,
  calculateHousing,
  calculateInsurance,
  calculateParking,
  calculateTotal,
  calculateTuition,
} from "./calculateTotal";
import type { RatesBundle, Selections } from "./types";

// Made-up but internally-consistent fixture numbers -- these aren't real UMD
// rates. Real fall/spring insurance figures are already confirmed in
// docs/umd-bill-estimator-getting-started-checklist.md, so those two are real.
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
    { id: "t2", academic_year_id: "year-1", residency: "non_resident", full_time_rate: 30000, per_credit_rate: 1200 },
  ],
  graduateTuitionRates: [
    { id: "gt1", academic_year_id: "year-1", residency: "resident", per_credit_rate: 600 },
    { id: "gt2", academic_year_id: "year-1", residency: "non_resident", per_credit_rate: 1500 },
  ],
  mandatoryFees: [{ id: "f1", academic_year_id: "year-1", part_time_rate: 500, full_time_rate: 1800 }],
  graduateFees: [{ id: "gf1", academic_year_id: "year-1", part_time_rate: 400, full_time_rate: 1500 }],
  differentialTuition: [{ id: "d1", academic_year_id: "year-1", full_time_rate: 2000, per_credit_rate: 150 }],
  housingRates: [
    { id: "h1", academic_year_id: "year-1", room_type: "Double", building_category: "Traditional With AC", rate: 10290 },
  ],
  residentDiningPlans: [
    { id: "rd1", academic_year_id: "year-1", plan_name: "Base", dining_dollars: 100, guest_passes: 5, fall_price: 2500, spring_price: 2600 },
  ],
  blockDiningPlans: [
    { id: "bd1", academic_year_id: "year-1", plan_label: "80 Block", meal_count: 80, dining_dollars: 50, price: 1200 },
  ],
  parkingPermits: [{ id: "p1", academic_year_id: "year-1", permit_type: "Commuter", term: "annual", price: 600 }],
  healthInsuranceRates: [{ id: "i1", academic_year_id: "year-1", fall_price: 1232, spring_price: 1707 }],
};

// A selections object with everything off/null, so each test only turns on what it's checking.
// calculateTotal is one semester at a time -- fall is just the arbitrary default here.
const baseSelections: Selections = {
  semester: "fall",
  educationLevel: "undergraduate",
  residency: "resident",
  creditHours: 15,
  appliesDifferentialTuition: false,
  insurance: false,
  livingSituation: "commuter",
  housing: null,
  residentDiningPlan: null,
  blockDiningPlan: null,
  parking: null,
};

describe("calculateTuition", () => {
  it("charges the flat rate for full-time undergrads", () => {
    expect(calculateTuition({ ...baseSelections, creditHours: 15 }, rates)).toBe(10000);
  });

  it("charges per-credit for part-time undergrads", () => {
    expect(calculateTuition({ ...baseSelections, creditHours: 6 }, rates)).toBe(6 * 400);
  });

  it("uses the non-resident rate", () => {
    expect(calculateTuition({ ...baseSelections, residency: "non_resident", creditHours: 15 }, rates)).toBe(30000);
  });

  it("is always per-credit for graduate students, even full-time credit loads", () => {
    expect(
      calculateTuition({ ...baseSelections, educationLevel: "graduate", creditHours: 15 }, rates)
    ).toBe(15 * 600);
  });

  it("is $0 when education level hasn't been answered yet", () => {
    expect(calculateTuition({ ...baseSelections, educationLevel: null }, rates)).toBe(0);
  });

  it("is $0 when residency hasn't been answered yet", () => {
    expect(calculateTuition({ ...baseSelections, residency: null }, rates)).toBe(0);
  });

  it("is $0 when credit hours haven't been set yet", () => {
    expect(calculateTuition({ ...baseSelections, creditHours: null }, rates)).toBe(0);
  });
});

describe("calculateDifferentialTuition", () => {
  it("is $0 when not applied", () => {
    expect(calculateDifferentialTuition(baseSelections, rates)).toBe(0);
  });

  it("is $0 for graduate students even if the flag is set", () => {
    expect(
      calculateDifferentialTuition({ ...baseSelections, educationLevel: "graduate", appliesDifferentialTuition: true }, rates)
    ).toBe(0);
  });

  it("charges the flat rate full-time", () => {
    expect(
      calculateDifferentialTuition({ ...baseSelections, appliesDifferentialTuition: true, creditHours: 15 }, rates)
    ).toBe(2000);
  });

  it("charges per-credit part-time", () => {
    expect(
      calculateDifferentialTuition({ ...baseSelections, appliesDifferentialTuition: true, creditHours: 6 }, rates)
    ).toBe(6 * 150);
  });

  it("is $0 when credit hours haven't been set yet, even with the flag on", () => {
    expect(
      calculateDifferentialTuition({ ...baseSelections, appliesDifferentialTuition: true, creditHours: null }, rates)
    ).toBe(0);
  });
});

describe("calculateFees", () => {
  it("charges the full-time undergrad rate at 9+ credits", () => {
    expect(calculateFees({ ...baseSelections, creditHours: 9 }, rates)).toBe(1800);
  });

  it("charges the part-time undergrad rate below 9 credits", () => {
    expect(calculateFees({ ...baseSelections, creditHours: 6 }, rates)).toBe(500);
  });

  it("uses the graduate fee table for graduate students", () => {
    expect(calculateFees({ ...baseSelections, educationLevel: "graduate", creditHours: 9 }, rates)).toBe(1500);
  });

  it("is $0 when education level hasn't been answered yet", () => {
    expect(calculateFees({ ...baseSelections, educationLevel: null }, rates)).toBe(0);
  });

  it("is $0 when credit hours haven't been set yet", () => {
    expect(calculateFees({ ...baseSelections, creditHours: null }, rates)).toBe(0);
  });
});

describe("calculateInsurance", () => {
  it("is $0 when not selected", () => {
    expect(calculateInsurance(baseSelections, rates)).toBe(0);
  });

  it("charges only the fall price when selected for fall", () => {
    expect(calculateInsurance({ ...baseSelections, semester: "fall", insurance: true }, rates)).toBe(1232);
  });

  it("charges only the spring price when selected for spring", () => {
    expect(calculateInsurance({ ...baseSelections, semester: "spring", insurance: true }, rates)).toBe(1707);
  });
});

describe("calculateHousing", () => {
  it("is $0 when no housing selected (commuter)", () => {
    expect(calculateHousing(baseSelections, rates)).toBe(0);
  });

  it("charges half the annual rate for one semester", () => {
    const withHousing: Selections = {
      ...baseSelections,
      housing: { roomType: "Double", buildingCategory: "Traditional With AC" },
    };
    expect(calculateHousing(withHousing, rates)).toBe(10290 / 2);
  });

  it("charges the same half-rate regardless of which semester", () => {
    const withHousing: Selections = {
      ...baseSelections,
      housing: { roomType: "Double", buildingCategory: "Traditional With AC" },
    };
    expect(calculateHousing({ ...withHousing, semester: "fall" }, rates)).toBe(
      calculateHousing({ ...withHousing, semester: "spring" }, rates)
    );
  });

  it("throws if the selection doesn't match any rate row", () => {
    const badHousing: Selections = { ...baseSelections, housing: { roomType: "Single", buildingCategory: "Apartment" } };
    expect(() => calculateHousing(badHousing, rates)).toThrow();
  });
});

describe("calculateDining", () => {
  it("is $0 when neither plan is selected", () => {
    expect(calculateDining(baseSelections, rates)).toBe(0);
  });

  it("charges only the fall price for a resident plan in fall", () => {
    const withPlan: Selections = { ...baseSelections, semester: "fall", residentDiningPlan: { planName: "Base" } };
    expect(calculateDining(withPlan, rates)).toBe(2500);
  });

  it("charges only the spring price for a resident plan in spring", () => {
    const withPlan: Selections = { ...baseSelections, semester: "spring", residentDiningPlan: { planName: "Base" } };
    expect(calculateDining(withPlan, rates)).toBe(2600);
  });

  it("returns the flat price for a block plan regardless of semester", () => {
    const withPlan: Selections = { ...baseSelections, blockDiningPlan: { planLabel: "80 Block" } };
    expect(calculateDining({ ...withPlan, semester: "fall" }, rates)).toBe(1200);
    expect(calculateDining({ ...withPlan, semester: "spring" }, rates)).toBe(1200);
  });
});

describe("calculateParking", () => {
  it("is $0 when no permit selected", () => {
    expect(calculateParking(baseSelections, rates)).toBe(0);
  });

  it("charges the full permit price in whichever semester, even for an annual term", () => {
    const withParking: Selections = { ...baseSelections, parking: { permitType: "Commuter", term: "annual" } };
    expect(calculateParking({ ...withParking, semester: "fall" }, rates)).toBe(600);
    expect(calculateParking({ ...withParking, semester: "spring" }, rates)).toBe(600);
  });
});

describe("calculateTotal", () => {
  it("sums every category for a fully-loaded fall scenario", () => {
    const fullSelections: Selections = {
      semester: "fall",
      educationLevel: "undergraduate",
      residency: "resident",
      creditHours: 15,
      appliesDifferentialTuition: true,
      insurance: true,
      livingSituation: "on_campus",
      housing: { roomType: "Double", buildingCategory: "Traditional With AC" },
      residentDiningPlan: { planName: "Base" },
      blockDiningPlan: null,
      parking: { permitType: "Commuter", term: "annual" },
    };

    const expected =
      10000 /* tuition */ +
      2000 /* differential */ +
      1800 /* fees */ +
      1232 /* insurance, fall only */ +
      10290 / 2 /* housing, half the annual rate */ +
      2500 /* dining, fall only */ +
      600; /* parking, full permit price */

    expect(calculateTotal(fullSelections, rates)).toBe(expected);
  });

  it("gives a different total for spring when insurance/dining prices differ by semester", () => {
    const fallSelections: Selections = {
      semester: "fall",
      educationLevel: "undergraduate",
      residency: "resident",
      creditHours: 15,
      appliesDifferentialTuition: false,
      insurance: true,
      livingSituation: "commuter",
      housing: null,
      residentDiningPlan: { planName: "Base" },
      blockDiningPlan: null,
      parking: null,
    };
    const springSelections: Selections = { ...fallSelections, semester: "spring" };

    expect(calculateTotal(fallSelections, rates)).not.toBe(calculateTotal(springSelections, rates));
  });

  it("treats every missing selection as $0, not an error, for a bare-minimum scenario", () => {
    // baseSelections: full-time undergrad tuition (10000) + full-time fees (1800), everything else null/off.
    expect(calculateTotal(baseSelections, rates)).toBe(10000 + 1800);
  });

  it("is exactly $0 for a brand-new visitor who hasn't answered anything yet", () => {
    const untouched: Selections = {
      semester: "fall",
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
    };
    expect(calculateTotal(untouched, rates)).toBe(0);
  });
});
