import { supabase } from "./supabaseClient";
import type {
  BlockDiningPlansPageData,
  GraduateTuitionPageData,
  HousingRatesPageData,
  ParkingPermitsPageData,
  ResidentDiningPlansPageData,
  UndergraduateTuitionPageData,
} from "./types";

const STAGING_TABLES = [
  "academic_years_staging",
  "tuition_rates_staging",
  "differential_tuition_staging",
  "mandatory_fees_staging",
  "health_insurance_rates_staging",
  "graduate_tuition_rates_staging",
  "graduate_fees_staging",
  "housing_rates_staging",
  "resident_dining_plans_staging",
  "block_dining_plans_staging",
  "parking_permits_staging",
] as const;

// Re-running the scraper for the same year should leave one clean snapshot in
// staging, not accumulate duplicates from every previous run.
export async function clearStagingForAcademicYear(academicYearId: string) {
  for (const table of STAGING_TABLES) {
    const { error } = await supabase.from(table).delete().eq("academic_year_id", academicYearId);
    if (error) throw error;
  }
}

export async function writeUndergraduateTuitionPageToStaging(data: UndergraduateTuitionPageData, academicYearId: string) {
  const { error: academicYearError } = await supabase.from("academic_years_staging").insert({
    academic_year_id: academicYearId,
    undergrad_tuition_full_time_credit_threshold: data.thresholds.undergradTuitionFullTimeCreditThreshold,
    full_time_fee_credit_threshold: data.thresholds.fullTimeFeeCreditThreshold,
  });
  if (academicYearError) throw academicYearError;

  const { error: tuitionError } = await supabase.from("tuition_rates_staging").insert(
    data.tuitionRates.map((rate) => ({
      academic_year_id: academicYearId,
      residency: rate.residency,
      full_time_rate: rate.fullTimeRate,
      per_credit_rate: rate.perCreditRate,
    }))
  );
  if (tuitionError) throw tuitionError;

  const { error: differentialError } = await supabase.from("differential_tuition_staging").insert({
    academic_year_id: academicYearId,
    full_time_rate: data.differentialTuition.fullTimeRate,
    per_credit_rate: data.differentialTuition.perCreditRate,
  });
  if (differentialError) throw differentialError;

  const { error: feesError } = await supabase.from("mandatory_fees_staging").insert({
    academic_year_id: academicYearId,
    part_time_rate: data.mandatoryFees.partTimeRate,
    full_time_rate: data.mandatoryFees.fullTimeRate,
  });
  if (feesError) throw feesError;

  const { error: insuranceError } = await supabase.from("health_insurance_rates_staging").insert({
    academic_year_id: academicYearId,
    fall_price: data.healthInsurance.fallPrice,
    spring_price: data.healthInsurance.springPrice,
  });
  if (insuranceError) throw insuranceError;
}

export async function writeGraduateTuitionPageToStaging(data: GraduateTuitionPageData, academicYearId: string) {
  const { error: tuitionError } = await supabase.from("graduate_tuition_rates_staging").insert(
    data.tuitionRates.map((rate) => ({
      academic_year_id: academicYearId,
      residency: rate.residency,
      per_credit_rate: rate.perCreditRate,
    }))
  );
  if (tuitionError) throw tuitionError;

  const { error: feesError } = await supabase.from("graduate_fees_staging").insert({
    academic_year_id: academicYearId,
    part_time_rate: data.fees.partTimeRate,
    full_time_rate: data.fees.fullTimeRate,
  });
  if (feesError) throw feesError;
}

export async function writeHousingRatesPageToStaging(data: HousingRatesPageData, academicYearId: string) {
  const { error } = await supabase.from("housing_rates_staging").insert(
    data.housingRates.map((rate) => ({
      academic_year_id: academicYearId,
      room_type: rate.roomType,
      building_category: rate.buildingCategory,
      rate: rate.rate,
    }))
  );
  if (error) throw error;
}

export async function writeResidentDiningPlansPageToStaging(data: ResidentDiningPlansPageData, academicYearId: string) {
  const { error } = await supabase.from("resident_dining_plans_staging").insert(
    data.plans.map((plan) => ({
      academic_year_id: academicYearId,
      plan_name: plan.planName,
      dining_dollars: plan.diningDollars,
      guest_passes: plan.guestPasses,
      fall_price: plan.fallPrice,
      spring_price: plan.springPrice,
    }))
  );
  if (error) throw error;
}

export async function writeBlockDiningPlansPageToStaging(data: BlockDiningPlansPageData, academicYearId: string) {
  const { error } = await supabase.from("block_dining_plans_staging").insert(
    data.plans.map((plan) => ({
      academic_year_id: academicYearId,
      plan_label: plan.planLabel,
      meal_count: plan.mealCount,
      dining_dollars: plan.diningDollars,
      price: plan.price,
    }))
  );
  if (error) throw error;
}

export async function writeParkingPermitsPageToStaging(data: ParkingPermitsPageData, academicYearId: string) {
  const { error } = await supabase.from("parking_permits_staging").insert(
    data.permits.map((permit) => ({
      academic_year_id: academicYearId,
      permit_type: permit.permitType,
      term: permit.term,
      price: permit.price,
    }))
  );
  if (error) throw error;
}
