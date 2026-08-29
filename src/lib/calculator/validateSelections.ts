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

  if (selections.creditHours < MIN_CREDIT_HOURS || selections.creditHours > MAX_CREDIT_HOURS) {
    errors.push({
      field: "creditHours",
      message: `Credit hours must be between ${MIN_CREDIT_HOURS} and ${MAX_CREDIT_HOURS}.`,
    });
  }

  if (selections.livingSituation === "commuter") {
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

  if (selections.parking) {
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
