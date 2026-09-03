import { Button } from "@/components/ui/button";

/**
 * Single-select pill group, reused across the tab panels for placeholder
 * fields (education level, residency, living situation, dining plan, permit
 * type/term) so each panel isn't hand-rolling the same button-group markup.
 * Not real form state -- each panel keeps this local until the session that
 * wires up a real Selections-backed form.
 */
export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  spacious = false,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  spacious?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? "default" : "outline"}
          className={spacious ? "rounded-full text-lg" : "rounded-full text-base"}
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
