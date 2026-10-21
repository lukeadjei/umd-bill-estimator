import {
  APARTMENT_BUILDING_CATEGORY,
  COMMUTER_PARKING_PERMIT_TYPE,
  OVERNIGHT_STORAGE_PARKING_PERMIT_TYPE,
  RESIDENT_PARKING_PERMIT_TYPE,
} from "./constants";
import { SEMESTER_CONFIG } from "./semesterConfig";
import type { RatesBundle, Selections, Semester } from "./types";

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
//
// Takes `rates` because some limits live in the database, not in code (winter's
// credit cap is academic_years.winter_max_credit_hours). The fields every
// semester needs are checked here; the rules that only make sense for one kind
// of semester live in SEMESTER_RULES below.
export function validateSelections(selections: Selections, rates: RatesBundle): ValidationResult {
  const errors: ValidationError[] = [];

  // Always-required fields, reported on their own rather than letting a
  // downstream check guess a default for a field the user hasn't answered yet.
  if (selections.educationLevel === null) {
    errors.push({ field: "educationLevel", message: "Select undergraduate or graduate." });
  }
  if (selections.residency === null) {
    errors.push({ field: "residency", message: "Select Maryland resident or non-resident." });
  }

  const { min, max } = SEMESTER_CONFIG[selections.semester].creditHourRange(rates);
  if (selections.creditHours === null) {
    errors.push({ field: "creditHours", message: "Enter your credit hours." });
  } else if (max >= min && (selections.creditHours < min || selections.creditHours > max)) {
    // max < min means this semester has no legal range at all (e.g. winter isn't
    // configured) -- its own rules report that, not a nonsense "between 1 and 0".
    errors.push({ field: "creditHours", message: `Credit hours must be between ${min} and ${max}.` });
  }

  errors.push(...SEMESTER_RULES[selections.semester](selections, rates));

  return { valid: errors.length === 0, errors };
}

// Fall and spring: living situation decides what housing, dining and parking are
// legal. Skipped entirely for winter, which has none of those. Without the
// null check first, an unanswered livingSituation would silently fall through
// to the "else" (on_campus) branch and produce a misleading combination error
// against a choice the user never actually made.
function validateRegularSemester(selections: Selections): ValidationError[] {
  const errors: ValidationError[] = [];

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

  return errors;
}

// Winter Session: only tuition + one flat fee, so the rules are availability,
// whole-number credits (the price chart only has whole counts), and that the
// student has chosen which fee applies.
function validateWinterSession(selections: Selections, rates: RatesBundle): ValidationError[] {
  const errors: ValidationError[] = [];

  if (rates.winter === null) {
    errors.push({ field: "semester", message: "Winter Session isn't available for this academic year." });
  }
  if (selections.creditHours !== null && !Number.isInteger(selections.creditHours)) {
    errors.push({ field: "creditHours", message: "Winter Session credit hours must be a whole number." });
  }
  if (selections.winterClassFormat === null) {
    errors.push({
      field: "winterClassFormat",
      message: "Select whether any of your classes are in person or all of them are online.",
    });
  }

  return errors;
}

// A Record<Semester, ...> so a new semester is a compile error until it has rules.
const SEMESTER_RULES: Record<Semester, (selections: Selections, rates: RatesBundle) => ValidationError[]> = {
  fall: validateRegularSemester,
  spring: validateRegularSemester,
  winter: validateWinterSession,
};
