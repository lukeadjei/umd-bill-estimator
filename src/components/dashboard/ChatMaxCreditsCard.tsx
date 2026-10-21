import { CheckCircle2Icon, InfoIcon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEMESTER_LABELS } from "@/lib/calculator/constants";
import type { FindMaxCreditsResult } from "@/lib/ai/tools";
import type { AiSelectionsPatch } from "@/lib/calculator/verifyAiPatch";

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function creditsLabel(count: number) {
  return `${count} credit hour${count === 1 ? "" : "s"}`;
}

// The visual for a findMaxCredits result: the most credit hours that fit a budget, with the real
// totals the engine computed (nothing here is calculated -- it only lays out the tool's numbers).
// Like an evaluateBudget scenario it's a HYPOTHETICAL: the student's plan only changes if they click
// Apply, which hands a patch to the same onSelectionsChange updater setSelections uses.
export function ChatMaxCreditsCard({
  result,
  onApply,
}: {
  result: FindMaxCreditsResult;
  onApply: (patch: AiSelectionsPatch) => void;
}) {
  const semesterLabel = SEMESTER_LABELS[result.semester];
  const afterAidNote = result.aid > 0 ? " after aid" : "";

  if (result.status === "needs_info") {
    return (
      <Card size="sm" className="animate-fade-in-up w-full max-w-[85%] border-l-4 border-l-amber-500 bg-card/90">
        <CardContent className="flex flex-col gap-1.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <InfoIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />A few more details first
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {result.validationErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  if (result.status === "none_fit" || !result.atMax) {
    return (
      <Card size="sm" className="animate-fade-in-up w-full max-w-[85%] border-l-4 border-l-destructive bg-card/90">
        <CardContent className="flex flex-col gap-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <XCircleIcon className="size-4 shrink-0 text-destructive" />
            Over {formatCurrency(result.targetBudget)} at any credit count
          </p>
          {result.cheapest && (
            <p className="text-sm text-muted-foreground">
              {semesterLabel}: even {creditsLabel(result.cheapest.creditHours)} comes to{" "}
              <span className="font-semibold text-foreground">{formatCurrency(result.cheapest.netTotal)}</span>
              {afterAidNote}.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const { atMax, firstOver, sameCostFrom } = result;
  const atSemesterLimit = atMax.creditHours === result.creditRange.max;

  return (
    <Card size="sm" className="animate-fade-in-up w-full max-w-[85%] border-l-4 border-l-emerald-500 bg-card/90">
      <CardContent className="flex flex-col gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            Up to {creditsLabel(atMax.creditHours)}
          </p>
          <p className="text-sm text-muted-foreground">
            {semesterLabel} total{afterAidNote}:{" "}
            <span className="font-semibold text-foreground">{formatCurrency(atMax.netTotal)}</span> (budget{" "}
            {formatCurrency(result.targetBudget)})
          </p>
        </div>

        <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          {sameCostFrom !== null && sameCostFrom < atMax.creditHours && (
            <li>
              {sameCostFrom}–{atMax.creditHours} credits all cost the same (flat full-time rate).
            </li>
          )}
          {firstOver && (
            <li>
              {creditsLabel(firstOver.creditHours)} would be {formatCurrency(firstOver.netTotal)} — over budget.
            </li>
          )}
          {atSemesterLimit && <li>That&apos;s the most {semesterLabel} allows — the budget isn&apos;t the limit.</li>}
        </ul>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-fit rounded-full"
          onClick={() => onApply({ ...result.changes, creditHours: atMax.creditHours })}
        >
          Apply {creditsLabel(atMax.creditHours)}
        </Button>
      </CardContent>
    </Card>
  );
}
