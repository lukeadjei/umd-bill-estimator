import type { Semester } from "@/lib/calculator/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SemesterToggle } from "@/components/dashboard/SemesterToggle";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/components/dashboard/AccountMenu";
import { StepPill } from "@/components/dashboard/StepPill";
import type { TabId, TabItem } from "@/components/dashboard/tabs";
import { MessageCircleIcon } from "lucide-react";

export function DashboardNav({
  tabs,
  activeTab,
  onTabChange,
  visitedTabs,
  semester,
  semesters,
  onSemesterChange,
  chatCollapsed,
  onToggleChat,
  onOpenChat,
  isSignedIn,
  avatarUrl,
}: {
  tabs: TabItem[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  visitedTabs: Set<TabId>;
  semester: Semester;
  semesters: readonly Semester[];
  onSemesterChange: (semester: Semester) => void;
  chatCollapsed: boolean;
  onToggleChat: () => void;
  onOpenChat: () => void;
  isSignedIn: boolean;
  avatarUrl: string | null;
}) {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:px-8">
      {/* Phone: one pill showing the current step and "N of total", opening a
          vertical list of every step -- the tab bar below scrolled sideways
          and cut tabs off. The sticky row is deliberately just this pill and
          the semester control; account and theme controls live in the page
          header on mobile (see DashboardShell) so nothing competes for width. */}
      <div className="min-w-0 flex-1 lg:hidden">
        <StepPill tabs={tabs} activeTab={activeTab} visited={visitedTabs} onTabChange={onTabChange} onOpenChat={onOpenChat} />
      </div>

      {/* lg+: the full tab bar fits (below that the chat panel takes half the width at tablet sizes). Still horizontally scrollable in case a
          narrow tablet width can't hold it; the right-edge fade is a static
          hint for that case only. */}
      <div className="relative hidden min-w-0 flex-1 lg:block">
        <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as TabId)}>
            {/* TabsList/TabsTrigger restyled as fully-rounded "bubble" pills --
                base-ui's Tabs gives keyboard/ARIA behavior for free, the bubble
                look itself is just className overrides on top of it. */}
            <TabsList className="h-auto w-max gap-1 rounded-full bg-muted p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-full px-4 py-2 text-base font-semibold data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Same soft primary-color glow language as the homepage's title/card
          glows -- a small vertical accent marking the seam between "what
          you're editing" (tabs) and "which term/assistant controls you're
          looking at" (semester + chat), rather than a plain border. */}
      <div
        aria-hidden="true"
        className="hidden h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-transparent via-primary/50 to-transparent lg:block"
      />

      <div className="flex shrink-0 items-center gap-2">
        {/* md+ only: on phones the toggle is a full-width control in the page header,
            because three semesters no longer fit next to the step pill. */}
        <div className="hidden md:block">
          <SemesterToggle value={semester} onChange={onSemesterChange} semesters={semesters} />
        </div>

        {/* Desktop-only entry point for reopening the assistant chat once
            it's collapsed -- the collapsed panel itself renders nothing, so
            this button (always visible in the sticky nav) is the one clear,
            easy-to-read way back in instead of a sideways rail. */}
        <Button
          type="button"
          variant={chatCollapsed ? "outline" : "default"}
          size="icon"
          className="hidden rounded-full md:inline-flex"
          onClick={onToggleChat}
          aria-label={chatCollapsed ? "Open assistant chat" : "Collapse assistant chat"}
          aria-pressed={!chatCollapsed}
        >
          <MessageCircleIcon />
        </Button>

        {/* Below lg the account control sits in the page header instead. */}
        <div className="hidden lg:block">
          <AccountMenu isSignedIn={isSignedIn} avatarUrl={avatarUrl} />
        </div>
      </div>
    </div>
  );
}
