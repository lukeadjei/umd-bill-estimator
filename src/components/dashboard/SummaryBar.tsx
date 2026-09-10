"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveScenario } from "@/app/dashboard/actions";
import type { DashboardSelections } from "@/components/dashboard/selections";

type Semester = "fall" | "spring";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "success" } | { status: "error"; message: string };

const NOTE_MAX_LENGTH = 100;

type SummaryBarProps = {
  semester: Semester;
  total: number;
  aid: number;
  netTotal: number;
  validation: { valid: boolean; errors: { field: string; message: string }[] };
  isSignedIn: boolean;
  selections: DashboardSelections;
};

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Sticky bottom-0 pins it to the bottom of the content column (desktop) or
// the viewport (mobile, where it's the only column) so it's always visible
// regardless of scroll position or active tab.
//
// When the current selections are invalid, calculateTotal will still happily
// price whatever's selected -- it doesn't know a combination is illegal
// (e.g. a commuter buying a Resident parking permit), so a computed number
// in that state would be misleading. In that case we hide the dollar total,
// disable the CTA, and surface the validation errors instead -- this is the
// only place in the current UI those errors reach the user.
export function SummaryBar({ semester, total, aid, netTotal, validation, isSignedIn, selections }: SummaryBarProps) {
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [note, setNote] = useState("");
  // Only meaningful once aid actually applies -- with no aid entered, before
  // and after are identical, so the toggle itself stays hidden rather than
  // offering a flip that changes nothing. Defaults to the after-aid view,
  // since that's the figure that actually reflects what's owed.
  const [showAfterAid, setShowAfterAid] = useState(true);
  const displayTotal = aid > 0 && showAfterAid ? netTotal : total;
  // Aid exceeding the gross total is a real refund, not an error -- surfaced
  // as a positive figure with a distinct label/color rather than a
  // confusing negative dollar amount (calculateNetTotal deliberately isn't
  // floored at 0, see its own comment).
  const isRefund = aid > 0 && showAfterAid && displayTotal < 0;

  async function handleSave() {
    setSaveState({ status: "saving" });
    setNoteDialogOpen(false);
    const result = await saveScenario(selections, note);
    if (result.success) {
      setSaveState({ status: "success" });
      setNote("");
    } else {
      setSaveState({ status: "error", message: result.error });
    }
  }

  return (
    <div className="sticky bottom-0 z-30 flex items-center justify-between gap-4 rounded-none border-t border-border bg-card/95 px-4 py-4 shadow-[0_-8px_20px_-3px_rgba(0,0,0,0.32)] backdrop-blur md:px-6">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {semester === "fall" ? "Fall" : "Spring"} estimate
            {aid > 0 && (showAfterAid ? " (after aid)" : " (before aid)")}
          </p>
          {aid > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 rounded-full px-2 text-xs text-muted-foreground"
              onClick={() => setShowAfterAid((current) => !current)}
            >
              {showAfterAid ? "Show before aid" : "Show after aid"}
            </Button>
          )}
        </div>
        {validation.valid ? (
          isRefund ? (
            <p className="font-heading text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(Math.abs(displayTotal))}
              <span className="ml-2 text-base font-medium">Estimated refund</span>
            </p>
          ) : (
            <p className="font-heading text-3xl font-bold text-foreground">{formatCurrency(displayTotal)}</p>
          )
        ) : (
          <p className="font-heading text-3xl font-bold text-muted-foreground">Fix errors to see total</p>
        )}
        {validation.errors.length > 0 && (
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {validation.errors.map((error) => (
              <li key={error.field} className="text-xs font-medium text-destructive">
                {error.message}
              </li>
            ))}
          </ul>
        )}
        {isSignedIn && saveState.status === "error" && (
          <p className="mt-1.5 text-xs font-medium text-destructive">{saveState.message}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Generate never touches the database -- it just navigates to a
            page that reads the current selections back out of sessionStorage
            and formats them for printing/PDF -- so unlike Save, it's
            available to guests too. Still gated on validity: there's no
            reason to produce a print-ready estimate for a combination that
            isn't actually legal to purchase. */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-full text-lg"
          disabled={!validation.valid}
          nativeButton={false}
          render={<Link href="/dashboard/results" />}
        >
          Generate
        </Button>

        {/* Guest mode takes priority over everything else this bar could show
            for the Save button -- a guest never sees a working save button,
            whether or not the current plan is valid, because scenarios.user_id
            requires a real signed-in user. */}
        {!isSignedIn ? (
          <Button type="button" size="lg" className="rounded-full text-lg" nativeButton={false} render={<Link href="/sign-in" />}>
            Sign in to save your plan
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="lg"
              className="rounded-full text-lg"
              disabled={!validation.valid || saveState.status === "saving"}
              onClick={() => setNoteDialogOpen(true)}
            >
              {saveState.status === "saving" ? "Saving..." : saveState.status === "success" ? "Saved!" : "Save"}
            </Button>

            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a note? (optional)</DialogTitle>
                  <DialogDescription>
                    A short note helps tell this plan apart from others you save later -- e.g. &quot;with Preferred
                    meal plan&quot;.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-1.5">
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX_LENGTH))}
                    maxLength={NOTE_MAX_LENGTH}
                    rows={3}
                    placeholder="e.g. With Preferred meal plan and a Resident parking permit"
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                  <span className="self-end text-xs text-muted-foreground">
                    {note.length}/{NOTE_MAX_LENGTH}
                  </span>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => setNoteDialogOpen(false)}>
                    Cancel
                  </Button>
                  {/* Works whether or not a note was typed -- an empty note
                      just saves with note: null, per the spec (note is
                      optional, not required to save). */}
                  <Button type="button" className="rounded-full" onClick={handleSave}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
