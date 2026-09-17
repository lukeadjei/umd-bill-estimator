import { CheckCircle2Icon, TriangleAlertIcon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { describeSelectionsPatch } from "./chatSelectionsFormat";
import type { EvaluateBudgetResult, EvaluateBudgetScenario } from "@/lib/ai/tools";
import type { AiSelectionsPatch } from "@/lib/calculator/verifyAiPatch";

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Fixed, statically-analyzable stagger delays -- Tailwind's JIT scans source
// text for class names, so a template-interpolated arbitrary value like
// `[animation-delay:${i * 90}ms]` would never actually get generated. Same
// fixed-list approach Hero.tsx uses for its own staggered entrance.
// evaluateBudget.ts caps scenarios at 3 (MAX_SCENARIOS), so three entries
// covers every real case; a 4th scenario would just reuse no delay.
const ENTRANCE_DELAY = ["", "[animation-delay:90ms]", "[animation-delay:180ms]"];

// A colored left edge gives an at-a-glance signal when scanning several
// cards side by side, on top of (never instead of) the text+icon badge --
// color alone is never the only way the under/over-budget state is
// conveyed, so it still reads fine for colorblind users or in a screen
// reader (the badge text says "under"/"over" explicitly).
function scenarioAccentClass(scenario: EvaluateBudgetScenario, hasBudget: boolean): string {
  if (!scenario.valid || !hasBudget) return "";
  const underBudget = scenario.underBudgetNet ?? scenario.underBudgetGross;
  return underBudget ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-destructive";
}

// Renders one scenario card. Split out from ChatBudgetComparison purely for
// readability -- it's not meant to be imported anywhere else.
function ScenarioCard({
  scenario,
  targetBudget,
  delayClass,
  onApplyScenario,
}: {
  scenario: EvaluateBudgetScenario;
  targetBudget: number | null;
  delayClass: string;
  onApplyScenario: (changes: AiSelectionsPatch) => void;
}) {
  // Reuses the same patch-to-chip formatting ChatConfirmationChips relies on
  // for a *real* setSelections confirmation -- here it answers "what's
  // actually different about this scenario" so the student doesn't have to
  // reverse-engineer it from the label alone. Deliberately styled as neutral
  // muted chips, not the emerald "confirmed" chips from that component --
  // this is still a hypothetical, nothing has been applied.
  const changeChips = describeSelectionsPatch(scenario.changes);
  const showBudgetBadge = scenario.valid && targetBudget !== null;
  const underBudget = scenario.underBudgetNet ?? scenario.underBudgetGross;
  // netTotal is always populated alongside total for a valid scenario (it's
  // computed unconditionally in evaluateBudget.ts) and equals total when
  // aid is 0 -- so it's always the right "final" figure to headline and to
  // check against the budget, whether or not aid is involved.
  const finalTotal = scenario.netTotal ?? scenario.total ?? 0;
  const budgetDiff = targetBudget !== null ? Math.abs(targetBudget - finalTotal) : null;

  return (
    <Card
      size="sm"
      className={`animate-fade-in-up bg-card/95 ${delayClass} ${scenarioAccentClass(scenario, targetBudget !== null)}`}
    >
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">{scenario.label}</span>
            <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
              {scenario.semester === "fall" ? "Fall" : "Spring"}
            </span>
          </div>
          {/* The dollar gap itself, not just the word "under"/"over" -- a
              plain colored line of text doesn't tell you HOW close a
              scenario is to the line, which is usually the actual question
              behind "can I afford this." */}
          {showBudgetBadge && budgetDiff !== null && (
            <span
              className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                underBudget
                  ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/30"
                  : "bg-destructive/10 text-destructive ring-destructive/20"
              }`}
            >
              {underBudget ? <CheckCircle2Icon className="size-3.5" /> : <XCircleIcon className="size-3.5" />}
              {formatCurrency(budgetDiff)} {underBudget ? "under" : "over"}
            </span>
          )}
        </div>

        {!scenario.valid ? (
          // Reuses the exact amber "heads up" treatment DashboardShell uses
          // for its locked-scenario banner -- an invalid scenario here isn't
          // a tool failure, it's "this plan needs one more answer," so it
          // gets the same non-alarming warning color as the rest of the app
          // uses for "you need to do something," not the destructive red
          // reserved for the over-budget badge above.
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Needs a bit more info</p>
              <ul className="flex flex-col gap-0.5">
                {scenario.validationErrors.map((error) => (
                  <li key={error} className="text-xs text-amber-800/90 dark:text-amber-300/90">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            {scenario.aid > 0 ? (
              // Clear before/after hierarchy: the pre-aid figure is small,
              // muted, and struck through (the familiar "was $X" pattern),
              // so the eye lands on the bold post-aid number below it --
              // not two visually equal rows where the student has to read
              // the labels to know which one actually matters.
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>Before aid</span>
                  <span className="line-through decoration-muted-foreground/60">
                    {formatCurrency(scenario.total ?? 0)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">After aid</span>
                  <span className="font-heading text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
                <span className="self-end rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.7rem] font-medium text-emerald-700 dark:text-emerald-300">
                  -{formatCurrency(scenario.aid)} aid applied
                </span>
              </div>
            ) : (
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-heading text-2xl font-bold text-foreground">{formatCurrency(finalTotal)}</span>
              </div>
            )}

            {changeChips.length > 0 && (
              <ul className="flex flex-wrap gap-1">
                {changeChips.map((entry) => (
                  <li key={entry.field} className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] text-muted-foreground">
                    {entry.field}: <span className="font-medium text-foreground">{entry.value}</span>
                  </li>
                ))}
              </ul>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 w-fit rounded-full"
              onClick={() => onApplyScenario(scenario.changes)}
            >
              Apply this scenario
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Styled distinctly from ChatConfirmationChips on purpose: this is a
// HYPOTHETICAL, not a "your plan changed" confirmation -- clicking "Apply"
// on a card below is the only thing that actually calls onSelectionsChange,
// same as setSelections always has; evaluateBudget itself never mutates
// real state.
//
// Cards sit in a @container grid rather than a viewport-breakpoint one --
// this renders inside either a fixed ~26rem desktop side panel (ChatPanel)
// or a mobile bottom sheet (ChatOverlay), neither of which tracks the
// viewport width, so a `sm:` breakpoint would never fire in the panel case.
// A container query responds to the space this component actually has.
export function ChatBudgetComparison({
  result,
  onApplyScenario,
}: {
  result: EvaluateBudgetResult;
  onApplyScenario: (changes: AiSelectionsPatch) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      {result.targetBudget !== null && (
        <p className="text-xs font-medium text-muted-foreground">
          Compared against a {formatCurrency(result.targetBudget)} budget
        </p>
      )}

      <div className="@container w-full">
        {/* @xl (not @sm) on purpose -- these cards carry a long label, a
            budget badge, a price, and change chips, so anything narrower
            than ~36rem per pair squeezes two columns down to the point
            where labels like "Traditional Without AC (Double Bunked)" wrap
            across four or five lines. @sm (24rem) used to fire inside both
            the ~26rem desktop side panel and the mobile bottom sheet, which
            are exactly the two containers this component ever renders in --
            so two columns effectively never had enough room to look right. */}
        <div className="grid grid-cols-1 gap-2 @xl:grid-cols-2">
          {result.scenarios.map((scenario, index) => (
            <ScenarioCard
              key={scenario.label}
              scenario={scenario}
              targetBudget={result.targetBudget}
              delayClass={ENTRANCE_DELAY[index] ?? ""}
              onApplyScenario={onApplyScenario}
            />
          ))}
        </div>
      </div>

      {/* Non-fatal notes (e.g. a scenario that got skipped for being
          malformed) -- previously collected by evaluateBudget.ts but never
          actually surfaced anywhere. Kept quiet/muted since these are
          secondary to the scenarios themselves. */}
      {result.notes.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {result.notes.map((note) => (
            <li key={note} className="text-xs text-muted-foreground">
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
