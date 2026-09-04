import {
  APARTMENT_BUILDING_CATEGORY,
  COMMUTER_PARKING_PERMIT_TYPE,
  OVERNIGHT_STORAGE_PARKING_PERMIT_TYPE,
  RESIDENT_PARKING_PERMIT_TYPE,
} from "./constants";
import type { Selections } from "./types";

const MIN_CREDIT_HOURS = 1;
const MAX_CREDIT_HOURS = 20;

export type ValidationError = {
  // Which selection this reason is about, so the UI can point at the right field.
  field: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

// Never prices anything, never touches the DB -- only answers "is this a legal
// combination." calculateTotal handles pricing whatever's selected regardless
// of whether it's legal; this is the only place that decides legality.
export function validateSelections(selections: Selections): ValidationResult {
  const errors: ValidationError[] = [];

  // Always-required fields, reported on their own rather than letting a
  // downstream check guess a default for a field the user hasn't answered
  // yet. Without this, an unanswered livingSituation would silently fall
  // through to the "else" (on_campus) branch below and produce a misleading
  // combination error against a choice the user never actually made.
  if (selections.educationLevel === null) {
    errors.push({ field: "educationLevel", message: "Select undergraduate or graduate." });
  }
  if (selections.residency === null) {
    errors.push({ field: "residency", message: "Select Maryland resident or non-resident." });
  }

  if (selections.creditHours === null) {
    errors.push({ field: "creditHours", message: "Enter your credit hours." });
  } else if (selections.creditHours < MIN_CREDIT_HOURS || selections.creditHours > MAX_CREDIT_HOURS) {
    errors.push({
      field: "creditHours",
      message: `Credit hours must be between ${MIN_CREDIT_HOURS} and ${MAX_CREDIT_HOURS}.`,
    });
  }

  if (selections.livingSituation === null) {
    errors.push({ field: "livingSituation", message: "Select whether you're living on-campus or commuting." });
  } else if (selections.livingSituation === "commuter") {
    if (selections.housing) {
      errors.push({ field: "housing", message: "Commuter students shouldn't select on-campus housing." });
    }
    if (selections.residentDiningPlan) {
      errors.push({
        field: "residentDiningPlan",
        message: "Commuter students can't purchase a resident dining plan -- a block dining plan is available instead.",
      });
    }
  } else {
    // on_campus
    if (!selections.housing) {
      errors.push({ field: "housing", message: "On-campus students must select a housing option." });
    } else if (selections.housing.buildingCategory !== APARTMENT_BUILDING_CATEGORY && !selections.residentDiningPlan) {
      // Deliberately checks residentDiningPlan specifically -- a block plan doesn't
      // satisfy this requirement, only a resident plan does.
      errors.push({
        field: "residentDiningPlan",
        message: `${selections.housing.buildingCategory} housing doesn't have a kitchen, so a resident dining plan is required.`,
      });
    }
  }

  if (selections.residentDiningPlan && selections.blockDiningPlan) {
    errors.push({ field: "diningPlan", message: "Choose either a resident dining plan or a block dining plan, not both." });
  }

  // Skipped entirely while livingSituation is still unanswered -- can't know
  // which permit types are "allowed" without it, and the required-field
  // check above already covers prompting the user to answer it.
  if (selections.parking && selections.livingSituation !== null) {
    const allowedPermitTypes =
      selections.livingSituation === "on_campus"
        ? [RESIDENT_PARKING_PERMIT_TYPE]
        : [COMMUTER_PARKING_PERMIT_TYPE, OVERNIGHT_STORAGE_PARKING_PERMIT_TYPE];

    if (!allowedPermitTypes.includes(selections.parking.permitType)) {
      errors.push({
        field: "parking",
        message:
          selections.livingSituation === "on_campus"
            ? "On-campus students can only purchase a Resident parking permit."
            : "Commuter students can only purchase a Commuter or Overnight Storage parking permit.",
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
