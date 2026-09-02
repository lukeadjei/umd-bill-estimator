"use client";

import { useState } from "react";
import { OptionGroup } from "@/components/dashboard/OptionGroup";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { panelTextSizes } from "@/components/dashboard/typography";

export function HousingPanel({ spacious }: { spacious: boolean }) {
  const [livingSituation, setLivingSituation] = useState<"on_campus" | "commuter">("on_campus");
  const [roomType, setRoomType] = useState<"single" | "double" | "triple_quad">("double");
  const [buildingCategory, setBuildingCategory] = useState<
    "traditional" | "semi_suite" | "suite" | "apartment"
  >("traditional");
  const t = panelTextSizes(spacious);

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
          onChange={setLivingSituation}
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
              onChange={setRoomType}
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
              onChange={setBuildingCategory}
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
