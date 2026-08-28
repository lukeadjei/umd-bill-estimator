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
  educationLevel: EducationLevel;
  residency: Residency;
  creditHours: number;
  appliesDifferentialTuition: boolean;
  insurance: boolean;
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
