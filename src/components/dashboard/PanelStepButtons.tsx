import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TabId, TabItem } from "@/components/dashboard/tabs";

// Phone/tablet Back / Next at the bottom of a panel, where a thumb already is
// after filling it in. On desktop the PanelNavArrows chevrons flank the panel,
// but at phone and tablet widths they sat on top of the panel's content, so there they're
// hidden and these take over. Hidden at lg+.
export function PanelStepButtons({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: TabItem[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const index = tabs.findIndex((tab) => tab.id === activeTab);
  const previous = index > 0 ? tabs[index - 1] : null;
  const next = index < tabs.length - 1 ? tabs[index + 1] : null;

  return (
    <div className="mt-6 flex items-center justify-between gap-3 lg:hidden">
      {previous ? (
        <Button type="button" variant="outline" className="rounded-full" onClick={() => onTabChange(previous.id)}>
          <ChevronLeftIcon />
          Back
        </Button>
      ) : (
        <span />
      )}
      {next && (
        <Button type="button" className="rounded-full" onClick={() => onTabChange(next.id)}>
          Next: {next.label}
          <ChevronRightIcon />
        </Button>
      )}
    </div>
  );
}
