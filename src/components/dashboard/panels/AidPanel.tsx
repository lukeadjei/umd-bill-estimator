"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelTip } from "@/components/dashboard/PanelTip";
import { panelTextSizes } from "@/components/dashboard/typography";
import {
  MAX_MISC_GRANTS,
  MISC_GRANT_MAX_AMOUNT,
  MISC_GRANT_MIN_AMOUNT,
  MISC_GRANT_NOTE_MAX_LENGTH,
  NAMED_GRANT_MAX_AMOUNT,
  NAMED_GRANT_MIN_AMOUNT,
} from "@/lib/calculator/constants";
import type { Grants, MiscGrant } from "@/lib/calculator/types";
import type { PanelProps } from "@/components/dashboard/selections";

// 0 always means "not entered" -- only a nonzero amount gets clamped into the
// real [min, max] business range. Mirrors TuitionPanel's own clamp-on-change
// pattern for credit hours.
function clampAmount(raw: number, min: number, max: number): number {
  if (Number.isNaN(raw) || raw <= 0) return 0;
  return Math.min(max, Math.max(min, raw));
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

type NamedGrantField = "pell" | "terrapinCommitment" | "rawlingsEA";

const NAMED_GRANTS: { field: NamedGrantField; label: string; hint: string }[] = [
  { field: "pell", label: "Pell Grant", hint: "Federal need-based grant, doesn't need to be repaid." },
  {
    field: "terrapinCommitment",
    label: "Terrapin Commitment Grant",
    hint: "UMD's own need-based grant for Maryland residents.",
  },
  { field: "rawlingsEA", label: "Rawlings EA Grant", hint: "Need-based grant tied to the Rawlings Scholarship program." },
];

export function AidPanel({ selections, onChange, spacious }: PanelProps) {
  const { grants } = selections;
  const t = panelTextSizes(spacious);

  function updateGrants(patch: Partial<Grants>) {
    onChange({ grants: { ...grants, ...patch } });
  }

  function updateNamedAmount(field: NamedGrantField, raw: number) {
    updateGrants({ [field]: clampAmount(raw, NAMED_GRANT_MIN_AMOUNT, NAMED_GRANT_MAX_AMOUNT) });
  }

  function addMiscGrant() {
    if (grants.misc.length >= MAX_MISC_GRANTS) return;
    const next: MiscGrant = { id: crypto.randomUUID(), note: "", amount: 0 };
    updateGrants({ misc: [...grants.misc, next] });
  }

  function updateMiscGrant(id: string, patch: Partial<MiscGrant>) {
    updateGrants({ misc: grants.misc.map((grant) => (grant.id === id ? { ...grant, ...patch } : grant)) });
  }

  function removeMiscGrant(id: string) {
    updateGrants({ misc: grants.misc.filter((grant) => grant.id !== id) });
  }

  const totalAid =
    grants.pell + grants.terrapinCommitment + grants.rawlingsEA + grants.misc.reduce((sum, g) => sum + g.amount, 0);

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h2 className={`font-heading font-semibold text-foreground ${t.heading}`}>Aid &amp; Grants</h2>
        <p className={`text-muted-foreground ${t.body}`}>
          Enter any grants or aid you&apos;re applying this semester -- these subtract from your total. Leave a field
          at $0 if it doesn&apos;t apply to you.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {NAMED_GRANTS.map(({ field, label, hint }) => (
          <div key={field} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className={`font-medium text-foreground ${t.label}`}>{label}</span>
                <p className={`text-muted-foreground ${t.hint}`}>{hint}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-muted-foreground">$</span>
                <input
                  type="number"
                  min={0}
                  max={NAMED_GRANT_MAX_AMOUNT}
                  value={grants[field] || ""}
                  placeholder="0"
                  onChange={(event) => updateNamedAmount(field, Number(event.target.value))}
                  className={`w-28 rounded-lg border border-input bg-background px-2 py-1.5 text-right focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${t.body}`}
                  aria-label={label}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className={`font-medium text-foreground ${t.label}`}>Other grants or scholarships</span>
            <p className={`text-muted-foreground ${t.hint}`}>
              Up to {MAX_MISC_GRANTS}, each with a short note and an amount.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full"
            disabled={grants.misc.length >= MAX_MISC_GRANTS}
            onClick={addMiscGrant}
          >
            <PlusIcon className="size-4" />
            Add
          </Button>
        </div>

        {grants.misc.length > 0 && (
          <div className="flex flex-col gap-2">
            {grants.misc.map((grant, index) => (
              <div key={grant.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={grant.note}
                  maxLength={MISC_GRANT_NOTE_MAX_LENGTH}
                  placeholder={`Note (e.g. "Outside scholarship #${index + 1}")`}
                  onChange={(event) => updateMiscGrant(grant.id, { note: event.target.value.slice(0, MISC_GRANT_NOTE_MAX_LENGTH) })}
                  className={`min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${t.body}`}
                  aria-label={`Miscellaneous grant ${index + 1} note`}
                />
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-muted-foreground">$</span>
                  <input
                    type="number"
                    min={0}
                    max={MISC_GRANT_MAX_AMOUNT}
                    value={grant.amount || ""}
                    placeholder="0"
                    onChange={(event) =>
                      updateMiscGrant(grant.id, {
                        amount: clampAmount(Number(event.target.value), MISC_GRANT_MIN_AMOUNT, MISC_GRANT_MAX_AMOUNT),
                      })
                    }
                    className={`w-24 rounded-lg border border-input bg-background px-2 py-1.5 text-right focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${t.body}`}
                    aria-label={`Miscellaneous grant ${index + 1} amount`}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full"
                  onClick={() => removeMiscGrant(grant.id)}
                  aria-label={`Remove miscellaneous grant ${index + 1}`}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalAid > 0 && (
        <p className={`text-muted-foreground ${t.hint}`}>
          Total aid applied: <span className="font-medium text-foreground">{formatCurrency(totalAid)}</span>
        </p>
      )}

      <PanelTip spacious={spacious}>
        Grants only reduce your total -- if your aid ends up covering more than the bill itself, we&apos;ll show it
        as an estimated refund rather than a negative number.
      </PanelTip>
    </div>
  );
}
