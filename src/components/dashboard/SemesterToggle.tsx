import { Button } from "@/components/ui/button";

type Semester = "fall" | "spring";

export function SemesterToggle({
  value,
  onChange,
}: {
  value: Semester;
  onChange: (semester: Semester) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-muted p-1">
      <Button
        type="button"
        variant={value === "fall" ? "default" : "ghost"}
        className="rounded-full text-base"
        aria-pressed={value === "fall"}
        onClick={() => onChange("fall")}
      >
        Fall
      </Button>
      <Button
        type="button"
        variant={value === "spring" ? "default" : "ghost"}
        className="rounded-full text-base"
        aria-pressed={value === "spring"}
        onClick={() => onChange("spring")}
      >
        Spring
      </Button>
    </div>
  );
}
