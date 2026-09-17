import { CheckIcon } from "lucide-react";
import { describeSelectionsPatch } from "./chatSelectionsFormat";
import type { AiSelectionsPatch } from "@/lib/calculator/verifyAiPatch";

// One small chip per field the AI just set -- not a paragraph of prose.
// Matches the "bullet-style, not prose, for confirmations" call from the
// chat design plan (PROGRESS-LOG.md, 2026-09-15): each field independently
// scannable, bold value over muted label (same convention CostBreakdown/
// SummaryBar already use elsewhere in this app).
export function ChatConfirmationChips({ patch }: { patch: AiSelectionsPatch }) {
  const entries = describeSelectionsPatch(patch);
  if (entries.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1">
      {entries.map((entry) => (
        <li
          key={entry.field}
          className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-800 dark:text-emerald-300"
        >
          <CheckIcon className="size-3.5 shrink-0" />
          <span className="text-muted-foreground">{entry.field} —</span>
          <span className="font-medium">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}
