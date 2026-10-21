import { MAX_CREDIT_HOURS, MIN_CREDIT_HOURS, SEMESTERS } from "./constants";
import type { RatesBundle, Semester } from "./types";

// Everything calculateTotal can add to a bill. Grants/aid aren't here on
// purpose -- they apply in every semester, and calculateAid handles them
// separately from the rate-table-backed categories.
export const PRICED_CATEGORIES = [
  "tuition",
  "differentialTuition",
  "fees",
  "insurance",
  "housing",
  "dining",
  "parking",
  "winterTuition",
  "winterFee",
] as const;

export type PricedCategory = (typeof PRICED_CATEGORIES)[number];

export type SemesterConfig = {
  // Which categories this semester prices (and so which calculateTotal sums).
  categories: readonly PricedCategory[];
  // The legal credit-hour range. A function of `rates` because some limits live
  // in the database, not in code (winter's cap is academic_years.winter_max_credit_hours).
  creditHourRange: (rates: RatesBundle) => { min: number; max: number };
  // Whether this semester can be offered at all for the given rates. Winter needs the
  // year to have winter data; a semester with no data must not appear in the toggle
  // (selecting it would only produce "unavailable" validation errors).
  isAvailable: (rates: RatesBundle) => boolean;
};

const REGULAR_SEMESTER: SemesterConfig = {
  categories: ["tuition", "differentialTuition", "fees", "insurance", "housing", "dining", "parking"],
  creditHourRange: () => ({ min: MIN_CREDIT_HOURS, max: MAX_CREDIT_HOURS }),
  isAvailable: () => true,
};

// A Record<Semester, ...> on purpose (same pattern as SEMESTER_LABELS) --
// adding a semester to SEMESTERS is a compile error here until you decide what
// it includes, so a new season is one entry here plus its rate data and a
// pricing function per new category, not a hunt for scattered
// `if (semester === ...)` branches.
export const SEMESTER_CONFIG: Record<Semester, SemesterConfig> = {
  fall: REGULAR_SEMESTER,
  spring: REGULAR_SEMESTER,
  winter: {
    categories: ["winterTuition", "winterFee"],
    // A null cap means winter isn't configured for the year; max 0 makes every
    // credit count illegal, and validateSelections reports the real reason
    // (winter unavailable) instead of a nonsensical "between 1 and 0".
    creditHourRange: (rates) => ({ min: MIN_CREDIT_HOURS, max: rates.academicYear.winter_max_credit_hours ?? 0 }),
    // Falsy check, not `!== null`: a rates bundle cached before winter existed has no `winter`
    // property at all (undefined), and that must read as "not available", not available.
    isAvailable: (rates) => Boolean(rates.winter),
  },
};

export function semesterPrices(semester: Semester, category: PricedCategory): boolean {
  return SEMESTER_CONFIG[semester].categories.includes(category);
}

// The semesters the UI should offer for this year's rates, in SEMESTERS order.
export function availableSemesters(rates: RatesBundle): Semester[] {
  return SEMESTERS.filter((semester) => SEMESTER_CONFIG[semester].isAvailable(rates));
}

// True when two semesters price the same categories (fall and spring). Switching between
// those keeps every selection meaningful; switching to a different kind (winter) does not,
// which is when the dashboard resets and warns.
export function sameSemesterKind(a: Semester, b: Semester): boolean {
  return SEMESTER_CONFIG[a].categories.join() === SEMESTER_CONFIG[b].categories.join();
}
