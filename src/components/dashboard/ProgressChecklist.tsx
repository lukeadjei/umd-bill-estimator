import { CheckIcon } from "lucide-react";
import { TAB_ITEMS, type TabId } from "@/components/dashboard/tabs";

// "Visited" is a stand-in for "filled in" -- there's no real Selections
// state to check completeness against yet, so this tracks which tabs the
// user has clicked into at least once instead. Swap for real per-field
// completion once each panel's state is lifted into an actual form.
export function ProgressChecklist({ visited }: { visited: Set<TabId> }) {
  const count = visited.size;
  const total = TAB_ITEMS.length;

  return (
    <div className="animate-fade-in-up rounded-none bg-card/85 p-4 ring-1 ring-foreground/10 shadow-[-5px_8px_16px_-3px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">Progress</span>
        <span className="text-sm text-muted-foreground">
          {count} of {total} sections viewed
        </span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(count / total) * 100}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TAB_ITEMS.map((tab) => {
          const done = visited.has(tab.id);
          return (
            <span
              key={tab.id}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              {done && <CheckIcon className="size-3" />}
              {tab.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
