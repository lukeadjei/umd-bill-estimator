"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { SEMESTER_LABELS } from "@/lib/calculator/constants";
import type { Semester } from "@/lib/calculator/types";
import type { LabeledAmount } from "@/components/dashboard/billLines";

type CostBreakdownProps = {
  semester: Semester;
  // The rows for this semester (see breakdownLines) -- fall/spring list six categories,
  // winter lists tuition and its flat fee.
  lines: LabeledAmount[];
  aid: number;
};

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Itemized breakdown of the current semester's estimate -- fills the blank
// space next to/above the chat panel with a preview of the real numbers
// calculateTotal produces, rather than nothing until the summary bar's
// single number.
export function CostBreakdown({ semester, lines, aid }: CostBreakdownProps) {
  // Phones only: the lines are collapsed behind the heading (the summary bar
  // already shows the total), so the page isn't a long scroll. md+ always shows them.
  const [open, setOpen] = useState(false);

  return (
    <div className="animate-fade-in-up rounded-none bg-card/85 p-4 ring-1 ring-foreground/10 shadow-[-5px_8px_16px_-3px_rgba(0,0,0,0.28)]">
      <button
        type="button"
        className="-my-2 flex w-full items-center justify-between py-2 text-sm font-semibold text-foreground md:pointer-events-none"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        {SEMESTER_LABELS[semester]} breakdown
        <ChevronDownIcon className={`size-4 text-muted-foreground transition-transform md:hidden ${open ? "rotate-180" : ""}`} />
      </button>
      <ul className={`mt-2 flex-col gap-1.5 md:flex ${open ? "flex" : "hidden"}`}>
        {lines.map((line) => (
          <li key={line.label} className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{line.label}</span>
            <span className="font-medium text-foreground">{formatCurrency(line.amount)}</span>
          </li>
        ))}
        {/* Only shown once aid actually applies -- the fixed categories above
            always render (even at $0), but an "Aid: $0.00" row for every
            visitor who's never touched that tab would just be noise. */}
        {aid > 0 && (
          <li className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Aid</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">-{formatCurrency(aid)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
