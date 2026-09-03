"use client";

import { OptionGroup } from "@/components/dashboard/OptionGroup";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { panelTextSizes } from "@/components/dashboard/typography";
import type { PanelProps } from "@/components/dashboard/selections";

type PermitTypeOption = "commuter" | "resident" | "overnight_storage" | "none";
type TermOption = "annual" | "fall" | "spring" | "summer";

// Real permit-type options are filtered by living situation (residents vs.
// commuters get different eligible types) -- not enforced here, all three
// are shown regardless of what's picked on the Housing tab.
//
// selections.parking is null | { permitType, term } -- "none" isn't a real
// value in that type, it's this panel's own way of representing "haven't
// picked a permit," derived from parking being null.
export function ParkingPanel({ selections, onChange, spacious }: PanelProps) {
  const permitType: PermitTypeOption = (selections.parking?.permitType as PermitTypeOption) ?? "none";
  const term: TermOption = (selections.parking?.term as TermOption) ?? "annual";
  const t = panelTextSizes(spacious);

  function handlePermitTypeChange(value: PermitTypeOption) {
    onChange({ parking: value === "none" ? null : { permitType: value, term } });
  }

  function handleTermChange(value: TermOption) {
    if (permitType !== "none") onChange({ parking: { permitType, term: value } });
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h2 className={`font-heading font-semibold text-foreground ${t.heading}`}>Parking</h2>
        <p className={`text-muted-foreground ${t.body}`}>Buying Fall + Spring separately costs more than an Annual permit.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className={`font-medium text-foreground ${t.label}`}>Permit type</span>
        <OptionGroup
          label="Permit type"
          value={permitType}
          onChange={handlePermitTypeChange}
          spacious={spacious}
          options={[
            { value: "none", label: "None" },
            { value: "commuter", label: "Commuter" },
            { value: "resident", label: "Resident" },
            { value: "overnight_storage", label: "Overnight Storage" },
          ]}
        />
      </div>

      {permitType !== "none" && (
        <div className="flex flex-col gap-2">
          <span className={`font-medium text-foreground ${t.label}`}>Term</span>
          <OptionGroup
            label="Term"
            value={term}
            onChange={handleTermChange}
            spacious={spacious}
            options={[
              { value: "annual", label: "Annual" },
              { value: "fall", label: "Fall" },
              { value: "spring", label: "Spring" },
              { value: "summer", label: "Summer" },
            ]}
          />
        </div>
      )}

      <PanelTip spacious={spacious}>
        Which permit types you&apos;re eligible for depends on your Housing tab answer -- residents and commuters
        don&apos;t get the same options in the real permit list.
      </PanelTip>
    </div>
  );
}
