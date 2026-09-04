import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "./server";
import type { RatesBundle } from "@/lib/calculator/types";

// Plain, directly-testable data-access function -- no caching logic in here,
// that's layered on below. Resolves "current" via academic_years.is_current
// (see supabase/migrations/20260903183000_add_is_current_to_academic_years.sql)
// rather than a label-sort heuristic, so this stays correct once more than
// one academic year row exists.
async function fetchRatesBundle(): Promise<RatesBundle> {
  const supabase = createServerSupabaseClient();

  const { data: academicYear, error: academicYearError } = await supabase
    .from("academic_years")
    .select("*")
    .eq("is_current", true)
    .single();

  if (academicYearError || !academicYear) {
    throw new Error(
      `getRatesBundle: no current academic year found (${academicYearError?.message ?? "no row marked is_current"})`
    );
  }

  const academicYearId = academicYear.id;

  const [
    tuitionRates,
    graduateTuitionRates,
    mandatoryFees,
    graduateFees,
    differentialTuition,
    housingRates,
    residentDiningPlans,
    blockDiningPlans,
    parkingPermits,
    healthInsuranceRates,
  ] = await Promise.all([
    supabase.from("tuition_rates").select("*").eq("academic_year_id", academicYearId),
    supabase.from("graduate_tuition_rates").select("*").eq("academic_year_id", academicYearId),
    supabase.from("mandatory_fees").select("*").eq("academic_year_id", academicYearId),
    supabase.from("graduate_fees").select("*").eq("academic_year_id", academicYearId),
    supabase.from("differential_tuition").select("*").eq("academic_year_id", academicYearId),
    supabase.from("housing_rates").select("*").eq("academic_year_id", academicYearId),
    supabase.from("resident_dining_plans").select("*").eq("academic_year_id", academicYearId),
    supabase.from("block_dining_plans").select("*").eq("academic_year_id", academicYearId),
    supabase.from("parking_permits").select("*").eq("academic_year_id", academicYearId),
    supabase.from("health_insurance_rates").select("*").eq("academic_year_id", academicYearId),
  ]);

  const results = {
    tuitionRates,
    graduateTuitionRates,
    mandatoryFees,
    graduateFees,
    differentialTuition,
    housingRates,
    residentDiningPlans,
    blockDiningPlans,
    parkingPermits,
    healthInsuranceRates,
  };

  for (const [name, result] of Object.entries(results)) {
    if (result.error) {
      throw new Error(`getRatesBundle: failed to fetch ${name} (${result.error.message})`);
    }
  }

  return {
    academicYear,
    tuitionRates: tuitionRates.data ?? [],
    graduateTuitionRates: graduateTuitionRates.data ?? [],
    mandatoryFees: mandatoryFees.data ?? [],
    graduateFees: graduateFees.data ?? [],
    differentialTuition: differentialTuition.data ?? [],
    housingRates: housingRates.data ?? [],
    residentDiningPlans: residentDiningPlans.data ?? [],
    blockDiningPlans: blockDiningPlans.data ?? [],
    parkingPermits: parkingPermits.data ?? [],
    healthInsuranceRates: healthInsuranceRates.data ?? [],
  };
}

// Cached at the module boundary so fetchRatesBundle itself stays a plain
// function, easy to call directly in a test without touching the cache.
// Tagged 'rates' so a future promote-triggered revalidateTag('rates') call
// (deferred -- see docs/PROGRESS-LOG.md) can bust this without a redeploy.
// 24h revalidate: rate data changes ~once/year (see docs/BUILD-REFERENCE.md),
// so this is generous headroom, not a tight freshness requirement.
export const getRatesBundle = unstable_cache(fetchRatesBundle, ["rates-bundle"], {
  tags: ["rates"],
  revalidate: 86400,
});
