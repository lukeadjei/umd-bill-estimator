const CATEGORIES = ["Tuition", "Fees", "Housing", "Meals", "Parking", "Insurance"] as const;

type Semester = "fall" | "spring";

type CostBreakdownProps = {
  semester: Semester;
  values: {
    tuition: number;
    fees: number;
    housing: number;
    meals: number;
    parking: number;
    insurance: number;
  };
};

const CATEGORY_TO_VALUE_KEY = {
  Tuition: "tuition",
  Fees: "fees",
  Housing: "housing",
  Meals: "meals",
  Parking: "parking",
  Insurance: "insurance",
} as const satisfies Record<(typeof CATEGORIES)[number], keyof CostBreakdownProps["values"]>;

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Itemized breakdown of the current semester's estimate -- fills the blank
// space next to/above the chat panel with a preview of the real numbers
// calculateTotal produces, rather than nothing until the summary bar's
// single number.
export function CostBreakdown({ semester, values }: CostBreakdownProps) {
  return (
    <div className="animate-fade-in-up rounded-none bg-card/85 p-4 ring-1 ring-foreground/10 shadow-[-5px_8px_16px_-3px_rgba(0,0,0,0.28)]">
      <p className="text-sm font-semibold text-foreground">{semester === "fall" ? "Fall" : "Spring"} breakdown</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {CATEGORIES.map((category) => (
          <li key={category} className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{category}</span>
            <span className="font-medium text-foreground">
              {formatCurrency(values[CATEGORY_TO_VALUE_KEY[category]])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
