"use client";

import { OptionGroup } from "@/components/dashboard/OptionGroup";
import { Button } from "@/components/ui/button";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { panelTextSizes } from "@/components/dashboard/typography";
import type { EducationLevel, Residency } from "@/lib/calculator/types";
import type { PanelProps } from "@/components/dashboard/selections";

// A few labeled marks along the 1-20 range rather than all twenty (which
// would be unreadably cramped) -- positioned by percentage so they line up
// with the native range input's own thumb positions regardless of width.
const CREDIT_MARKS = [1, 6, 12, 18, 20];
function markPosition(value: number) {
  return ((value - 1) / (20 - 1)) * 100;
}

export function TuitionPanel({ selections, onChange, spacious }: PanelProps) {
  const { educationLevel, residency, creditHours, appliesDifferentialTuition, insurance } = selections;
  const t = panelTextSizes(spacious);

  function updateCreditHours(next: number) {
    if (!Number.isNaN(next)) onChange({ creditHours: Math.min(20, Math.max(1, next)) });
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h2 className={`font-heading font-semibold text-foreground ${t.heading}`}>Tuition</h2>
        <p className={`text-muted-foreground ${t.body}`}>
          Education level, residency, and credit hours drive the base tuition rate.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className={`font-medium text-foreground ${t.label}`}>Education level</span>
        <OptionGroup
          label="Education level"
          value={educationLevel}
          onChange={(value: EducationLevel) => onChange({ educationLevel: value })}
          spacious={spacious}
          options={[
            { value: "undergraduate", label: "Undergraduate" },
            { value: "graduate", label: "Graduate" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={`font-medium text-foreground ${t.label}`}>Residency</span>
        <OptionGroup
          label="Residency"
          value={residency}
          onChange={(value: Residency) => onChange({ residency: value })}
          spacious={spacious}
          options={[
            { value: "resident", label: "Maryland resident" },
            { value: "non_resident", label: "Non-resident" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={`font-medium text-foreground ${t.label}`}>Credit hours</span>

        {/* Number input sits right next to the slider (not off in its own
            row) so the two clearly read as one control, not two separate
            fields that happen to agree. */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              list="credit-hour-marks"
              value={creditHours}
              onChange={(event) => onChange({ creditHours: Number(event.target.value) })}
              className="h-2 w-full accent-primary"
              aria-label="Credit hours"
            />
            {/* datalist + list= gives the native range input real tick
                marks at every whole number (Chromium renders these on the
                track itself) -- step=1 already makes it snap there, this
                just makes the snap points visible. */}
            <datalist id="credit-hour-marks">
              {Array.from({ length: 20 }, (_, i) => (
                <option key={i} value={i + 1} />
              ))}
            </datalist>

            <div className="relative mt-1 h-4">
              {CREDIT_MARKS.map((mark) => (
                <span
                  key={mark}
                  className="absolute -translate-x-1/2 text-xs text-muted-foreground"
                  style={{ left: `${markPosition(mark)}%` }}
                >
                  {mark}
                </span>
              ))}
            </div>
          </div>

          <input
            type="number"
            min={1}
            max={20}
            value={creditHours}
            onChange={(event) => updateCreditHours(Number(event.target.value))}
            className={`w-16 shrink-0 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${t.body}`}
          />
        </div>

        <p className={`text-muted-foreground ${t.hint}`}>
          {educationLevel === "undergraduate"
            ? "Undergrad: full-time tuition starts at 12 credits; fees go full-time at 9."
            : "Grad full-time status is based on units/semester (48+), not credit hours -- shown here for consistency with undergrad."}
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className={`font-medium text-foreground ${t.label}`}>Applies differential tuition</span>
            <p className={`text-muted-foreground ${t.hint}`}>
              Auto-detected from major once that&apos;s wired up -- manual for now.
            </p>
          </div>
          <Button
            type="button"
            variant={appliesDifferentialTuition ? "default" : "outline"}
            className={spacious ? "rounded-full text-lg" : "rounded-full text-base"}
            aria-pressed={appliesDifferentialTuition}
            onClick={() => onChange({ appliesDifferentialTuition: !appliesDifferentialTuition })}
          >
            {appliesDifferentialTuition ? "Yes" : "No"}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <span className={`font-medium text-foreground ${t.label}`}>Student health insurance</span>
            <p className={`text-muted-foreground ${t.hint}`}>Opt in if you don&apos;t have a waiver on file.</p>
          </div>
          <Button
            type="button"
            variant={insurance ? "default" : "outline"}
            className={spacious ? "rounded-full text-lg" : "rounded-full text-base"}
            aria-pressed={insurance}
            onClick={() => onChange({ insurance: !insurance })}
          >
            {insurance ? "Yes" : "No"}
          </Button>
        </div>
      </div>

      <PanelTip spacious={spacious}>
        Differential tuition applies to Business, Engineering, and Computer Science juniors &amp; seniors on top of
        the standard rate -- check the Major tab if you&apos;re not sure it applies to you.
      </PanelTip>
    </div>
  );
}
