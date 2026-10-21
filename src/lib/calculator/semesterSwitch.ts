import { EMPTY_SELECTIONS } from "./constants";
import type { Selections, Semester } from "./types";

// Switching to a semester of a different kind (fall/spring <-> winter) is "a whole new
// thing", so everything resets except the two answers that mean the same in both:
// education level and residency. Grants reset too -- they belong to the plan being left.
// Lives here (not in the dashboard components) so the AI tools and the dashboard share ONE
// definition of what a switch throws away.
export function resetSelectionsForSemesterChange(selections: Selections, semester: Semester): Selections {
  return {
    ...EMPTY_SELECTIONS,
    semester,
    educationLevel: selections.educationLevel,
    residency: selections.residency,
  };
}

// True when a semester switch would throw something away: any selection differs from what the
// reset would leave behind. Education level and residency never count -- they survive.
export function selectionsHaveProgress(selections: Selections): boolean {
  const afterReset = resetSelectionsForSemesterChange(selections, selections.semester);
  return (Object.keys(afterReset) as (keyof Selections)[]).some(
    (key) => JSON.stringify(selections[key]) !== JSON.stringify(afterReset[key])
  );
}
