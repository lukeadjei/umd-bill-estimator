import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SemesterToggle } from "@/components/dashboard/SemesterToggle";
import { Button } from "@/components/ui/button";
import { TAB_ITEMS, type TabId } from "@/components/dashboard/tabs";
import { MessageCircleIcon } from "lucide-react";

type Semester = "fall" | "spring";

export function DashboardNav({
  activeTab,
  onTabChange,
  semester,
  onSemesterChange,
  chatCollapsed,
  onToggleChat,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  semester: Semester;
  onSemesterChange: (semester: Semester) => void;
  chatCollapsed: boolean;
  onToggleChat: () => void;
}) {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:px-8">
      {/* Horizontally scrollable on mobile -- five bubbles plus the semester
          toggle don't reliably fit a narrow viewport, so this row scrolls
          instead of wrapping (wrapping would push the semester toggle to a
          second line and make the nav's height jump between tabs). The
          right-edge fade is a static mobile-only hint that there's more to
          scroll to -- everything fits without scrolling at md+, so it's
          hidden there rather than trying to detect overflow at runtime. */}
      <div className="relative min-w-0 flex-1">
        <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as TabId)}>
            {/* TabsList/TabsTrigger restyled as fully-rounded "bubble" pills --
                base-ui's Tabs gives keyboard/ARIA behavior for free, the bubble
                look itself is just className overrides on top of it. */}
            <TabsList className="h-auto w-max gap-1 rounded-full bg-muted p-1">
              {TAB_ITEMS.map((tab) => (
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent md:hidden"
        />
      </div>

      {/* Same soft primary-color glow language as the homepage's title/card
          glows -- a small vertical accent marking the seam between "what
          you're editing" (tabs) and "which term/assistant controls you're
          looking at" (semester + chat), rather than a plain border. */}
      <div
        aria-hidden="true"
        className="hidden h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-transparent via-primary/50 to-transparent md:block"
      />

      <div className="flex shrink-0 items-center gap-2">
        <SemesterToggle value={semester} onChange={onSemesterChange} />

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
      </div>
    </div>
  );
}
