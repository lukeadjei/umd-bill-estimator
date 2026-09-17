import type { RatesBundle, Selections } from "@/lib/calculator/types";

// A short, human-readable summary of what's already known, appended to the
// system prompt per-request (see route.ts) so the model doesn't ask for
// fields already set on the dashboard -- conversation history alone isn't
// enough for this, since a student may have set things by clicking panels
// directly, or in an earlier session, with nothing about it in the current
// chat's history. Deliberately just a summary for the MODEL to read, never
// passed to or trusted by any tool -- verifyAiPatch/evaluateBudget always
// re-derive real values from RatesBundle, never from this string.
export function describeKnownSelections(selections: Selections): string {
  const parts: string[] = [];

  if (selections.educationLevel) parts.push(selections.educationLevel);
  if (selections.residency) parts.push(selections.residency === "resident" ? "Maryland resident" : "non-resident");
  if (selections.creditHours !== null) parts.push(`${selections.creditHours} credit hours`);
  if (selections.livingSituation) parts.push(selections.livingSituation === "on_campus" ? "on-campus" : "commuter");
  if (selections.housing) parts.push(`housing: ${selections.housing.roomType}, ${selections.housing.buildingCategory}`);
  if (selections.residentDiningPlan) parts.push(`dining: ${selections.residentDiningPlan.planName}`);
  if (selections.blockDiningPlan) parts.push(`dining: ${selections.blockDiningPlan.planLabel} (block)`);
  if (selections.parking) parts.push(`parking: ${selections.parking.permitType}, ${selections.parking.term}`);
  if (selections.appliesDifferentialTuition) parts.push("differential tuition applies");
  if (selections.insurance) parts.push("health insurance selected");
  if (selections.grants.pell > 0 || selections.grants.terrapinCommitment > 0 || selections.grants.rawlingsEA > 0 || selections.grants.misc.length > 0) {
    parts.push("has financial aid entered");
  }

  if (parts.length === 0) return "Known so far about this student: nothing yet -- every field is still unanswered.";
  return `Known so far about this student (from the dashboard, not necessarily this conversation): ${parts.join(", ")}. Semester: ${selections.semester}.`;
}

// Real, cheapest-in-category values pulled straight from the live
// RatesBundle -- for "give me a full/complete plan" requests, where the
// model should proactively pick something valid for housing/dining rather
// than pausing to ask (see the 2026-09-16 "full plan" behavior decision).
// Deliberately real values, not a description of how to guess one -- the
// model just uses these directly in setSelections, guaranteed to pass
// verifyAiPatch since they're pulled from the exact same data it validates
// against. Parking is NOT included here on purpose: it's genuinely optional
// (never required by validateSelections regardless of living situation), so
// it stays a natural follow-up question, not something to auto-fill.
export function describeCheapestDefaults(rates: RatesBundle): string {
  const cheapestHousing = rates.housingRates.reduce<RatesBundle["housingRates"][number] | undefined>(
    (min, row) => (!min || row.rate < min.rate ? row : min),
    undefined
  );
  const cheapestDining = rates.residentDiningPlans.reduce<RatesBundle["residentDiningPlans"][number] | undefined>(
    (min, row) => (!min || row.fall_price < min.fall_price ? row : min),
    undefined
  );

  const parts: string[] = [];
  if (cheapestHousing) {
    parts.push(`housing: {roomType: "${cheapestHousing.room_type}", buildingCategory: "${cheapestHousing.building_category}"}`);
  }
  if (cheapestDining) {
    parts.push(`residentDiningPlan: {planName: "${cheapestDining.plan_name}"}`);
  }
  if (parts.length === 0) return "";

  return `If -- and ONLY if -- the student has explicitly asked for a full/complete plan and hasn't specified housing or a dining plan themselves, the most affordable valid defaults available this year are: ${parts.join(", ")}. Use these directly in setSelections so the plan is actually complete, rather than pausing to ask. Never use these as defaults for a narrower question the student didn't ask you to fill in for them.`;
}
