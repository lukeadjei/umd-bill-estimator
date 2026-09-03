import { Button } from "@/components/ui/button";

// Placeholder profile fields -- real values come from the Supabase session
// once Google OAuth is actually wired up (see PROGRESS-LOG.md, 2026-09-02).
// Delete-account is a real requirement for this page (CLAUDE.md calls it
// out explicitly), not an extra -- the button exists now with a no-op
// handler so the layout/copy is settled before the destructive Supabase
// call gets wired in.
export function AccountPanel() {
  return (
    <div className="flex h-full flex-col gap-8">
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Account</h2>
        <p className="text-base text-muted-foreground">Signed in with Google.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Name</span>
          <p className="text-base text-muted-foreground">—</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Email</span>
          <p className="text-base text-muted-foreground">—</p>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-6">
        <span className="text-sm font-medium text-destructive">Danger zone</span>
        <p className="text-sm text-muted-foreground">
          Permanently deletes your account and every saved scenario. This can&apos;t be undone.
        </p>
        <Button
          type="button"
          variant="destructive"
          className="w-fit rounded-full"
          onClick={() => {
            // TODO: real confirmation flow + Supabase account/data deletion
            // once auth is wired. No-op for this skeleton.
          }}
        >
          Delete account
        </Button>
      </div>
    </div>
  );
}
