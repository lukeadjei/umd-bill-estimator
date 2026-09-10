"use client";

import { OptionGroup } from "@/components/dashboard/OptionGroup";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { SelectionDetail } from "@/components/dashboard/SelectionDetail";
import { panelTextSizes } from "@/components/dashboard/typography";
import { PERMIT_TYPE_DESCRIPTIONS } from "@/lib/content/parkingDescriptions";
import type { PanelProps } from "@/components/dashboard/selections";

// permit_type is a plain `string` column (see ParkingPermitRow / RatesBundle
// in src/lib/calculator/types.ts) -- real values are Title Case, e.g.
// "Commuter", "Resident", "Overnight Storage". "none" is not a real
// permit_type value; it's this panel's own sentinel for "haven't picked a
// permit," layered on top of the real values pulled from rates.parkingPermits.
type PermitTypeOption = string | "none";
type TermOption = "annual" | "fall" | "spring" | "summer";

// Real permit-type options are filtered by living situation (residents vs.
// commuters get different eligible types) -- not enforced here, all three
// are shown regardless of what's picked on the Housing tab.
//
// selections.parking is null | { permitType, term } -- "none" isn't a real
// value in that type, it's this panel's own way of representing "haven't
// picked a permit," derived from parking being null.
export function ParkingPanel({ selections, onChange, spacious, rates }: PanelProps) {
  const permitType: PermitTypeOption = selections.parking?.permitType ?? "none";
  const term: TermOption = (selections.parking?.term as TermOption) ?? "annual";
  const t = panelTextSizes(spacious);

  const permitTypeOptions = Array.from(new Set(rates.parkingPermits.map((row) => row.permit_type))).sort();

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
            ...permitTypeOptions.map((value) => ({ value, label: value })),
          ]}
        />
        {permitType !== "none" && PERMIT_TYPE_DESCRIPTIONS[permitType] && (
          <SelectionDetail spacious={spacious}>{PERMIT_TYPE_DESCRIPTIONS[permitType]}</SelectionDetail>
        )}
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
