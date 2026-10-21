"use client";

import { InfoIcon, SparklesIcon } from "lucide-react";
import { OptionGroup } from "@/components/dashboard/OptionGroup";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { panelTextSizes } from "@/components/dashboard/typography";
import type { EducationLevel, Residency, WinterClassFormat } from "@/lib/calculator/types";
import type { PanelProps } from "@/components/dashboard/selections";

function formatDollars(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// The Winter Session's one input panel. Winter is a much simpler bill than a semester --
// tuition (a published price per credit count, 1 up to the cap) plus ONE flat fee -- so it
// gets its own panel instead of branching inside TuitionPanel. The credit range comes from
// the database (academic_years.winter_max_credit_hours), never a hardcoded 4, and the fee
// amounts in the explanation are the real rates.
export function WinterTuitionPanel({ selections, onChange, spacious, rates, onOpenChat }: PanelProps) {
  const { educationLevel, residency, creditHours, winterClassFormat } = selections;
  const t = panelTextSizes(spacious);
  const winter = rates.winter;
  const maxCredits = rates.academicYear.winter_max_credit_hours ?? 0;
  const creditOptions = Array.from({ length: maxCredits }, (_, i) => String(i + 1));

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h2 className={`font-heading font-semibold text-foreground ${t.heading}`}>Winter Session tuition</h2>
        <p className={`text-muted-foreground ${t.body}`}>
          Winter is a short term: you pay tuition for your credits plus one flat fee. Housing, dining, parking and
          health insurance don&apos;t apply.
        </p>
        {onOpenChat && (
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline md:hidden"
            onClick={onOpenChat}
          >
            <SparklesIcon className="size-4" />
            Not sure what to pick? Ask the assistant
          </button>
        )}
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

      <div className="flex flex-col gap-2">
        <span className={`font-medium text-foreground ${t.label}`}>Credit hours</span>
        <OptionGroup
          label="Credit hours"
          value={creditHours === null ? null : String(creditHours)}
          onChange={(value: string) => onChange({ creditHours: Number(value) })}
          spacious={spacious}
          options={creditOptions.map((credit) => ({ value: credit, label: credit }))}
        />
        <p className={`text-muted-foreground ${t.hint}`}>
          Winter Session allows up to {maxCredits} credit{maxCredits === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className={`font-medium text-foreground ${t.label}`}>Where will your classes meet?</span>
        <OptionGroup
          label="Where your classes meet"
          value={winterClassFormat}
          onChange={(value: WinterClassFormat) => onChange({ winterClassFormat: value })}
          spacious={spacious}
          options={[
            { value: "in_person", label: "At least one class is in person" },
            { value: "online_only", label: "All of my classes are online" },
          ]}
        />

        {/* The "big reminder": the fee is the one place winter needs the student's own
            knowledge -- the app can't tell which sections are in person -- so the rule is
            spelled out right under the choice, with the real amounts. */}
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <InfoIcon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className={`flex flex-col gap-1 font-medium text-amber-800 dark:text-amber-300 ${t.label}`}>
            <p>You&apos;re charged one flat fee, never both. Choose based on your actual classes:</p>
            <ul className="list-disc pl-5">
              <li>
                <strong>Any class in person</strong> (even if the rest are online):{" "}
                {winter ? formatDollars(winter.fees.campus_services_rate) : "the"} Winter Campus Services Fee.
              </li>
              <li>
                <strong>Every class online or off-site:</strong>{" "}
                {winter ? formatDollars(winter.fees.distance_learning_rate) : "the"} Winter Distance Learning Fee.
              </li>
            </ul>
            <p>We can&apos;t tell which of your classes are in person, so this choice is yours.</p>
          </div>
        </div>
      </div>

      <PanelTip spacious={spacious}>
        Winter tuition is UMD&apos;s published price for each credit count, so your estimate below updates as soon as
        you pick your credits.
      </PanelTip>
    </div>
  );
}
