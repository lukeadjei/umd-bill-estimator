"use client";

import { useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TAB_ITEMS, type TabId } from "@/components/dashboard/tabs";

// Flanks the active panel (parent must be `relative`) so users can move
// between Major/Tuition/Housing/Parking/Meals without going back up to the
// tab bar. Also wires ArrowLeft/ArrowRight globally -- see the effect below
// for why "globally" needs a guard, not just a bare window listener.
export function PanelNavArrows({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (tab: TabId) => void }) {
  const currentIndex = TAB_ITEMS.findIndex((tab) => tab.id === activeTab);
  const previousTab = currentIndex > 0 ? TAB_ITEMS[currentIndex - 1] : null;
  const nextTab = currentIndex < TAB_ITEMS.length - 1 ? TAB_ITEMS[currentIndex + 1] : null;

  // Global (window-level) so it works regardless of what's focused -- but
  // guarded: if focus is inside a text input/textarea/select (or a
  // contenteditable element), arrow keys already have a job there (moving
  // the cursor), so this bails out instead of hijacking that. Re-subscribes
  // whenever previousTab/nextTab change so the handler never closes over a
  // stale activeTab -- cheap to redo on every tab change, and avoids the
  // classic React bug where an effect's callback keeps seeing an old value
  // forever because it wasn't in the dependency array.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTypingContext =
        target !== null && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);
      if (isTypingContext) return;

      if (event.key === "ArrowLeft" && previousTab) onTabChange(previousTab.id);
      else if (event.key === "ArrowRight" && nextTab) onTabChange(nextTab.id);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previousTab, nextTab, onTabChange]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full disabled:opacity-0"
        onClick={() => previousTab && onTabChange(previousTab.id)}
        disabled={!previousTab}
        aria-label="Previous section"
      >
        <ChevronLeftIcon />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full disabled:opacity-0"
        onClick={() => nextTab && onTabChange(nextTab.id)}
        disabled={!nextTab}
        aria-label="Next section"
      >
        <ChevronRightIcon />
      </Button>
    </>
  );
}
