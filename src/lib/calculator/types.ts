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
