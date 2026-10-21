import { describe, expect, it } from "vitest";
import { calculateAid, calculateNetTotal, calculateTotal } from "./calculateTotal";
import { calculateWinterFee, calculateWinterTuition } from "./calculateWinter";
import { SEMESTER_CONFIG, semesterPrices } from "./semesterConfig";
import { SEMESTERS } from "./constants";
import type { RatesBundle, Selections } from "./types";

// Deliberately NOT linear (2 credits is not 2 x the 1-credit price) so these
// tests prove the code looks the published total up by credit count and never
// multiplies a per-credit rate.
const winterRates: NonNullable<RatesBundle["winter"]> = {
  undergraduateTuition: [
    { id: "ur1", academic_year_id: "y", residency: "resident", credit_hours: 1, price: 100 },
    { id: "ur2", academic_year_id: "y", residency: "resident", credit_hours: 2, price: 150 },
    { id: "ur3", academic_year_id: "y", residency: "resident", credit_hours: 3, price: 190 },
    { id: "ur4", academic_year_id: "y", residency: "resident", credit_hours: 4, price: 220 },
    { id: "un1", academic_year_id: "y", residency: "non_resident", credit_hours: 1, price: 500 },
    { id: "un2", academic_year_id: "y", residency: "non_resident", credit_hours: 2, price: 900 },
  ],
  graduateTuition: [
    { id: "gr1", academic_year_id: "y", residency: "resident", credit_hours: 1, price: 300 },
    { id: "gr2", academic_year_id: "y", residency: "resident", credit_hours: 2, price: 580 },
    { id: "gn1", academic_year_id: "y", residency: "non_resident", credit_hours: 1, price: 700 },
  ],
  fees: { id: "wf", academic_year_id: "y", campus_services_rate: 116, distance_learning_rate: 55 },
};

const rates: RatesBundle = {
  academicYear: {
    id: "y",
    label: "2026-2027",
    is_current: true,
    undergrad_tuition_full_time_credit_threshold: 12,
    full_time_fee_credit_threshold: 9,
    winter_max_credit_hours: 4,
  },
  tuitionRates: [{ id: "t1", academic_year_id: "y", residency: "resident", full_time_rate: 5000, per_credit_rate: 400 }],
  graduateTuitionRates: [],
  mandatoryFees: [{ id: "m1", academic_year_id: "y", part_time_rate: 400, full_time_rate: 900 }],
  graduateFees: [],
  differentialTuition: [],
  housingRates: [{ id: "h1", academic_year_id: "y", room_type: "Double", building_category: "Suite", rate: 10000 }],
  residentDiningPlans: [],
  blockDiningPlans: [],
  parkingPermits: [],
  healthInsuranceRates: [{ id: "i1", academic_year_id: "y", fall_price: 1000, spring_price: 1100 }],
  winter: winterRates,
};

const winter: Selections = {
  semester: "winter",
  winterClassFormat: "in_person",
  educationLevel: "undergraduate",
  residency: "resident",
  creditHours: 2,
  appliesDifferentialTuition: false,
  insurance: false,
  livingSituation: null,
  housing: null,
  residentDiningPlan: null,
  blockDiningPlan: null,
  parking: null,
  grants: { pell: 0, terrapinCommitment: 0, rawlingsEA: 0, misc: [] },
};

describe("calculateWinterTuition", () => {
  it("looks up the published total for the credit count -- never multiplies", () => {
    expect(calculateWinterTuition({ ...winter, creditHours: 1 }, rates)).toBe(100);
    expect(calculateWinterTuition({ ...winter, creditHours: 2 }, rates)).toBe(150); // not 200
    expect(calculateWinterTuition({ ...winter, creditHours: 3 }, rates)).toBe(190);
  });

  it("picks the table by education level and the row by residency", () => {
    expect(calculateWinterTuition({ ...winter, residency: "non_resident", creditHours: 2 }, rates)).toBe(900);
    expect(calculateWinterTuition({ ...winter, educationLevel: "graduate", creditHours: 2 }, rates)).toBe(580);
    expect(
      calculateWinterTuition({ ...winter, educationLevel: "graduate", residency: "non_resident", creditHours: 1 }, rates)
    ).toBe(700);
  });

  it("prices a missing selection as $0 (validation decides if it's required)", () => {
    expect(calculateWinterTuition({ ...winter, educationLevel: null }, rates)).toBe(0);
    expect(calculateWinterTuition({ ...winter, residency: null }, rates)).toBe(0);
    expect(calculateWinterTuition({ ...winter, creditHours: null }, rates)).toBe(0);
  });

  it("prices a credit count outside the chart as $0 instead of throwing", () => {
    expect(calculateWinterTuition({ ...winter, creditHours: 9 }, rates)).toBe(0);
    expect(calculateWinterTuition({ ...winter, creditHours: 2.5 }, rates)).toBe(0);
  });

  it("prices $0 when the year has no winter rates", () => {
    expect(calculateWinterTuition(winter, { ...rates, winter: null })).toBe(0);
  });
});

describe("calculateWinterFee", () => {
  it("charges only the campus services fee for any in-person class", () => {
    expect(calculateWinterFee({ ...winter, winterClassFormat: "in_person" }, rates)).toBe(116);
  });

  it("charges only the distance learning fee when every class is online", () => {
    expect(calculateWinterFee({ ...winter, winterClassFormat: "online_only" }, rates)).toBe(55);
  });

  it("is $0 until the student chooses, and when the year has no winter rates", () => {
    expect(calculateWinterFee({ ...winter, winterClassFormat: null }, rates)).toBe(0);
    expect(calculateWinterFee(winter, { ...rates, winter: null })).toBe(0);
  });
});

describe("calculateTotal -- winter", () => {
  it("is winter tuition plus the winter fee, nothing else", () => {
    expect(calculateTotal({ ...winter, creditHours: 3, winterClassFormat: "online_only" }, rates)).toBe(190 + 55);
  });

  it("ignores every fall/spring-only selection", () => {
    const cluttered: Selections = {
      ...winter,
      insurance: true,
      appliesDifferentialTuition: true,
      livingSituation: "on_campus",
      housing: { roomType: "Double", buildingCategory: "Suite" },
    };
    expect(calculateTotal(cluttered, rates)).toBe(calculateTotal(winter, rates));
    expect(calculateTotal(winter, rates)).toBe(150 + 116);
  });

  it("applies aid like any other term, and a negative net total is a refund", () => {
    const withAid: Selections = { ...winter, grants: { ...winter.grants, pell: 1000 } };
    expect(calculateAid(withAid)).toBe(1000);
    expect(calculateNetTotal(withAid, rates)).toBe(150 + 116 - 1000);
  });

  it("leaves fall and spring pricing untouched by the winter fee choice", () => {
    const fall: Selections = { ...winter, semester: "fall", winterClassFormat: "in_person", creditHours: 15 };
    const withoutChoice: Selections = { ...fall, winterClassFormat: null };
    expect(calculateTotal(fall, rates)).toBe(calculateTotal(withoutChoice, rates));
  });
});

describe("SEMESTER_CONFIG", () => {
  it("has an entry for every semester", () => {
    expect(Object.keys(SEMESTER_CONFIG).sort()).toEqual([...SEMESTERS].sort());
  });

  it("prices winter tuition and fee only, and never the regular categories", () => {
    expect(semesterPrices("winter", "winterTuition")).toBe(true);
    expect(semesterPrices("winter", "winterFee")).toBe(true);
    expect(semesterPrices("winter", "housing")).toBe(false);
    expect(semesterPrices("winter", "tuition")).toBe(false);
    expect(semesterPrices("fall", "winterFee")).toBe(false);
    expect(semesterPrices("spring", "housing")).toBe(true);
  });
});
