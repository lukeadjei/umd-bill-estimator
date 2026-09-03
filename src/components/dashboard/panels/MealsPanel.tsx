"use client";

import { OptionGroup } from "@/components/dashboard/OptionGroup";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { panelTextSizes } from "@/components/dashboard/typography";
import type { PanelProps } from "@/components/dashboard/selections";

type PlanMode = "resident" | "block" | "none";
type ResidentTier = "base" | "base_plus" | "preferred" | "premium";
type BlockTier = "small" | "medium" | "large";

// residentDiningPlan and blockDiningPlan are mutually exclusive in the real
// Selections type (enforced in validateSelections, not here) -- modeled as
// one derived `plan` choice with a "none" option rather than two independent
// toggles, so the UI can't represent the invalid "both set" state in the
// first place. `plan` itself isn't stored -- it's derived from which of the
// two fields is non-null.
export function MealsPanel({ selections, onChange, spacious }: PanelProps) {
  const plan: PlanMode = selections.residentDiningPlan ? "resident" : selections.blockDiningPlan ? "block" : "none";
  // Resident plan tiers are real (dining.umd.edu/students/resident-plans, per
  // docs/umd-bill-estimator-getting-started-checklist.md). Block/Connector
  // tier labels below are placeholders -- the real ones live in scraped
  // `block_dining_plans` rows (plan_label, meal_count) once that table is
  // populated; swap these for the real values then.
  const residentTier = (selections.residentDiningPlan?.planName as ResidentTier) ?? "base";
  const blockTier = (selections.blockDiningPlan?.planLabel as BlockTier) ?? "medium";
  const t = panelTextSizes(spacious);

  function handlePlanChange(value: PlanMode) {
    if (value === "resident") onChange({ residentDiningPlan: { planName: residentTier }, blockDiningPlan: null });
    else if (value === "block") onChange({ blockDiningPlan: { planLabel: blockTier }, residentDiningPlan: null });
    else onChange({ residentDiningPlan: null, blockDiningPlan: null });
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h2 className={`font-heading font-semibold text-foreground ${t.heading}`}>Meals</h2>
        <p className={`text-muted-foreground ${t.body}`}>
          Required for on-campus housing unless your building has a kitchen (Apartment category).
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className={`font-medium text-foreground ${t.label}`}>Dining plan</span>
        <OptionGroup
          label="Dining plan"
          value={plan}
          onChange={handlePlanChange}
          spacious={spacious}
          options={[
            { value: "resident", label: "Resident plan" },
            { value: "block", label: "Block (Connector) plan" },
            { value: "none", label: "None" },
          ]}
        />
      </div>

      {plan === "resident" && (
        <div className="flex flex-col gap-2">
          <span className={`font-medium text-foreground ${t.label}`}>Resident plan tier</span>
          <OptionGroup
            label="Resident plan tier"
            value={residentTier}
            onChange={(value: ResidentTier) => onChange({ residentDiningPlan: { planName: value } })}
            spacious={spacious}
            options={[
              { value: "base", label: "Base" },
              { value: "base_plus", label: "Base Plus" },
              { value: "preferred", label: "Preferred" },
              { value: "premium", label: "Premium" },
            ]}
          />
        </div>
      )}

      {plan === "block" && (
        <div className="flex flex-col gap-2">
          <span className={`font-medium text-foreground ${t.label}`}>Block plan size</span>
          <OptionGroup
            label="Block plan size"
            value={blockTier}
            onChange={(value: BlockTier) => onChange({ blockDiningPlan: { planLabel: value } })}
            spacious={spacious}
            options={[
              { value: "small", label: "Small block" },
              { value: "medium", label: "Medium block" },
              { value: "large", label: "Large block" },
            ]}
          />
          <span className={`text-muted-foreground ${t.hint}`}>
            Placeholder tiers -- real block plan names/meal counts come from the scraper.
          </span>
        </div>
      )}

      <PanelTip spacious={spacious}>
        A block (Connector) plan doesn&apos;t satisfy the resident dining requirement -- if your housing requires a
        plan, it has to be a resident plan, not block.
      </PanelTip>
    </div>
  );
}
