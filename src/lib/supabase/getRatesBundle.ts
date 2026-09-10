import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "./server";
import type { AcademicYearRow, RatesBundle } from "@/lib/calculator/types";

// Shared by both the "current year" and "specific year" fetch paths below --
// takes an already-resolved academic_years row (rather than re-resolving
// "current" itself) so this one function works for either case.
async function fetchRatesBundleForAcademicYear(academicYear: AcademicYearRow): Promise<RatesBundle> {
  const supabase = createServerSupabaseClient();
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

// Plain, directly-testable data-access function -- no caching logic in here,
// that's layered on below. Resolves "current" via academic_years.is_current
// (see supabase/migrations/20260903183000_add_is_current_to_academic_years.sql)
// rather than a label-sort heuristic, so this stays correct once more than
// one academic year row exists.
async function fetchCurrentRatesBundle(): Promise<RatesBundle> {
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

  return fetchRatesBundleForAcademicYear(academicYear);
}

// For a SPECIFIC past (or future) academic year, not necessarily the current
// one -- used to resolve/render a saved scenario against the rates that were
// actually in effect for its own year, rather than whatever's current today
// (see resolveScenarioForViewing/resolveScenarioForEditing in scenarios.ts).
// Throws (rather than returning null) if the id doesn't exist -- an id that
// was valid enough to be stored on a scenario but no longer resolves is a
// real data-integrity problem, not a normal "not found" case to swallow.
async function fetchRatesBundleForYear(academicYearId: string): Promise<RatesBundle> {
  const supabase = createServerSupabaseClient();

  const { data: academicYear, error: academicYearError } = await supabase
    .from("academic_years")
    .select("*")
    .eq("id", academicYearId)
    .single();

  if (academicYearError || !academicYear) {
    throw new Error(
      `getRatesBundleForYear: no academic year found for id ${academicYearId} (${academicYearError?.message ?? "no matching row"})`
    );
  }

  return fetchRatesBundleForAcademicYear(academicYear);
}

// Cached at the module boundary so the fetch functions above stay plain,
// easy to call directly in a test without touching the cache.
// 24h revalidate: rate data changes ~once/year (see docs/BUILD-REFERENCE.md),
// so this is generous headroom, not a tight freshness requirement.
export const getRatesBundle = unstable_cache(fetchCurrentRatesBundle, ["rates-bundle", "current"], {
  tags: ["rates"],
  revalidate: 86400,
});

// Cached per-year (distinct cache key AND a distinct tag per academic year)
// rather than sharing the current year's cache entry -- a past year's rates
// are effectively frozen once promoted (the only reason they'd ever change
// is a deliberate correction, not the normal yearly cycle), so this is safe
// to cache at least as aggressively as the current year. The per-year tag
// (not just the shared "rates" tag above) means a future correction to one
// specific past year can be invalidated (revalidateTag(`rates-${id}`))
// without busting every other year's cache or the live year's.
export function getRatesBundleForYear(academicYearId: string): Promise<RatesBundle> {
  return unstable_cache(() => fetchRatesBundleForYear(academicYearId), ["rates-bundle", academicYearId], {
    tags: ["rates", `rates-${academicYearId}`],
    revalidate: 86400,
  })();
}
