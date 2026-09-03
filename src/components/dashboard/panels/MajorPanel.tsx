"use client";

import { panelTextSizes } from "@/components/dashboard/typography";
import { PanelTip } from "@/components/dashboard/PanelTip";
import type { PanelProps } from "@/components/dashboard/selections";

// `major` isn't part of the real Selections type -- it's a plain string field
// on the `scenarios` table, drafted for a future major-based dropdown/feature
// but not currently wired to differential-tuition logic in the calc engine
// (see PROGRESS-LOG.md, 2026-08-30). Picking a major here won't do anything
// downstream yet -- this panel is just the field's future home.
//
// TODO (backlog, not urgent): this is a free-text field because the scraper
// doesn't fetch a real major list yet. Once it does, swap this for a real
// search/select populated from that scraped list instead of a plain input.
export function MajorPanel({ selections, onChange, spacious }: PanelProps) {
  const t = panelTextSizes(spacious);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h2 className={`font-heading font-semibold text-foreground ${t.heading}`}>Major</h2>
        <p className={`text-muted-foreground ${t.body}`}>
          Some majors (Business, Engineering, Computer Science juniors &amp; seniors) pay differential tuition on top
          of the standard rate.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={`font-medium text-foreground ${t.label}`}>Search your major</span>
        <input
          type="text"
          value={selections.major}
          onChange={(event) => onChange({ major: event.target.value })}
          placeholder="e.g. Computer Science"
          className={`w-full max-w-sm rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${t.body}`}
        />
        <span className={`text-muted-foreground ${t.hint}`}>
          Free text for now -- becomes a real search once the scraper pulls the major list (backlog item).
        </span>
      </label>

      <PanelTip spacious={spacious}>
        Only your major and class standing (junior/senior) affect your bill, and only for Business, Engineering, and
        Computer Science -- every other major pays the standard rate regardless of what you enter here.
      </PanelTip>
    </div>
  );
}
