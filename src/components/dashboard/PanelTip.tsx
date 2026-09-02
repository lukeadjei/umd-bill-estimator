import { LightbulbIcon } from "lucide-react";

// Small contextual note dropped at the bottom of each tab panel -- fills the
// blank space below a short field list with something actually useful
// (a rule of thumb, an eligibility threshold) instead of empty air.
export function PanelTip({ spacious, children }: { spacious: boolean; children: React.ReactNode }) {
  return (
    <div className="mt-auto flex items-start gap-2 rounded-xl bg-primary/10 p-3">
      <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-primary" />
      <p className={spacious ? "text-base text-foreground/80" : "text-sm text-foreground/80"}>{children}</p>
    </div>
  );
}
