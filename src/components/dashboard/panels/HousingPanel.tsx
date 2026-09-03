"use client";

import { OptionGroup } from "@/components/dashboard/OptionGroup";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { panelTextSizes } from "@/components/dashboard/typography";
import type { LivingSituation } from "@/lib/calculator/types";
import type { PanelProps } from "@/components/dashboard/selections";

// Falls back to when there's no prior on-campus choice yet (housing is null
// while commuter is selected, or on first load).
const DEFAULT_HOUSING = { roomType: "double", buildingCategory: "traditional" };

export function HousingPanel({ selections, onChange, spacious }: PanelProps) {
  const { livingSituation, housing } = selections;
  const roomType = housing?.roomType ?? DEFAULT_HOUSING.roomType;
  const buildingCategory = housing?.buildingCategory ?? DEFAULT_HOUSING.buildingCategory;
  const t = panelTextSizes(spacious);

  // Commuters don't have housing at all -- matches how the real Selections
  // type models it (null, not just hidden fields with stale values sitting
  // underneath). Switching back to on-campus starts over at the default
  // rather than remembering a prior choice, which is fine for now -- if
  // that turns out to matter, it's a small addition, not a redesign.
  function handleLivingSituationChange(value: LivingSituation) {
    onChange({
      livingSituation: value,
      housing: value === "commuter" ? null : DEFAULT_HOUSING,
    });
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h2 className={`font-heading font-semibold text-foreground ${t.heading}`}>Housing</h2>
        <p className={`text-muted-foreground ${t.body}`}>Commuters skip room/building selection entirely.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className={`font-medium text-foreground ${t.label}`}>Living situation</span>
        <OptionGroup
          label="Living situation"
          value={livingSituation}
          onChange={handleLivingSituationChange}
          spacious={spacious}
          options={[
            { value: "on_campus", label: "On-campus" },
            { value: "commuter", label: "Commuter" },
          ]}
        />
      </div>

      {livingSituation === "on_campus" && (
        <>
          <div className="flex flex-col gap-2">
            <span className={`font-medium text-foreground ${t.label}`}>Room type</span>
            <OptionGroup
              label="Room type"
              value={roomType}
              onChange={(value) => onChange({ housing: { roomType: value, buildingCategory } })}
              spacious={spacious}
              options={[
                { value: "single", label: "Single" },
                { value: "double", label: "Double" },
                { value: "triple_quad", label: "Triple/Quad" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className={`font-medium text-foreground ${t.label}`}>Building category</span>
            <OptionGroup
              label="Building category"
              value={buildingCategory}
              onChange={(value) => onChange({ housing: { roomType, buildingCategory: value } })}
              spacious={spacious}
              options={[
                { value: "traditional", label: "Traditional" },
                { value: "semi_suite", label: "Semi-Suite" },
                { value: "suite", label: "Suite" },
                { value: "apartment", label: "Apartment" },
              ]}
            />
            {/* Only Apartment has a kitchen -- the Meals tab's dining-plan
                requirement is exempt for this category. Not enforced here. */}
            {buildingCategory === "apartment" && (
              <p className={`text-muted-foreground ${t.hint}`}>
                Apartments have a kitchen -- a dining plan won&apos;t be required on the Meals tab.
              </p>
            )}
          </div>
        </>
      )}

      <PanelTip spacious={spacious}>
        A dining plan is required for on-campus housing unless your building is in the Apartment category (the only
        one with a kitchen) -- worth picking Housing before Meals if you&apos;re not sure yet.
      </PanelTip>
    </div>
  );
}
