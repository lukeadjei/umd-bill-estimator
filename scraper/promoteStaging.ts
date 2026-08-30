import { supabase } from "./supabaseClient";

// academic_years is the one asymmetric case -- it already exists (everything
// else's academic_year_id points to it), so "promoting" it means updating its
// threshold columns, not inserting a new row.
async function promoteAcademicYearThresholds(academicYearId: string) {
  const { data: staged, error: fetchError } = await supabase
    .from("academic_years_staging")
    .select("undergrad_tuition_full_time_credit_threshold, full_time_fee_credit_threshold")
    .eq("academic_year_id", academicYearId)
    .order("scraped_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!staged) throw new Error(`No staged academic_years thresholds found for ${academicYearId}`);

  const { error } = await supabase
    .from("academic_years")
    .update({
      undergrad_tuition_full_time_credit_threshold: staged.undergrad_tuition_full_time_credit_threshold,
      full_time_fee_credit_threshold: staged.full_time_fee_credit_threshold,
    })
    .eq("id", academicYearId);
  if (error) throw error;
}

async function promoteTuitionRates(academicYearId: string) {
  const { data: staged, error: fetchError } = await supabase
    .from("tuition_rates_staging")
    .select("residency, full_time_rate, per_credit_rate")
    .eq("academic_year_id", academicYearId);
  if (fetchError) throw fetchError;
  if (!staged || staged.length === 0) throw new Error(`No staged tuition_rates found for ${academicYearId}`);

  // Idempotent: clear any previously-promoted rows for this year first, so
  // re-running promotion never creates duplicates.
  const { error: deleteError } = await supabase.from("tuition_rates").delete().eq("academic_year_id", academicYearId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("tuition_rates")
    .insert(staged.map((row) => ({ ...row, academic_year_id: academicYearId })));
  if (insertError) throw insertError;
}

async function promoteDifferentialTuition(academicYearId: string) {
  const { data: staged, error: fetchError } = await supabase
    .from("differential_tuition_staging")
    .select("full_time_rate, per_credit_rate")
    .eq("academic_year_id", academicYearId);
  if (fetchError) throw fetchError;
  if (!staged || staged.length === 0) throw new Error(`No staged differential_tuition found for ${academicYearId}`);

  const { error: deleteError } = await supabase
    .from("differential_tuition")
    .delete()
    .eq("academic_year_id", academicYearId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("differential_tuition")
    .insert(staged.map((row) => ({ ...row, academic_year_id: academicYearId })));
  if (insertError) throw insertError;
}

async function promoteMandatoryFees(academicYearId: string) {
  const { data: staged, error: fetchError } = await supabase
    .from("mandatory_fees_staging")
    .select("part_time_rate, full_time_rate")
    .eq("academic_year_id", academicYearId);
  if (fetchError) throw fetchError;
  if (!staged || staged.length === 0) throw new Error(`No staged mandatory_fees found for ${academicYearId}`);

  const { error: deleteError } = await supabase.from("mandatory_fees").delete().eq("academic_year_id", academicYearId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("mandatory_fees")
    .insert(staged.map((row) => ({ ...row, academic_year_id: academicYearId })));
  if (insertError) throw insertError;
}

async function promoteHealthInsuranceRates(academicYearId: string) {
  const { data: staged, error: fetchError } = await supabase
    .from("health_insurance_rates_staging")
    .select("fall_price, spring_price")
    .eq("academic_year_id", academicYearId);
  if (fetchError) throw fetchError;
  if (!staged || staged.length === 0) throw new Error(`No staged health_insurance_rates found for ${academicYearId}`);

  const { error: deleteError } = await supabase
    .from("health_insurance_rates")
    .delete()
    .eq("academic_year_id", academicYearId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("health_insurance_rates")
    .insert(staged.map((row) => ({ ...row, academic_year_id: academicYearId })));
  if (insertError) throw insertError;
}

async function promoteGraduateTuitionRates(academicYearId: string) {
  const { data: staged, error: fetchError } = await supabase
    .from("graduate_tuition_rates_staging")
    .select("residency, per_credit_rate")
    .eq("academic_year_id", academicYearId);
  if (fetchError) throw fetchError;
  if (!staged || staged.length === 0) throw new Error(`No staged graduate_tuition_rates found for ${academicYearId}`);

  const { error: deleteError } = await supabase
    .from("graduate_tuition_rates")
    .delete()
    .eq("academic_year_id", academicYearId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("graduate_tuition_rates")
    .insert(staged.map((row) => ({ ...row, academic_year_id: academicYearId })));
  if (insertError) throw insertError;
}

async function promoteGraduateFees(academicYearId: string) {
  const { data: staged, error: fetchError } = await supabase
    .from("graduate_fees_staging")
    .select("part_time_rate, full_time_rate")
    .eq("academic_year_id", academicYearId);
  if (fetchError) throw fetchError;
  if (!staged || staged.length === 0) throw new Error(`No staged graduate_fees found for ${academicYearId}`);

  const { error: deleteError } = await supabase.from("graduate_fees").delete().eq("academic_year_id", academicYearId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("graduate_fees")
    .insert(staged.map((row) => ({ ...row, academic_year_id: academicYearId })));
  if (insertError) throw insertError;
}

async function promoteHousingRates(academicYearId: string) {
  const { data: staged, error: fetchError } = await supabase
    .from("housing_rates_staging")
    .select("room_type, building_category, rate")
    .eq("academic_year_id", academicYearId);
  if (fetchError) throw fetchError;
  if (!staged || staged.length === 0) throw new Error(`No staged housing_rates found for ${academicYearId}`);

  const { error: deleteError } = await supabase.from("housing_rates").delete().eq("academic_year_id", academicYearId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("housing_rates")
    .insert(staged.map((row) => ({ ...row, academic_year_id: academicYearId })));
  if (insertError) throw insertError;
}

async function promoteResidentDiningPlans(academicYearId: string) {
  const { data: staged, error: fetchError } = await supabase
    .from("resident_dining_plans_staging")
    .select("plan_name, dining_dollars, guest_passes, fall_price, spring_price")
    .eq("academic_year_id", academicYearId);
  if (fetchError) throw fetchError;
  if (!staged || staged.length === 0) throw new Error(`No staged resident_dining_plans found for ${academicYearId}`);

  const { error: deleteError } = await supabase
    .from("resident_dining_plans")
    .delete()
    .eq("academic_year_id", academicYearId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("resident_dining_plans")
    .insert(staged.map((row) => ({ ...row, academic_year_id: academicYearId })));
  if (insertError) throw insertError;
}

async function promoteBlockDiningPlans(academicYearId: string) {
  const { data: staged, error: fetchError } = await supabase
    .from("block_dining_plans_staging")
    .select("plan_label, meal_count, dining_dollars, price")
    .eq("academic_year_id", academicYearId);
  if (fetchError) throw fetchError;
  if (!staged || staged.length === 0) throw new Error(`No staged block_dining_plans found for ${academicYearId}`);

  const { error: deleteError } = await supabase
    .from("block_dining_plans")
    .delete()
    .eq("academic_year_id", academicYearId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("block_dining_plans")
    .insert(staged.map((row) => ({ ...row, academic_year_id: academicYearId })));
  if (insertError) throw insertError;
}

async function promoteParkingPermits(academicYearId: string) {
  const { data: staged, error: fetchError } = await supabase
    .from("parking_permits_staging")
    .select("permit_type, term, price")
    .eq("academic_year_id", academicYearId);
  if (fetchError) throw fetchError;
  if (!staged || staged.length === 0) throw new Error(`No staged parking_permits found for ${academicYearId}`);

  const { error: deleteError } = await supabase.from("parking_permits").delete().eq("academic_year_id", academicYearId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("parking_permits")
    .insert(staged.map((row) => ({ ...row, academic_year_id: academicYearId })));
  if (insertError) throw insertError;
}

export async function promoteAllStaging(academicYearId: string) {
  await promoteAcademicYearThresholds(academicYearId);
  await promoteTuitionRates(academicYearId);
  await promoteDifferentialTuition(academicYearId);
  await promoteMandatoryFees(academicYearId);
  await promoteHealthInsuranceRates(academicYearId);
  await promoteGraduateTuitionRates(academicYearId);
  await promoteGraduateFees(academicYearId);
  await promoteHousingRates(academicYearId);
  await promoteResidentDiningPlans(academicYearId);
  await promoteBlockDiningPlans(academicYearId);
  await promoteParkingPermits(academicYearId);
}
