import type {
  AcademicYearRow,
  WinterFeeRow,
  WinterGraduateTuitionRateRow,
  WinterRates,
  WinterTuitionRateRow,
} from "@/lib/calculator/types";

// Assembles the winter section of a RatesBundle from the three winter tables,
// or returns null when the year has no usable winter data -- which is how the
// rest of the app learns Winter isn't available (see RatesBundle.winter).
// "No usable data" means the hand-set cap is null (winter not configured for
// this year) OR any of the three tables is empty (e.g. a new academic year
// before winter rates are published). Kept separate from getRatesBundle.ts
// (which pulls in next/cache) so it's a plain pure function, easy to test.
export function buildWinterRates(
  academicYear: AcademicYearRow,
  undergraduateTuition: WinterTuitionRateRow[],
  graduateTuition: WinterGraduateTuitionRateRow[],
  fees: WinterFeeRow[]
): WinterRates | null {
  if (academicYear.winter_max_credit_hours === null) return null;
  // winter_fees has a unique constraint on academic_year_id, so at most one row.
  const [feeRow] = fees;
  if (!feeRow || undergraduateTuition.length === 0 || graduateTuition.length === 0) return null;
  return { undergraduateTuition, graduateTuition, fees: feeRow };
}
