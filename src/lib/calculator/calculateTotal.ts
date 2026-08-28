import type { RatesBundle, Selections } from "./types";

// A missing match means the selection doesn't correspond to real rate data --
// that's a bug (stale reference, mismatched dropdown), not a "missing
// selection" in the rule-4 sense, so this fails loudly instead of silently
// pricing it as $0 or producing NaN.
function findOrThrow<T>(rows: T[], predicate: (row: T) => boolean, description: string): T {
  const row = rows.find(predicate);
  if (!row) throw new Error(`calculateTotal: no rate data found for ${description}`);
  return row;
}

// Undergrad: flat rate at the credit threshold, per-credit below it.
// Grad: always per-credit, no flat rate exists at that level.
export function calculateTuition(selections: Selections, rates: RatesBundle): number {
  if (selections.educationLevel === "graduate") {
    const rate = findOrThrow(
      rates.graduateTuitionRates,
      (r) => r.residency === selections.residency,
      `graduate tuition rate (residency: ${selections.residency})`
    );
    // Always per-credit -- no full-time flat rate exists at the graduate level.
    return rate.per_credit_rate * selections.creditHours;
  }

  const isFullTime = selections.creditHours >= rates.academicYear.undergrad_tuition_full_time_credit_threshold;
  const rate = findOrThrow(
    rates.tuitionRates,
    (r) => r.residency === selections.residency,
    `undergraduate tuition rate (residency: ${selections.residency})`
  );
  return isFullTime ? rate.full_time_rate : rate.per_credit_rate * selections.creditHours;
}

// Same flat-vs-per-credit split as calculateTuition, added as a separate line item.
export function calculateDifferentialTuition(selections: Selections, rates: RatesBundle): number {
  // Assumption, not yet confirmed: graduate students never get charged
  // differential tuition (it was researched under undergrad junior/senior
  // classification). Revisit if that turns out to be wrong.
  if (selections.educationLevel === "graduate") return 0;
  if (!selections.appliesDifferentialTuition) return 0;

  const isFullTime = selections.creditHours >= rates.academicYear.undergrad_tuition_full_time_credit_threshold;
  const rate = findOrThrow(rates.differentialTuition, () => true, "differential tuition rate");
  return isFullTime ? rate.full_time_rate : rate.per_credit_rate * selections.creditHours;
}

// Flat rate above the fee credit threshold, different flat rate below it -- no per-credit math, unlike tuition.
export function calculateFees(selections: Selections, rates: RatesBundle): number {
  const isFullTime = selections.creditHours >= rates.academicYear.full_time_fee_credit_threshold;

  if (selections.educationLevel === "graduate") {
    const rate = findOrThrow(rates.graduateFees, () => true, "graduate mandatory fee rate");
    return isFullTime ? rate.full_time_rate : rate.part_time_rate;
  }

  const rate = findOrThrow(rates.mandatoryFees, () => true, "undergraduate mandatory fee rate");
  return isFullTime ? rate.full_time_rate : rate.part_time_rate;
}

// Eligibility (who's allowed to opt in) is validateSelections' job -- this just prices it if selected.
// calculateTotal is one semester at a time, so this picks fall_price or spring_price -- never both.
export function calculateInsurance(selections: Selections, rates: RatesBundle): number {
  if (!selections.insurance) return 0;
  const rate = findOrThrow(rates.healthInsuranceRates, () => true, "health insurance rate");
  return selections.semester === "fall" ? rate.fall_price : rate.spring_price;
}

// housing_rates.rate is the full ACADEMIC YEAR total -- half of it is one semester's share.
export function calculateHousing(selections: Selections, rates: RatesBundle): number {
  if (!selections.housing) return 0;
  const { roomType, buildingCategory } = selections.housing;
  const rate = findOrThrow(
    rates.housingRates,
    (r) => r.room_type === roomType && r.building_category === buildingCategory,
    `housing rate (${roomType}, ${buildingCategory})`
  );
  return rate.rate / 2;
}

// resident + block are mutually exclusive by construction (validateSelections enforces this, not here).
export function calculateDining(selections: Selections, rates: RatesBundle): number {
  if (selections.residentDiningPlan) {
    const { planName } = selections.residentDiningPlan;
    const rate = findOrThrow(
      rates.residentDiningPlans,
      (r) => r.plan_name === planName,
      `resident dining plan (${planName})`
    );
    // Resident plans price fall/spring separately -- pick this semester's price, don't sum both.
    return selections.semester === "fall" ? rate.fall_price : rate.spring_price;
  }

  if (selections.blockDiningPlan) {
    // block_dining_plans has one price column, no fall/spring split -- treated as
    // already a per-semester figure (no term/annual dimension to it either way).
    const { planLabel } = selections.blockDiningPlan;
    const rate = findOrThrow(
      rates.blockDiningPlans,
      (r) => r.plan_label === planLabel,
      `block dining plan (${planLabel})`
    );
    return rate.price;
  }

  return 0;
}

// Keyed on permit type AND term. Whatever term was picked (even "annual") gets
// charged in full to whichever semester is being calculated -- UMD bills it that
// way, no splitting, unlike housing.
export function calculateParking(selections: Selections, rates: RatesBundle): number {
  if (!selections.parking) return 0;
  const { permitType, term } = selections.parking;
  const rate = findOrThrow(
    rates.parkingPermits,
    (r) => r.permit_type === permitType && r.term === term,
    `parking permit (${permitType}, ${term})`
  );
  return rate.price;
}

// One semester's total (fall or spring, per selections.semester) -- not the full year.
// Sole source of a final dollar total (CLAUDE.md rule 1); summing two calls (fall + spring)
// gets the annual figure, a separate concern for later.
export function calculateTotal(selections: Selections, rates: RatesBundle): number {
  return (
    calculateTuition(selections, rates) +
    calculateDifferentialTuition(selections, rates) +
    calculateFees(selections, rates) +
    calculateInsurance(selections, rates) +
    calculateHousing(selections, rates) +
    calculateDining(selections, rates) +
    calculateParking(selections, rates)
  );
}
