"use client";

import { TriangleAlertIcon } from "lucide-react";
import { OptionGroup } from "@/components/dashboard/OptionGroup";
import { Button } from "@/components/ui/button";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { panelTextSizes } from "@/components/dashboard/typography";
import { majorHasDifferentialTuition } from "@/lib/calculator/majors";
import type { EducationLevel, Residency } from "@/lib/calculator/types";
import type { PanelProps } from "@/components/dashboard/selections";

// A few labeled marks along the 1-20 range rather than all twenty (which
// would be unreadably cramped) -- positioned by percentage so they line up
// with the native range input's own thumb positions regardless of width.
const CREDIT_MARKS = [1, 6, 12, 18, 20];
function markPosition(value: number) {
  return ((value - 1) / (20 - 1)) * 100;
}

// A native range/number input can't visually represent "no value" the way
// OptionGroup's pills can (nothing highlighted) -- it always shows some
// thumb position. So creditHours stays null (untouched) until the user
// actually interacts with either control; until then the inputs render at
// this neutral position but visually greyed, and the real value is still
// null underneath (not silently defaulted) -- no separate "touched" state
// needed, `creditHours === null` already answers that directly.
const NEUTRAL_CREDIT_HOURS_DISPLAY = 12;

export function TuitionPanel({ selections, onChange, spacious }: PanelProps) {
  const { major, educationLevel, residency, creditHours, appliesDifferentialTuition, insurance } = selections;
  const t = panelTextSizes(spacious);
  // Only nag when it'd actually change something useful: a major that's
  // known to carry differential tuition, and the toggle isn't already on.
  // Once they've said Yes, or picked a major that doesn't carry it, or
  // haven't picked a major at all, there's nothing to warn about.
  const showDifferentialTuitionWarning = majorHasDifferentialTuition(major) && !appliesDifferentialTuition;
  const creditHoursTouched = creditHours !== null;
  const displayCreditHours = creditHours ?? NEUTRAL_CREDIT_HOURS_DISPLAY;

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

        {!creditHoursTouched && (
          <p className={`text-muted-foreground ${t.hint}`}>Move the slider or type a number to set your credit hours.</p>
        )}

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
              value={displayCreditHours}
              onChange={(event) => onChange({ creditHours: Number(event.target.value) })}
              className={`h-2 w-full accent-primary ${creditHoursTouched ? "" : "opacity-40"}`}
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
            value={displayCreditHours}
            onChange={(event) => updateCreditHours(Number(event.target.value))}
            className={`w-16 shrink-0 rounded-lg border border-input bg-background px-2 py-1.5 text-center focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${t.body} ${creditHoursTouched ? "text-foreground" : "text-muted-foreground"}`}
          />
        </div>

        <p className={`text-muted-foreground ${t.hint}`}>
          {educationLevel === null
            ? "Select undergraduate or graduate above to see the full-time threshold that applies to you."
            : educationLevel === "undergraduate"
              ? "Undergrad: full-time tuition starts at 12 credits; fees go full-time at 9."
              : "Grad full-time status is based on units/semester (48+), not credit hours -- shown here for consistency with undergrad."}
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className={`font-medium text-foreground ${t.body}`}>Applies differential tuition</span>
            <p className={`text-muted-foreground ${t.label}`}>
              An extra per-credit or flat charge on top of standard tuition, billed to juniors and seniors in
              certain majors.
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

        {/* Prominent, not just a hint -- this is a "you're probably about to
            under-estimate your bill" warning, not a neutral tip, so it gets
            its own high-contrast callout instead of PanelTip's muted styling. */}
        {showDifferentialTuitionWarning && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
            <TriangleAlertIcon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className={`font-medium text-amber-800 dark:text-amber-300 ${t.label}`}>
              {major} normally pays differential tuition. We recommend selecting &quot;Yes&quot; above unless you
              know yours is being waived.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div>
            <span className={`font-medium text-foreground ${t.body}`}>Student health insurance</span>
            <p className={`text-muted-foreground ${t.label}`}>Opt in if you don&apos;t have a waiver on file.</p>
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
