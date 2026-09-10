import type { Database } from "@/lib/supabase/database.types";

type Tables = Database["public"]["Tables"];

export type AcademicYearRow = Tables["academic_years"]["Row"];
export type TuitionRateRow = Tables["tuition_rates"]["Row"];
export type GraduateTuitionRateRow = Tables["graduate_tuition_rates"]["Row"];
export type MandatoryFeeRow = Tables["mandatory_fees"]["Row"];
export type GraduateFeeRow = Tables["graduate_fees"]["Row"];
export type DifferentialTuitionRow = Tables["differential_tuition"]["Row"];
export type HousingRateRow = Tables["housing_rates"]["Row"];
export type ResidentDiningPlanRow = Tables["resident_dining_plans"]["Row"];
export type BlockDiningPlanRow = Tables["block_dining_plans"]["Row"];
export type ParkingPermitRow = Tables["parking_permits"]["Row"];
export type HealthInsuranceRateRow = Tables["health_insurance_rates"]["Row"];

// App-level labels -- the DB columns are plain text (residency) or don't exist at all
// (education level is which table you query, not a stored value).
export type Residency = "resident" | "non_resident";
export type EducationLevel = "undergraduate" | "graduate";
// calculateTotal computes one semester's bill at a time, not a full-year total.
export type Semester = "fall" | "spring";
// Explicit rather than inferred from housing being null -- null was ambiguous
// between "commuter" and "hasn't answered yet." validateSelections' job to
// enforce housing is null for commuters and non-null for on_campus.
export type LivingSituation = "on_campus" | "commuter";

// These hold identifiers only (what the user picked), not resolved prices --
// the calculator functions match them against RatesBundle to find the price.
export type HousingSelection = {
  roomType: string;
  buildingCategory: string;
};

export type ResidentDiningSelection = {
  planName: string;
};

export type BlockDiningSelection = {
  planLabel: string;
};

export type ParkingSelection = {
  permitType: string;
  term: string;
};

// A single user-entered miscellaneous grant/aid line -- unlike every other
// selection in this file, this has no matching rate-table row behind it, the
// user just types a dollar figure directly. `id` is a client-generated
// (crypto.randomUUID()) stable key for React lists and for matching an entry
// across edits -- never a database id.
export type MiscGrant = {
  id: string;
  note: string;
  amount: number;
};

// Financial aid the student is applying against their bill. All amounts are
// raw dollar figures the user types in, not resolved against any RatesBundle
// table -- 0 means "not entered" for the three named grants. Bounds
// (non-negative, capped) are enforced at the input layer and again
// server-side before a save, never here (CLAUDE.md rule 4 -- this type just
// describes the shape, not what's legal).
export type Grants = {
  pell: number;
  terrapinCommitment: number;
  rawlingsEA: number;
  misc: MiscGrant[];
};

export type Selections = {
  semester: Semester;
  // null means "hasn't been answered yet" -- distinct from any real choice.
  // calculateTotal prices this as $0 for the affected line; validateSelections
  // reports it as a required field, rather than downstream logic guessing a
  // default and producing a misleading combination error against a choice
  // the user never actually made.
  educationLevel: EducationLevel | null;
  residency: Residency | null;
  creditHours: number | null;
  appliesDifferentialTuition: boolean;
  insurance: boolean;
  livingSituation: LivingSituation | null;
  housing: HousingSelection | null;
  // Never both set at once -- validateSelections' job to enforce, not calculateTotal's.
  residentDiningPlan: ResidentDiningSelection | null;
  blockDiningPlan: BlockDiningSelection | null;
  parking: ParkingSelection | null;
  grants: Grants;
};

// Whole reference dataset for one academic year, fetched once by the caller
// (a Server Component/Action) and passed in -- calculateTotal and its
// sub-functions never query the database themselves.
export type RatesBundle = {
  academicYear: AcademicYearRow;
  tuitionRates: TuitionRateRow[];
  graduateTuitionRates: GraduateTuitionRateRow[];
  mandatoryFees: MandatoryFeeRow[];
  graduateFees: GraduateFeeRow[];
  differentialTuition: DifferentialTuitionRow[];
  housingRates: HousingRateRow[];
  residentDiningPlans: ResidentDiningPlanRow[];
  blockDiningPlans: BlockDiningPlanRow[];
  parkingPermits: ParkingPermitRow[];
  healthInsuranceRates: HealthInsuranceRateRow[];
};
