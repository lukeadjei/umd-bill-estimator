// Exact-match strings the validation rules key off of. Not a full mirror of the
// rate tables -- just the handful of values that business logic (not just
// display) actually branches on.

// The only building category with a kitchen -- the one where a dining plan is optional, not required.
export const APARTMENT_BUILDING_CATEGORY = "Apartment";

export const RESIDENT_PARKING_PERMIT_TYPE = "Resident";
export const COMMUTER_PARKING_PERMIT_TYPE = "Commuter";
export const OVERNIGHT_STORAGE_PARKING_PERMIT_TYPE = "Overnight Storage";

// Grant/aid bounds -- 0 always means "not entered" and is always allowed
// regardless of these ranges; a nonzero amount must fall within them. Shared
// between the dashboard input layer (AidPanel) and the server-side
// re-validation in saveScenario so the two never drift out of sync.
export const NAMED_GRANT_MIN_AMOUNT = 1;
export const NAMED_GRANT_MAX_AMOUNT = 20_000;
export const MISC_GRANT_MIN_AMOUNT = 1;
export const MISC_GRANT_MAX_AMOUNT = 100_000;
export const MAX_MISC_GRANTS = 5;
export const MISC_GRANT_NOTE_MAX_LENGTH = 50;

// True for 0 (not entered) or any amount within [min, max] -- never true for
// a negative amount or one over the cap.
export function isValidGrantAmount(amount: number, max: number): boolean {
  return amount === 0 || (amount >= NAMED_GRANT_MIN_AMOUNT && amount <= max);
}
