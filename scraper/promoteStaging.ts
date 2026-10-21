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

// winter_max_credit_hours is deliberately NOT promoted (it is hand-set, never
// staged -- see the migration comment). This only READS it, to make sure the
// staged winter charts actually cover every credit count the app will allow:
// otherwise a student picking the cap would hit a missing-rate lookup at
// runtime. A null cap means winter isn't configured for the year, so there is
// nothing to check against.
async function assertWinterChartsCoverCap(
  academicYearId: string,
  charts: { name: string; rows: { residency: string; credit_hours: number }[] }[]
) {
  const { data: year, error } = await supabase
    .from("academic_years")
    .select("winter_max_credit_hours")
    .eq("id", academicYearId)
    .single();
  if (error) throw error;
  const cap = year.winter_max_credit_hours;
  if (cap === null) return;

  for (const chart of charts) {
    for (const residency of ["resident", "non_resident"]) {
      const have = new Set(chart.rows.filter((row) => row.residency === residency).map((row) => row.credit_hours));
      for (let credits = 1; credits <= cap; credits++) {
        if (!have.has(credits)) {
          throw new Error(
            `Staged ${chart.name} has no ${residency} price for ${credits} credit(s), but winter_max_credit_hours is ${cap}`
          );
        }
      }
    }
  }
}

// Exported on its own so winter can be promoted without re-promoting the fall/spring
// tables: promoteAllStaging deletes and re-inserts every live rate table, which the
// foreign keys from saved scenarios (scenarios.tuition_rate_id etc.) refuse once any
// scenario references those rows.
export async function promoteWinterSession(academicYearId: string) {
  const { data: undergrad, error: undergradFetchError } = await supabase
    .from("winter_tuition_rates_staging")
    .select("residency, credit_hours, price")
    .eq("academic_year_id", academicYearId);
  if (undergradFetchError) throw undergradFetchError;
  const { data: graduate, error: graduateFetchError } = await supabase
    .from("winter_graduate_tuition_rates_staging")
    .select("residency, credit_hours, price")
    .eq("academic_year_id", academicYearId);
  if (graduateFetchError) throw graduateFetchError;
  const { data: fees, error: feesFetchError } = await supabase
    .from("winter_fees_staging")
    .select("campus_services_rate, distance_learning_rate")
    .eq("academic_year_id", academicYearId);
  if (feesFetchError) throw feesFetchError;

  if (!undergrad || undergrad.length === 0) throw new Error(`No staged winter_tuition_rates found for ${academicYearId}`);
  if (!graduate || graduate.length === 0)
    throw new Error(`No staged winter_graduate_tuition_rates found for ${academicYearId}`);
  if (!fees || fees.length === 0) throw new Error(`No staged winter_fees found for ${academicYearId}`);

  await assertWinterChartsCoverCap(academicYearId, [
    { name: "winter_tuition_rates", rows: undergrad },
    { name: "winter_graduate_tuition_rates", rows: graduate },
  ]);

  // Update in place (upsert on each table's natural unique key) instead of the
  // delete-and-re-insert the other promote steps use: saved winter scenarios
  // reference these rows by id, and a delete would be refused by the foreign
  // key. An upsert keeps every existing row's id and only changes the price.
  const undergradRows = undergrad.map((row) => ({ ...row, academic_year_id: academicYearId }));
  const { error: upsertUndergradError } = await supabase
    .from("winter_tuition_rates")
    .upsert(undergradRows, { onConflict: "academic_year_id,residency,credit_hours" });
  if (upsertUndergradError) throw upsertUndergradError;

  const graduateRows = graduate.map((row) => ({ ...row, academic_year_id: academicYearId }));
  const { error: upsertGraduateError } = await supabase
    .from("winter_graduate_tuition_rates")
    .upsert(graduateRows, { onConflict: "academic_year_id,residency,credit_hours" });
  if (upsertGraduateError) throw upsertGraduateError;

  const { error: upsertFeesError } = await supabase
    .from("winter_fees")
    .upsert({ ...fees[0], academic_year_id: academicYearId }, { onConflict: "academic_year_id" });
  if (upsertFeesError) throw upsertFeesError;

  // Remove live rows that are no longer in the staged chart (e.g. UMD drops a
  // credit count). If a saved scenario still references one, the foreign key
  // refuses the delete -- loud on purpose rather than silently orphaning it.
  await deleteWinterRowsNotStaged("winter_tuition_rates", academicYearId, undergrad);
  await deleteWinterRowsNotStaged("winter_graduate_tuition_rates", academicYearId, graduate);
}

async function deleteWinterRowsNotStaged(
  table: "winter_tuition_rates" | "winter_graduate_tuition_rates",
  academicYearId: string,
  staged: { residency: string; credit_hours: number }[]
) {
  const { data: live, error: liveError } = await supabase
    .from(table)
    .select("id, residency, credit_hours")
    .eq("academic_year_id", academicYearId);
  if (liveError) throw liveError;

  const stagedKeys = new Set(staged.map((row) => `${row.residency}:${row.credit_hours}`));
  const staleIds = (live ?? []).filter((row) => !stagedKeys.has(`${row.residency}:${row.credit_hours}`)).map((row) => row.id);
  if (staleIds.length === 0) return;

  const { error } = await supabase.from(table).delete().in("id", staleIds);
  if (error) throw error;
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
  await promoteWinterSession(academicYearId);
}
