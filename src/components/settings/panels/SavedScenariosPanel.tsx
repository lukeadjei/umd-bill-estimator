import Link from "next/link";
import type { SavedScenario } from "@/lib/supabase/scenarios";

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(isoTimestamp: string) {
  return new Date(isoTimestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// The array arrives newest-first (already sorted by the query in
// getUserScenarios), so this doesn't re-sort it.
// Each row links to /dashboard?scenario=<id>, which loads that scenario's
// saved selections back into the dashboard. No separate delete action per
// scenario yet -- delete wasn't requested for individual scenarios in this
// pass.
export function SavedScenariosPanel({ scenarios }: { scenarios: SavedScenario[] }) {
  if (scenarios.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <h2 className="font-heading text-xl font-semibold text-foreground">Saved Scenarios</h2>
        <p className="max-w-sm text-base text-muted-foreground">
          You haven&apos;t saved any scenarios yet. Once you generate a plan on the dashboard, it&apos;ll show up
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Saved Scenarios</h2>
        <p className="text-base text-muted-foreground">Every estimate you&apos;ve saved, newest first.</p>
      </div>

      <ul className="flex flex-col gap-3">
        {scenarios.map((scenario) => (
          <li key={scenario.id}>
            <Link
              href={`/dashboard?scenario=${scenario.id}`}
              className="flex items-center justify-between gap-4 rounded-none bg-card/85 p-4 ring-1 ring-foreground/10 shadow-[-5px_8px_16px_-3px_rgba(0,0,0,0.28)] transition-colors hover:bg-card hover:ring-foreground/20"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-medium text-foreground">{scenario.name}</span>
                {scenario.note ? (
                  <span className="text-xs italic text-muted-foreground">{scenario.note}</span>
                ) : null}
                <span className="text-sm text-muted-foreground">{formatDate(scenario.createdAt)}</span>
              </div>
              <span className="font-heading text-lg font-semibold text-foreground">
                {formatCurrency(scenario.computedTotal)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
