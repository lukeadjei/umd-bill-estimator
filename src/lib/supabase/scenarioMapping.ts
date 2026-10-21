import { MAX_MISC_GRANTS, isSemester } from "@/lib/calculator/constants";
import type { MiscGrant, RatesBundle, Residency, Semester, WinterClassFormat } from "@/lib/calculator/types";
import type { DashboardSelections } from "@/components/dashboard/selections";
import type { Database } from "./database.types";

// The two directions of a saved scenario, kept together and kept pure (no DB,
// no session -- just selections <-> rate-row ids against a RatesBundle) so they
// can be tested directly. A scenario stores the ID of the rate row each choice
// was priced from, never a copy of the price. What differs by semester is which
// ids are stored, so both directions dispatch through a Record<Semester, ...>:
// a new semester is a compile error until it says how it is saved and loaded.

export type ScenarioRow = Database["public"]["Tables"]["scenarios"]["Row"];
type ScenarioInsert = Database["public"]["Tables"]["scenarios"]["Insert"];

// The columns whose values depend on the semester. Everything else on a
// scenario (user, name, note, year, credit hours, total, grants) is the same
// for every semester and set by saveScenario itself.
export type ScenarioSemesterFields = Pick<
  ScenarioInsert,
  | "major"
  | "living_situation"
  | "applies_differential_tuition"
  | "insurance_selected"
  | "tuition_rate_id"
  | "graduate_tuition_rate_id"
  | "housing_rate_id"
  | "resident_dining_plan_id"
  | "block_dining_plan_id"
  | "parking_permit_id"
  | "winter_tuition_rate_id"
  | "winter_graduate_tuition_rate_id"
  | "winter_class_format"
>;

export type ScenarioFieldsResult = { ok: true; fields: ScenarioSemesterFields } | { ok: false; error: string };

// ---------------------------------------------------------------- saving

// Resolves every composite selection into its real row id by matching against
// the same RatesBundle calculateTotal used -- never trust a client-supplied id,
// only the selection shape. Callers have already run validateSelections, so
// the always-required fields are non-null (TypeScript can't see across the
// call, hence the assertions).
function fieldsForRegularSemester(selections: DashboardSelections, rates: RatesBundle): ScenarioFieldsResult {
  const tuitionRateId =
    selections.educationLevel === "undergraduate"
      ? (rates.tuitionRates.find((r) => r.residency === selections.residency)?.id ?? null)
      : null;
  const graduateTuitionRateId =
    selections.educationLevel === "graduate"
      ? (rates.graduateTuitionRates.find((r) => r.residency === selections.residency)?.id ?? null)
      : null;

  if (selections.educationLevel === "undergraduate" && !tuitionRateId) {
    return { ok: false, error: "Couldn't find a matching tuition rate. Try again." };
  }
  if (selections.educationLevel === "graduate" && !graduateTuitionRateId) {
    return { ok: false, error: "Couldn't find a matching graduate tuition rate. Try again." };
  }

  const housingRateId = selections.housing
    ? (rates.housingRates.find(
        (r) => r.room_type === selections.housing!.roomType && r.building_category === selections.housing!.buildingCategory
      )?.id ?? null)
    : null;
  const residentDiningPlanId = selections.residentDiningPlan
    ? (rates.residentDiningPlans.find((r) => r.plan_name === selections.residentDiningPlan!.planName)?.id ?? null)
    : null;
  const blockDiningPlanId = selections.blockDiningPlan
    ? (rates.blockDiningPlans.find((r) => r.plan_label === selections.blockDiningPlan!.planLabel)?.id ?? null)
    : null;
  const parkingPermitId = selections.parking
    ? (rates.parkingPermits.find(
        (r) => r.permit_type === selections.parking!.permitType && r.term === selections.parking!.term
      )?.id ?? null)
    : null;

  return {
    ok: true,
    fields: {
      major: selections.major.trim() || null,
      living_situation: selections.livingSituation!,
      applies_differential_tuition: selections.appliesDifferentialTuition,
      insurance_selected: selections.insurance,
      tuition_rate_id: tuitionRateId,
      graduate_tuition_rate_id: graduateTuitionRateId,
      housing_rate_id: housingRateId,
      resident_dining_plan_id: residentDiningPlanId,
      block_dining_plan_id: blockDiningPlanId,
      parking_permit_id: parkingPermitId,
      winter_tuition_rate_id: null,
      winter_graduate_tuition_rate_id: null,
      winter_class_format: null,
    },
  };
}

// Winter saves only what winter has: the winter tuition row (which identifies
// level, residency AND credit count), the fee choice, and nothing else. Every
// fall/spring-only field is stored as its neutral value (null / false).
function fieldsForWinterSession(selections: DashboardSelections, rates: RatesBundle): ScenarioFieldsResult {
  if (!rates.winter) {
    return { ok: false, error: "Winter Session isn't available for this academic year." };
  }

  const isGraduate = selections.educationLevel === "graduate";
  const chart = isGraduate ? rates.winter.graduateTuition : rates.winter.undergraduateTuition;
  const row = chart.find((r) => r.residency === selections.residency && r.credit_hours === selections.creditHours);
  if (!row) {
    return { ok: false, error: "Couldn't find a matching winter tuition rate. Try again." };
  }

  return {
    ok: true,
    fields: {
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
      winter_tuition_rate_id: isGraduate ? null : row.id,
      winter_graduate_tuition_rate_id: isGraduate ? row.id : null,
      winter_class_format: selections.winterClassFormat,
    },
  };
}

const FIELD_BUILDERS: Record<Semester, (selections: DashboardSelections, rates: RatesBundle) => ScenarioFieldsResult> = {
  fall: fieldsForRegularSemester,
  spring: fieldsForRegularSemester,
  winter: fieldsForWinterSession,
};

export function buildScenarioFields(selections: DashboardSelections, rates: RatesBundle): ScenarioFieldsResult {
  return FIELD_BUILDERS[selections.semester](selections, rates);
}

// ---------------------------------------------------------------- loading

// Defensive, not just a cast -- misc_grants is a jsonb column, so its shape is
// only ever as trustworthy as whatever was last written to it. Malformed or
// unexpected entries are dropped rather than crashing the dashboard load.
export function parseMiscGrants(raw: unknown): MiscGrant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map(
      (entry): MiscGrant => ({
        id: typeof entry.id === "string" ? entry.id : crypto.randomUUID(),
        note: typeof entry.note === "string" ? entry.note : "",
        amount: typeof entry.amount === "number" ? entry.amount : 0,
      })
    )
    .slice(0, MAX_MISC_GRANTS);
}

function grantsFromRow(row: ScenarioRow): DashboardSelections["grants"] {
  return {
    pell: row.pell_grant_amount,
    terrapinCommitment: row.terrapin_commitment_amount,
    rawlingsEA: row.rawlings_ea_amount,
    misc: parseMiscGrants(row.misc_grants),
  };
}

function parseWinterClassFormat(value: string | null): WinterClassFormat | null {
  return value === "in_person" || value === "online_only" ? value : null;
}

// Reverses fieldsForRegularSemester: stored row ids back into the
// {roomType, buildingCategory} / {permitType, term} / plan-name shapes the
// dashboard works with. The residency cast is safe: the column is plain
// `string` at the DB layer, but only ever holds values validated at save time.
function selectionsFromRegularRow(row: ScenarioRow, rates: RatesBundle): Omit<DashboardSelections, "semester"> {
  const residency = (row.tuition_rate_id
    ? (rates.tuitionRates.find((r) => r.id === row.tuition_rate_id)?.residency ?? null)
    : row.graduate_tuition_rate_id
      ? (rates.graduateTuitionRates.find((r) => r.id === row.graduate_tuition_rate_id)?.residency ?? null)
      : null) as Residency | null;
  const educationLevel = row.tuition_rate_id ? "undergraduate" : row.graduate_tuition_rate_id ? "graduate" : null;

  const housingRow = row.housing_rate_id ? rates.housingRates.find((r) => r.id === row.housing_rate_id) : null;
  const residentPlanRow = row.resident_dining_plan_id
    ? rates.residentDiningPlans.find((r) => r.id === row.resident_dining_plan_id)
    : null;
  const blockPlanRow = row.block_dining_plan_id
    ? rates.blockDiningPlans.find((r) => r.id === row.block_dining_plan_id)
    : null;
  const parkingRow = row.parking_permit_id ? rates.parkingPermits.find((r) => r.id === row.parking_permit_id) : null;

  return {
    major: row.major ?? "",
    educationLevel,
    residency,
    creditHours: row.credit_hours,
    appliesDifferentialTuition: row.applies_differential_tuition,
    insurance: row.insurance_selected,
    livingSituation: row.living_situation === "commuter" ? "commuter" : "on_campus",
    housing: housingRow ? { roomType: housingRow.room_type, buildingCategory: housingRow.building_category } : null,
    residentDiningPlan: residentPlanRow ? { planName: residentPlanRow.plan_name } : null,
    blockDiningPlan: blockPlanRow ? { planLabel: blockPlanRow.plan_label } : null,
    parking: parkingRow ? { permitType: parkingRow.permit_type, term: parkingRow.term } : null,
    winterClassFormat: null,
    grants: grantsFromRow(row),
  };
}

// Reverses fieldsForWinterSession. Level and residency come from which winter
// tuition row the scenario points at; everything fall/spring-only comes back
// at its empty default.
function selectionsFromWinterRow(row: ScenarioRow, rates: RatesBundle): Omit<DashboardSelections, "semester"> {
  const undergraduateRow = row.winter_tuition_rate_id
    ? rates.winter?.undergraduateTuition.find((r) => r.id === row.winter_tuition_rate_id)
    : undefined;
  const graduateRow = row.winter_graduate_tuition_rate_id
    ? rates.winter?.graduateTuition.find((r) => r.id === row.winter_graduate_tuition_rate_id)
    : undefined;
  const tuitionRow = undergraduateRow ?? graduateRow;

  return {
    major: "",
    educationLevel: undergraduateRow ? "undergraduate" : graduateRow ? "graduate" : null,
    residency: (tuitionRow?.residency ?? null) as Residency | null,
    creditHours: row.credit_hours,
    appliesDifferentialTuition: false,
    insurance: false,
    livingSituation: null,
    housing: null,
    residentDiningPlan: null,
    blockDiningPlan: null,
    parking: null,
    winterClassFormat: parseWinterClassFormat(row.winter_class_format),
    grants: grantsFromRow(row),
  };
}

const SELECTION_LOADERS: Record<
  Semester,
  (row: ScenarioRow, rates: RatesBundle) => Omit<DashboardSelections, "semester">
> = {
  fall: selectionsFromRegularRow,
  spring: selectionsFromRegularRow,
  winter: selectionsFromWinterRow,
};

// An unrecognized stored semester still falls back to fall (it can't happen --
// the app only ever writes valid ones -- but a bad row shouldn't crash a page
// load). A real "winter" never falls back: it is a valid Semester with its own loader.
export function buildSelectionsFromScenarioRow(row: ScenarioRow, rates: RatesBundle): DashboardSelections {
  const semester: Semester = isSemester(row.semester) ? row.semester : "fall";
  return { ...SELECTION_LOADERS[semester](row, rates), semester };
}
