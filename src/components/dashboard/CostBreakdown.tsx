const CATEGORIES = ["Tuition", "Fees", "Housing", "Meals", "Parking", "Insurance"] as const;

type Semester = "fall" | "spring";

// Placeholder line items -- fills the blank space next to/above the chat
// panel with a preview of the real itemized breakdown calculateTotal will
// eventually produce, rather than nothing until the summary bar's single
// number. Every row is $0.00 until that wiring exists.
export function CostBreakdown({ semester }: { semester: Semester }) {
  return (
    <div className="animate-fade-in-up rounded-none bg-card/85 p-4 ring-1 ring-foreground/10 shadow-[-5px_8px_16px_-3px_rgba(0,0,0,0.28)]">
      <p className="text-sm font-semibold text-foreground">{semester === "fall" ? "Fall" : "Spring"} breakdown</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {CATEGORIES.map((category) => (
          <li key={category} className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{category}</span>
            <span className="font-medium text-foreground">$0.00</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Fills in once calculateTotal is wired to real selections.</p>
    </div>
  );
}
