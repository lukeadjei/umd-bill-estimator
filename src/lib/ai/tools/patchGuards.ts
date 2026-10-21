import { SEMESTER_LABELS } from "@/lib/calculator/constants";
import { SEMESTER_CONFIG, sameSemesterKind } from "@/lib/calculator/semesterConfig";
import { selectionsHaveProgress } from "@/lib/calculator/semesterSwitch";
import type { RatesBundle, Selections, Semester } from "@/lib/calculator/types";
import { inapplicablePatchFields, mergeSelectionsPatch, type AiSelectionsPatch } from "@/lib/calculator/verifyAiPatch";

// verifyAiPatch answers "is this shaped like real data". These answer the questions that need the
// student's CURRENT plan or the target semester -- the cases where a perfectly well-formed patch
// would still do the wrong thing. Each returns plain-language problems that are fed straight back
// to the model as the tool's result, so it can explain or ask instead of silently misbehaving.

function inapplicableFieldProblem(fields: string[], semester: Semester): string {
  const semesterName = SEMESTER_LABELS[semester];
  return `${fields.join(", ")} ${fields.length === 1 ? "doesn't" : "don't"} apply to ${semesterName}${
    semester === "winter" ? " Session, which has only tuition and one flat fee" : ""
  } -- leave ${fields.length === 1 ? "it" : "them"} out.`;
}

// For a hypothetical (evaluateBudget / findMaxCredits scenario): nothing is applied, so only the
// "does this field even matter in that semester" check is needed.
export function checkScenarioPatch(patch: AiSelectionsPatch, semester: Semester): string[] {
  const unused = inapplicablePatchFields(patch, semester);
  return unused.length > 0 ? [inapplicableFieldProblem(unused, semester)] : [];
}

// For setSelections, which really changes the student's plan.
export function checkPatchForRealPlan(patch: AiSelectionsPatch, current: Selections, rates: RatesBundle): string[] {
  const problems: string[] = [];
  const merged = mergeSelectionsPatch(current, patch);

  // A switch to a different kind of bill (fall/spring <-> winter) clears the plan. The dashboard asks
  // the student to confirm that; the assistant has no way to, so it never does it over an existing plan.
  if (
    patch.semester !== undefined &&
    patch.semester !== current.semester &&
    !sameSemesterKind(current.semester, patch.semester) &&
    selectionsHaveProgress(current)
  ) {
    problems.push(
      `Switching from ${SEMESTER_LABELS[current.semester]} to ${SEMESTER_LABELS[patch.semester]} would clear the student's current plan. ` +
        `Do not do this yourself: tell them to use the semester buttons on the page (it asks them to confirm), ` +
        `then help them fill in ${SEMESTER_LABELS[patch.semester]} once they have.`
    );
    return problems;
  }

  problems.push(...checkScenarioPatch(patch, merged.semester));

  if (patch.creditHours !== undefined && patch.creditHours !== null) {
    const { min, max } = SEMESTER_CONFIG[merged.semester].creditHourRange(rates);
    if (max >= min && (patch.creditHours < min || patch.creditHours > max)) {
      problems.push(`${SEMESTER_LABELS[merged.semester]} allows ${min} to ${max} credit hours; ${patch.creditHours} isn't possible.`);
    }
  }

  return problems;
}
