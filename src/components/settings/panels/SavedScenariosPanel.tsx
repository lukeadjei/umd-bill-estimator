// Empty state for now -- real content is a list of `scenarios` rows
// (name, computed_total, created_at) once persistence exists, each with
// view/delete actions. Nothing to preview yet since saving isn't wired up.
export function SavedScenariosPanel() {
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
