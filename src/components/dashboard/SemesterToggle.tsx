import { Button } from "@/components/ui/button";
import { SEMESTER_LABELS } from "@/lib/calculator/constants";
import type { Semester } from "@/lib/calculator/types";

// `semesters` is whatever this academic year can actually offer (see availableSemesters) --
// Winter only appears when the year has winter rates. `fullWidth` stretches the buttons across
// the row: used on phones, where it sits in the page header instead of the cramped sticky nav.
export function SemesterToggle({
  value,
  onChange,
  semesters,
  fullWidth = false,
}: {
  value: Semester;
  onChange: (semester: Semester) => void;
  semesters: readonly Semester[];
  fullWidth?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1 rounded-full bg-muted p-1 ${fullWidth ? "w-full" : "shrink-0"}`}>
      {semesters.map((semester) => (
        <Button
          key={semester}
          type="button"
          variant={value === semester ? "default" : "ghost"}
          className={`rounded-full px-3 text-sm md:px-4 md:text-base ${fullWidth ? "flex-1" : ""}`}
          aria-pressed={value === semester}
          onClick={() => onChange(semester)}
        >
          {SEMESTER_LABELS[semester]}
        </Button>
      ))}
    </div>
  );
}
