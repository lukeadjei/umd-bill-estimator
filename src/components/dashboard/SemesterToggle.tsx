import { Button } from "@/components/ui/button";
import { SEMESTERS, SEMESTER_LABELS } from "@/lib/calculator/constants";
import type { Semester } from "@/lib/calculator/types";

export function SemesterToggle({
  value,
  onChange,
}: {
  value: Semester;
  onChange: (semester: Semester) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-muted p-1">
      {SEMESTERS.map((semester) => (
        <Button
          key={semester}
          type="button"
          variant={value === semester ? "default" : "ghost"}
          className="rounded-full text-base"
          aria-pressed={value === semester}
          onClick={() => onChange(semester)}
        >
          {SEMESTER_LABELS[semester]}
        </Button>
      ))}
    </div>
  );
}
