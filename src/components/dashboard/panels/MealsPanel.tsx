"use client";

import { useState } from "react";
import { OptionGroup } from "@/components/dashboard/OptionGroup";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { panelTextSizes } from "@/components/dashboard/typography";

// residentDiningPlan and blockDiningPlan are mutually exclusive in
// Selections (enforced in validateSelections, not here) -- modeled as one
// choice with a "none" option rather than two independent toggles, so the
// UI can't represent the invalid "both set" state in the first place.
export function MealsPanel({ spacious }: { spacious: boolean }) {
  const [plan, setPlan] = useState<"resident" | "block" | "none">("resident");
  // Resident plan tiers are real (dining.umd.edu/students/resident-plans, per
  // docs/umd-bill-estimator-getting-started-checklist.md). Block/Connector
  // tier labels below are placeholders -- the real ones live in scraped
  // `block_dining_plans` rows (plan_label, meal_count) once that table is
  // populated; swap these for the real values then.
  const [residentTier, setResidentTier] = useState<"base" | "base_plus" | "preferred" | "premium">("base");
  const [blockTier, setBlockTier] = useState<"small" | "medium" | "large">("medium");
  const t = panelTextSizes(spacious);

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
          onChange={setPlan}
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
            onChange={setResidentTier}
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
            onChange={setBlockTier}
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
