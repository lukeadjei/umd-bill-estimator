import { describe, expect, it } from "vitest";
import { buildScenarioFields, buildSelectionsFromScenarioRow, type ScenarioRow } from "./scenarioMapping";
import type { RatesBundle } from "@/lib/calculator/types";
import type { DashboardSelections } from "@/components/dashboard/selections";

const rates: RatesBundle = {
  academicYear: {
    id: "y",
    label: "2026-2027",
    is_current: true,
    undergrad_tuition_full_time_credit_threshold: 12,
    full_time_fee_credit_threshold: 9,
    winter_max_credit_hours: 4,
  },
  tuitionRates: [
    { id: "t-res", academic_year_id: "y", residency: "resident", full_time_rate: 5000, per_credit_rate: 400 },
    { id: "t-non", academic_year_id: "y", residency: "non_resident", full_time_rate: 20000, per_credit_rate: 1700 },
  ],
  graduateTuitionRates: [{ id: "g-res", academic_year_id: "y", residency: "resident", per_credit_rate: 900 }],
  mandatoryFees: [],
  graduateFees: [],
  differentialTuition: [],
  housingRates: [{ id: "h1", academic_year_id: "y", room_type: "Double", building_category: "Suite", rate: 10000 }],
  residentDiningPlans: [
    { id: "d1", academic_year_id: "y", plan_name: "Base", dining_dollars: 0, guest_passes: 0, fall_price: 1, spring_price: 1 },
  ],
  blockDiningPlans: [],
  parkingPermits: [{ id: "p1", academic_year_id: "y", permit_type: "Resident", term: "fall", price: 300 }],
  healthInsuranceRates: [],
  winter: {
    undergraduateTuition: [
      { id: "wu-res-2", academic_year_id: "y", residency: "resident", credit_hours: 2, price: 150 },
      { id: "wu-non-2", academic_year_id: "y", residency: "non_resident", credit_hours: 2, price: 900 },
    ],
    graduateTuition: [{ id: "wg-res-2", academic_year_id: "y", residency: "resident", credit_hours: 2, price: 580 }],
    fees: { id: "wf", academic_year_id: "y", campus_services_rate: 116, distance_learning_rate: 55 },
  },
};

const grants = { pell: 1000, terrapinCommitment: 0, rawlingsEA: 0, misc: [{ id: "m1", note: "Dept", amount: 250 }] };

const fall: DashboardSelections = {
  major: "Computer Science",
  semester: "fall",
  educationLevel: "undergraduate",
  residency: "resident",
  creditHours: 15,
  appliesDifferentialTuition: true,
  insurance: true,
  livingSituation: "on_campus",
  housing: { roomType: "Double", buildingCategory: "Suite" },
  residentDiningPlan: { planName: "Base" },
  blockDiningPlan: null,
  parking: { permitType: "Resident", term: "fall" },
  winterClassFormat: null,
  grants,
};

const winter: DashboardSelections = {
  major: "",
  semester: "winter",
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
  winterClassFormat: "in_person",
  grants,
};

// What the DB would hand back after the save action inserted these fields.
function rowFor(selections: DashboardSelections, fields: Record<string, unknown>): ScenarioRow {
  return {
    id: "s1",
    user_id: "u1",
    name: "n",
    note: null,
    academic_year_id: "y",
    semester: selections.semester,
    credit_hours: selections.creditHours!,
    computed_total: 0,
    created_at: "2026-10-21T00:00:00Z",
    updated_at: "2026-10-21T00:00:00Z",
    pell_grant_amount: selections.grants.pell,
    terrapin_commitment_amount: selections.grants.terrapinCommitment,
    rawlings_ea_amount: selections.grants.rawlingsEA,
    misc_grants: selections.grants.misc,
    ...fields,
  } as unknown as ScenarioRow;
}

function roundTrip(selections: DashboardSelections, ratesBundle: RatesBundle = rates) {
  const built = buildScenarioFields(selections, ratesBundle);
  if (!built.ok) throw new Error(built.error);
  return { fields: built.fields, loaded: buildSelectionsFromScenarioRow(rowFor(selections, built.fields), ratesBundle) };
}

describe("scenario save/load -- fall and spring (unchanged behavior)", () => {
  it("round-trips a full fall scenario exactly", () => {
    expect(roundTrip(fall).loaded).toEqual(fall);
  });

  it("round-trips spring and a graduate scenario", () => {
    const spring: DashboardSelections = { ...fall, semester: "spring" };
    expect(roundTrip(spring).loaded).toEqual(spring);
    const grad: DashboardSelections = { ...fall, educationLevel: "graduate", appliesDifferentialTuition: false };
    expect(roundTrip(grad).loaded).toEqual(grad);
  });

  it("stores no winter fields", () => {
    const { fields } = roundTrip(fall);
    expect(fields.winter_tuition_rate_id).toBeNull();
    expect(fields.winter_graduate_tuition_rate_id).toBeNull();
    expect(fields.winter_class_format).toBeNull();
  });

  it("still reports a missing tuition rate", () => {
    const built = buildScenarioFields({ ...fall, residency: "non_resident" }, { ...rates, tuitionRates: [] });
    expect(built).toEqual({ ok: false, error: "Couldn't find a matching tuition rate. Try again." });
  });
});

describe("scenario save/load -- winter", () => {
  it("round-trips a winter scenario and it loads back as winter, never fall", () => {
    const { loaded } = roundTrip(winter);
    expect(loaded.semester).toBe("winter");
    expect(loaded).toEqual(winter);
  });

  it("stores only winter-relevant fields, with neutral values for the rest", () => {
    const { fields } = roundTrip(winter);
    expect(fields).toEqual({
      major: null,
      living_situation: null,
      applies_differential_tuition: false,
      insurance_selected: false,
      tuition_rate_id: null,
      graduate_tuition_rate_id: null,
      housing_rate_id: null,
      resident_dining_plan_id: null,
      block_dining_plan_id: null,
      parking_permit_id: null,
      winter_tuition_rate_id: "wu-res-2",
      winter_graduate_tuition_rate_id: null,
      winter_class_format: "in_person",
    });
  });

  it("ignores any fall/spring-only selections left in state", () => {
    const cluttered: DashboardSelections = {
      ...winter,
      major: "Computer Science",
      insurance: true,
      livingSituation: "on_campus",
      housing: { roomType: "Double", buildingCategory: "Suite" },
    };
    const { fields, loaded } = roundTrip(cluttered);
    expect(fields.housing_rate_id).toBeNull();
    expect(fields.insurance_selected).toBe(false);
    expect(loaded).toEqual(winter);
  });

  it("uses the graduate winter column for graduate students, and keeps residency and credits", () => {
    const grad: DashboardSelections = { ...winter, educationLevel: "graduate" };
    const { fields, loaded } = roundTrip(grad);
    expect(fields.winter_tuition_rate_id).toBeNull();
    expect(fields.winter_graduate_tuition_rate_id).toBe("wg-res-2");
    expect(loaded).toEqual(grad);
  });

  it("round-trips online-only and non-resident", () => {
    const online: DashboardSelections = { ...winter, residency: "non_resident", winterClassFormat: "online_only" };
    expect(roundTrip(online).loaded).toEqual(online);
  });

  it("refuses to save when there is no winter data or no matching chart row", () => {
    expect(buildScenarioFields(winter, { ...rates, winter: null })).toEqual({
      ok: false,
      error: "Winter Session isn't available for this academic year.",
    });
    expect(buildScenarioFields({ ...winter, creditHours: 3 }, rates)).toEqual({
      ok: false,
      error: "Couldn't find a matching winter tuition rate. Try again.",
    });
  });

  it("loads with empty level/residency (not a crash) if its winter row no longer resolves", () => {
    const { fields } = roundTrip(winter);
    const loaded = buildSelectionsFromScenarioRow(rowFor(winter, fields), { ...rates, winter: null });
    expect(loaded.semester).toBe("winter");
    expect(loaded.educationLevel).toBeNull();
    expect(loaded.residency).toBeNull();
  });
});

describe("buildSelectionsFromScenarioRow -- semester handling", () => {
  it("falls back to fall only for a value that is not a real semester", () => {
    const { fields } = roundTrip(fall);
    const bad = { ...rowFor(fall, fields), semester: "summer" } as ScenarioRow;
    expect(buildSelectionsFromScenarioRow(bad, rates).semester).toBe("fall");
  });
});
