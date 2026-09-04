"use client";

import { OptionGroup } from "@/components/dashboard/OptionGroup";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { panelTextSizes } from "@/components/dashboard/typography";
import type { PanelProps } from "@/components/dashboard/selections";

type PlanMode = "resident" | "block" | "none";

// residentDiningPlan and blockDiningPlan are mutually exclusive in the real
// Selections type (enforced in validateSelections, not here) -- modeled as
// one derived `plan` choice with a "none" option rather than two independent
// toggles, so the UI can't represent the invalid "both set" state in the
// first place. `plan` itself isn't stored -- it's derived from which of the
// two fields is non-null.
export function MealsPanel({ selections, onChange, spacious, rates }: PanelProps) {
  const plan: PlanMode = selections.residentDiningPlan ? "resident" : selections.blockDiningPlan ? "block" : "none";

  // Resident plan tiers come straight from `resident_dining_plans.plan_name`
  // (already a human-readable string like "Base Plus"), deduped in case the
  // rates bundle ever carries more than one row per name.
  const residentTierNames = Array.from(new Set(rates.residentDiningPlans.map((r) => r.plan_name)));

  // Block/Connector tiers come from `block_dining_plans.plan_label` (e.g.
  // "1".."4", "Combo"), which isn't descriptive on its own -- pair it with
  // that row's meal_count (and dining dollars, if any) for the option label.
  // The value sent through onChange is still the raw plan_label, since
  // that's what calculateDining matches against.
  const blockTierRows = Array.from(new Map(rates.blockDiningPlans.map((r) => [r.plan_label, r])).values());

  const residentTier = selections.residentDiningPlan?.planName ?? "Base";
  const blockTier = selections.blockDiningPlan?.planLabel ?? "1";
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
            onChange={(value: string) => onChange({ residentDiningPlan: { planName: value } })}
            spacious={spacious}
            options={residentTierNames.map((name) => ({ value: name, label: name }))}
          />
        </div>
      )}

      {plan === "block" && (
        <div className="flex flex-col gap-2">
          <span className={`font-medium text-foreground ${t.label}`}>Block plan size</span>
          <OptionGroup
            label="Block plan size"
            value={blockTier}
            onChange={(value: string) => onChange({ blockDiningPlan: { planLabel: value } })}
            spacious={spacious}
            options={blockTierRows.map((row) => {
              const displayName = /^\d+$/.test(row.plan_label) ? `Plan ${row.plan_label}` : row.plan_label;
              const diningDollars = row.dining_dollars > 0 ? ` + $${row.dining_dollars} dining dollars` : "";
              return { value: row.plan_label, label: `${displayName} -- ${row.meal_count} meals${diningDollars}` };
            })}
          />
        </div>
      )}

      <PanelTip spacious={spacious}>
        A block (Connector) plan doesn&apos;t satisfy the resident dining requirement -- if your housing requires a
        plan, it has to be a resident plan, not block.
      </PanelTip>
    </div>
  );
}
