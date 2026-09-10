import type { BlockDiningPlanRow, ResidentDiningPlanRow } from "@/lib/calculator/types";

// Every resident tier gives the same unlimited dining hall access -- the
// only real differences between tiers are Dining Dollars (a declining
// balance usable at retail/convenience locations on campus, on top of hall
// access) and guest passes (free dining hall entries for a non-plan-holder
// guest). Composed from the real row instead of hardcoded per plan name, so
// this can't drift out of sync with the actual numbers if a rate update
// changes them.
export function describeResidentPlan(row: ResidentDiningPlanRow): string {
  const guestText = `${row.guest_passes} guest pass${row.guest_passes === 1 ? "" : "es"} (free dining hall entries for a guest)`;

  if (row.dining_dollars > 0) {
    return `Unlimited access to all dining halls, plus $${row.dining_dollars} in Dining Dollars (a declining balance usable at retail/convenience locations on campus) and ${guestText}.`;
  }
  return `Unlimited access to all dining halls and ${guestText}. No Dining Dollars with this tier.`;
}

// Block (Connector) plans are a fixed number of dining hall swipes, not
// unlimited access -- a meaningfully different mechanic than the resident
// tiers above, confirmed directly (not assumed): meals carry over from Fall
// into Spring if unused, but expire at the end of the academic year, and a
// block plan's Dining Dollars (when it has any) only work at
// retail/convenience locations if the specific plan actually includes a
// Dining Dollars balance -- the meal-swipe count alone doesn't unlock that.
export function describeBlockPlan(row: BlockDiningPlanRow): string {
  const base = `${row.meal_count} dining hall swipes for the semester, not unlimited -- think of it like a punch card. Unused meals carry over from Fall into Spring, but expire at the end of the academic year.`;

  if (row.dining_dollars > 0) {
    return `${base} Also includes $${row.dining_dollars} in Dining Dollars, which works at retail/convenience locations since this plan comes with a Dining Dollars balance.`;
  }
  return `${base} No Dining Dollars with this plan, so it doesn't work at retail/convenience locations -- only dining hall swipes.`;
}
