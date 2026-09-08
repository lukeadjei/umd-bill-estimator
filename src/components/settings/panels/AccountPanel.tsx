"use client";

import { useState } from "react";
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
import { deleteAccountAction, signOutAction } from "@/app/settings/actions";

export function AccountPanel({ name, email }: { name: string | null; email: string | null }) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteAccountAction();
    // Only reachable on failure -- deleteAccountAction redirects on success,
    // which throws internally and never returns a value here.
    if (result && !result.success) {
      setDeleteError(result.error);
      setDeleting(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-8">
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Account</h2>
        <p className="text-base text-muted-foreground">Signed in with Google.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Name</span>
          <p className="text-base text-muted-foreground">{name ?? "—"}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Email</span>
          <p className="text-base text-muted-foreground">{email ?? "—"}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-6">
        <Button type="button" variant="outline" className="w-fit rounded-full" onClick={() => signOutAction()}>
          Sign out
        </Button>
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-6">
        <span className="text-sm font-medium text-destructive">Danger zone</span>
        <p className="text-sm text-muted-foreground">
          Permanently deletes your account and every saved scenario. This can&apos;t be undone.
        </p>

        <AlertDialog>
          <AlertDialogTrigger render={<Button type="button" variant="destructive" className="w-fit rounded-full" />}>
            Delete account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                All data in the database tied to your account -- including every saved scenario -- will be
                permanently wiped. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteError && <p className="text-xs font-medium text-destructive">{deleteError}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
