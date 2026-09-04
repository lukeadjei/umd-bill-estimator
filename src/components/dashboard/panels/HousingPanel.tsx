"use client";

import { OptionGroup } from "@/components/dashboard/OptionGroup";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { panelTextSizes } from "@/components/dashboard/typography";
import type { HousingRateRow, LivingSituation } from "@/lib/calculator/types";
import type { PanelProps } from "@/components/dashboard/selections";

// Falls back to when there's no prior on-campus choice yet (housing is null
// while commuter is selected, or on first load). Must be a combination that
// genuinely exists in housing_rates -- calculateHousing throws if it can't
// find a matching row, so this can't be a guessed placeholder.
const DEFAULT_HOUSING = { roomType: "Double", buildingCategory: "Traditional With AC" };

// Not every room_type x building_category pair has a row (e.g. "Converted
// Single" only exists under "Traditional Without AC") -- these read the
// real set out of the fetched rates instead of a hardcoded guess, so the UI
// can never offer a combination calculateHousing won't find.
function uniqueRoomTypes(housingRates: HousingRateRow[]): string[] {
  return Array.from(new Set(housingRates.map((r) => r.room_type)));
}

function buildingCategoriesForRoomType(housingRates: HousingRateRow[], roomType: string): string[] {
  return Array.from(
    new Set(housingRates.filter((r) => r.room_type === roomType).map((r) => r.building_category))
  );
}

export function HousingPanel({ selections, onChange, spacious, rates }: PanelProps) {
  const { livingSituation, housing } = selections;
  const roomType = housing?.roomType ?? DEFAULT_HOUSING.roomType;
  const buildingCategory = housing?.buildingCategory ?? DEFAULT_HOUSING.buildingCategory;
  const t = panelTextSizes(spacious);

  const roomTypeOptions = uniqueRoomTypes(rates.housingRates).map((value) => ({ value, label: value }));
  const buildingCategoryOptions = buildingCategoriesForRoomType(rates.housingRates, roomType).map((value) => ({
    value,
    label: value,
  }));

  // Switching room type can invalidate the current building category (not
  // every pair exists) -- auto-correct to the first valid category for the
  // new room type so the app can never land on a combination with no
  // matching housing_rates row.
  function handleRoomTypeChange(newRoomType: string) {
    const validCategories = buildingCategoriesForRoomType(rates.housingRates, newRoomType);
    const nextBuildingCategory = validCategories.includes(buildingCategory)
      ? buildingCategory
      : (validCategories[0] ?? buildingCategory);
    onChange({ housing: { roomType: newRoomType, buildingCategory: nextBuildingCategory } });
  }

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
              onChange={handleRoomTypeChange}
              spacious={spacious}
              options={roomTypeOptions}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className={`font-medium text-foreground ${t.label}`}>Building category</span>
            <OptionGroup
              label="Building category"
              value={buildingCategory}
              onChange={(value) => onChange({ housing: { roomType, buildingCategory: value } })}
              spacious={spacious}
              options={buildingCategoryOptions}
            />
            {/* Only Apartment has a kitchen -- the Meals tab's dining-plan
                requirement is exempt for this category. Not enforced here. */}
            {buildingCategory === "Apartment" && (
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
