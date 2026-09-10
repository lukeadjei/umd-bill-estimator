"use client";

import { panelTextSizes } from "@/components/dashboard/typography";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { MAJORS } from "@/lib/calculator/majors";
import type { PanelProps } from "@/components/dashboard/selections";

// `major` isn't part of the real Selections type -- it's a plain string field
// on the `scenarios` table (see selections.ts). A real dropdown now, backed
// by MAJORS (hardcoded from UMD's catalog, see majors.ts) instead of the
// free-text field this used to be -- constraining the value to one of a real
// list is what lets TuitionPanel cross-reference it against
// DIFFERENTIAL_TUITION_MAJORS.
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
        <span className={`font-medium text-foreground ${t.label}`}>Select your major</span>
        <select
          value={selections.major}
          onChange={(event) => onChange({ major: event.target.value })}
          className={`w-full max-w-sm rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${t.body}`}
        >
          <option value="">Select a major...</option>
          {MAJORS.map((major) => (
            <option key={major} value={major}>
              {major}
            </option>
          ))}
        </select>
      </label>

      <PanelTip spacious={spacious}>
        Only your major and class standing (junior/senior) affect your bill, and only for Business, Engineering, and
        Computer Science -- every other major pays the standard rate regardless of what you select here.
      </PanelTip>
    </div>
  );
}
