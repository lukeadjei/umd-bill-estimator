import type { RatesBundle, Selections, WinterClassFormat, WinterFeeRow } from "./types";

// Winter Session pricing, kept apart from calculateTotal.ts because it's a
// different kind of bill: calculateTotal.ts is built around a full semester
// (flat-vs-per-credit tuition, mandatory fee tiers, housing, dining...), winter
// is a published price chart plus one flat fee. calculateTotal still owns the
// sum -- these are only the winter line items it adds (see SEMESTER_CONFIG).
// Same rules as the rest of the engine: pure, no DB, and a missing selection
// prices as $0 -- deciding whether it's required is validateSelections' job.

// Record, not a ternary, so a new fee format fails to compile until it's priced.
const FEE_COLUMN = {
  in_person: "campus_services_rate",
  online_only: "distance_learning_rate",
} as const satisfies Record<WinterClassFormat, keyof WinterFeeRow>;

// UMD publishes the TOTAL price for 1..N credits per level x residency, so this
// looks the price up by credit count -- it never multiplies a per-credit rate.
//
// A credit count with no row in the chart prices as $0 instead of throwing,
// unlike the other categories' findOrThrow. creditHours is free-typed input and
// the dashboard prices on every keystroke before validation runs; throwing
// here would crash the page mid-typing. validateSelections is what reports an
// out-of-range count (and hides the total).
export function calculateWinterTuition(selections: Selections, rates: RatesBundle): number {
  const { educationLevel, residency, creditHours } = selections;
  if (!rates.winter || educationLevel === null || residency === null || creditHours === null) return 0;

  const chart: { residency: string; credit_hours: number; price: number }[] =
    educationLevel === "graduate" ? rates.winter.graduateTuition : rates.winter.undergraduateTuition;
  const row = chart.find((r) => r.residency === residency && r.credit_hours === creditHours);
  return row ? row.price : 0;
}

// One flat fee, chosen by the student: any in-person class -> the campus
// services fee (even alongside online classes), only online classes -> the
// distance learning fee. Never both. Same amounts for undergrad and grad.
export function calculateWinterFee(selections: Selections, rates: RatesBundle): number {
  const { winterClassFormat } = selections;
  if (!rates.winter || winterClassFormat === null) return 0;
  return rates.winter.fees[FEE_COLUMN[winterClassFormat]];
}
