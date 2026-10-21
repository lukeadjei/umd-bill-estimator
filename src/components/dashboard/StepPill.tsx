"use client";

import { CheckIcon, ChevronDownIcon, MessageCircleIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { TabId, TabItem } from "@/components/dashboard/tabs";

// Mobile replacement for the tab bar. The bar scrolled sideways and cut tabs
// off ("Tuiti..."), so a first-time visitor couldn't tell what steps exist.
// This shows where you are AND how many steps there are ("Tuition · 2 of 6"),
// and opens a vertical list of every step -- with a check on the ones already
// visited -- so all the options are visible at once. Hidden at lg+, where the
// full tab bar fits.
export function StepPill({
  tabs,
  activeTab,
  visited,
  onTabChange,
  onOpenChat,
}: {
  tabs: TabItem[];
  activeTab: TabId;
  visited: Set<TabId>;
  onTabChange: (tab: TabId) => void;
  onOpenChat: () => void;
}) {
  const index = tabs.findIndex((tab) => tab.id === activeTab);
  const current = tabs[index];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Step ${index + 1} of ${tabs.length}: ${current.label}. Open the list of steps`}
        className="flex w-full items-center justify-between gap-2 rounded-full bg-primary px-4 py-2 text-left text-base font-semibold text-primary-foreground shadow-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="truncate">{current.label}</span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-medium opacity-90">
          {index + 1} of {tabs.length}
          <ChevronDownIcon className="size-4" />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[min(calc(100vw-2rem),22rem)]">
        {tabs.map((tab, i) => {
          const isActive = tab.id === activeTab;
          const isVisited = visited.has(tab.id);
          return (
            <DropdownMenuItem
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`gap-3 py-3 text-base ${isActive ? "bg-primary/10 font-semibold" : ""}`}
            >
              <span
                aria-hidden="true"
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isVisited
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isVisited && !isActive ? <CheckIcon className="size-3.5" /> : i + 1}
              </span>
              <span className="flex-1">{tab.label}</span>
              {isVisited && !isActive && <span className="text-xs text-muted-foreground">Viewed</span>}
              {isActive && <span className="text-xs text-primary">Current</span>}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenChat} className="gap-3 py-3 text-base">
          <MessageCircleIcon className="size-5 shrink-0 text-primary" />
          <span className="flex-1">Ask the assistant</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
