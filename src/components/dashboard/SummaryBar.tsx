import { Button } from "@/components/ui/button";

type Semester = "fall" | "spring";

type SummaryBarProps = {
  semester: Semester;
  total: number;
  validation: { valid: boolean; errors: { field: string; message: string }[] };
};

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Sticky bottom-0 pins it to the bottom of the content column (desktop) or
// the viewport (mobile, where it's the only column) so it's always visible
// regardless of scroll position or active tab.
//
// When the current selections are invalid, calculateTotal will still happily
// price whatever's selected -- it doesn't know a combination is illegal
// (e.g. a commuter buying a Resident parking permit), so a computed number
// in that state would be misleading. In that case we hide the dollar total,
// disable the CTA, and surface the validation errors instead -- this is the
// only place in the current UI those errors reach the user.
export function SummaryBar({ semester, total, validation }: SummaryBarProps) {
  return (
    <div className="sticky bottom-0 z-30 flex items-center justify-between gap-4 rounded-none border-t border-border bg-card/95 px-4 py-4 shadow-[0_-8px_20px_-3px_rgba(0,0,0,0.32)] backdrop-blur md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">{semester === "fall" ? "Fall" : "Spring"} estimate</p>
        {validation.valid ? (
          <p className="font-heading text-3xl font-bold text-foreground">{formatCurrency(total)}</p>
        ) : (
          <p className="font-heading text-3xl font-bold text-muted-foreground">Fix errors to see total</p>
        )}
        {validation.errors.length > 0 && (
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {validation.errors.map((error) => (
              <li key={error.field} className="text-xs font-medium text-destructive">
                {error.message}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button
        type="button"
        size="lg"
        className="rounded-full text-lg"
        disabled={!validation.valid}
        onClick={() => {
          // TODO: once calculateTotal + persistence are wired, save the
          // scenario and navigate to the results/summary page (PDF
          // download / shareable link). No-op for this skeleton.
        }}
      >
        Generate Plan
      </Button>
    </div>
  );
}
