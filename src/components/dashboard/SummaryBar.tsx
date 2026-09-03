import { Button } from "@/components/ui/button";

type Semester = "fall" | "spring";

// Placeholder total -- real calculateTotal(selections, rates) wiring comes
// once a form actually collects Selections and a Supabase client fetches a
// RatesBundle. sticky bottom-0 pins it to the bottom of the content column
// (desktop) or the viewport (mobile, where it's the only column) so it's
// always visible regardless of scroll position or active tab.
export function SummaryBar({ semester }: { semester: Semester }) {
  return (
    <div className="sticky bottom-0 z-30 flex items-center justify-between gap-4 rounded-none border-t border-border bg-card/95 px-4 py-4 shadow-[0_-8px_20px_-3px_rgba(0,0,0,0.32)] backdrop-blur md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">{semester === "fall" ? "Fall" : "Spring"} estimate</p>
        <p className="font-heading text-3xl font-bold text-foreground">$0.00</p>
      </div>
      <Button
        type="button"
        size="lg"
        className="rounded-full text-lg"
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
