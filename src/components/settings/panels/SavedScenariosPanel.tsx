"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteScenarioAction } from "@/app/settings/actions";
import type { SavedScenario } from "@/lib/supabase/scenarios";

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(isoTimestamp: string) {
  return new Date(isoTimestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// One row, own component (not inlined in the map below) so each row's
// delete-in-flight/error state and its own AlertDialog's open state stay
// independent -- deleting one scenario shouldn't disable or show an error on
// any other row.
function SavedScenarioRow({ scenario }: { scenario: SavedScenario }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteScenarioAction(scenario.id);
    if (result.success) {
      // Re-fetches getUserScenarios server-side rather than removing this
      // row from a separate client-side copy of the list -- the server
      // stays the single source of truth for what's actually saved, same
      // as everywhere else in this app.
      router.refresh();
    } else {
      setDeleteError(result.error);
      setDeleting(false);
    }
  }

  return (
    <li className="relative">
      {/* pr-12 so the absolutely positioned delete button (below) never sits
          on top of the total, even for a long dollar figure. The delete
          button is a sibling of this Link, not nested inside it -- a
          <button> inside an <a> is invalid markup and would double-fire on
          click (both the navigation and the delete dialog). */}
      <Link
        href={`/dashboard?scenario=${scenario.id}`}
        className="flex items-center justify-between gap-4 rounded-none bg-card/85 p-4 pr-12 ring-1 ring-foreground/10 shadow-[-5px_8px_16px_-3px_rgba(0,0,0,0.28)] transition-colors hover:bg-card hover:ring-foreground/20"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-medium text-foreground">{scenario.name}</span>
          {scenario.note ? <span className="text-xs italic text-muted-foreground">{scenario.note}</span> : null}
          <span className="text-sm text-muted-foreground">{formatDate(scenario.createdAt)}</span>
        </div>
        <span className="font-heading text-lg font-semibold text-foreground">
          {formatCurrency(scenario.computedTotal)}
        </span>
      </Link>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 rounded-full text-muted-foreground hover:text-destructive"
              aria-label={`Delete ${scenario.name}`}
            />
          }
        >
          <XIcon className="size-4" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{scenario.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes this saved scenario from your account. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-xs font-medium text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

// The array arrives newest-first (already sorted by the query in
// getUserScenarios), so this doesn't re-sort it.
// Each row links to /dashboard?scenario=<id>, which loads that scenario's
// saved selections back into the dashboard, plus a per-row delete button
// (see SavedScenarioRow).
export function SavedScenariosPanel({ scenarios }: { scenarios: SavedScenario[] }) {
  if (scenarios.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <h2 className="font-heading text-xl font-semibold text-foreground">Saved Scenarios</h2>
        <p className="max-w-sm text-base text-muted-foreground">
          You haven&apos;t saved any scenarios yet. Once you generate a plan on the dashboard, it&apos;ll show up
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Saved Scenarios</h2>
        <p className="text-base text-muted-foreground">Every estimate you&apos;ve saved, newest first.</p>
      </div>

      <ul className="flex flex-col gap-3">
        {scenarios.map((scenario) => (
          <SavedScenarioRow key={scenario.id} scenario={scenario} />
        ))}
      </ul>
    </div>
  );
}
