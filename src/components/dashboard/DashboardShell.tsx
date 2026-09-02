"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import Image from "next/image";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { ChatPanel } from "@/components/dashboard/ChatPanel";
import { ChatFab } from "@/components/dashboard/ChatFab";
import { ChatOverlay } from "@/components/dashboard/ChatOverlay";
import { SummaryBar } from "@/components/dashboard/SummaryBar";
import { ProgressChecklist } from "@/components/dashboard/ProgressChecklist";
import { CostBreakdown } from "@/components/dashboard/CostBreakdown";
import type { TabId } from "@/components/dashboard/tabs";
import { MajorPanel } from "@/components/dashboard/panels/MajorPanel";
import { TuitionPanel } from "@/components/dashboard/panels/TuitionPanel";
import { HousingPanel } from "@/components/dashboard/panels/HousingPanel";
import { ParkingPanel } from "@/components/dashboard/panels/ParkingPanel";
import { MealsPanel } from "@/components/dashboard/panels/MealsPanel";

type Semester = "fall" | "spring";
type PanelProps = { spacious: boolean };

const PANELS: Record<TabId, ComponentType<PanelProps>> = {
  major: MajorPanel,
  tuition: TuitionPanel,
  housing: HousingPanel,
  parking: ParkingPanel,
  meals: MealsPanel,
};

// Same three homepage illustrations (not the McKeldin building -- that one's
// specific to the homepage's bottom-left corner), scattered across the FULL
// page -- edges and middle alike. Positions and rotation angles are
// hand-jittered (arbitrary degree values, not a repeating -12/6/3 pattern)
// rather than laid out on a regular grid, so it reads as scattered rather
// than tiled. Opacity cycles through three tiers for the same reason --
// enough variation that it doesn't look like one stamp copy-pasted. Each
// SVG is ~1-2KB, so even thirty of them is negligible -- the actual cost
// driver would be a large raster image repeated many times, which this
// isn't.
const ICONS = {
  calculator: { src: "/illustrations/calculator.svg", w: 290, h: 430 },
  pencil: { src: "/illustrations/pencil.svg", w: 110, h: 630 },
  paper: { src: "/illustrations/paper.svg", w: 230, h: 340 },
} as const;
const OPACITY_TIERS = [0.14, 0.19, 0.24] as const;

const SCATTER_LAYOUT = [
  { icon: "calculator", top: "1%", left: "6%", size: "w-16", rotate: -14 },
  { icon: "pencil", top: "4%", left: "33%", size: "w-7", rotate: 21 },
  { icon: "paper", top: "3%", left: "62%", size: "w-11", rotate: 8 },
  { icon: "calculator", top: "8%", left: "88%", size: "w-9", rotate: -19 },
  { icon: "pencil", top: "12%", left: "17%", size: "w-8", rotate: 27 },
  { icon: "paper", top: "15%", left: "49%", size: "w-13", rotate: -11 },
  { icon: "calculator", top: "18%", left: "71%", size: "w-10", rotate: 16 },
  { icon: "pencil", top: "22%", left: "5%", size: "w-7", rotate: -24 },
  { icon: "paper", top: "24%", left: "38%", size: "w-12", rotate: 5 },
  { icon: "calculator", top: "28%", left: "95%", size: "w-11", rotate: -8 },
  { icon: "pencil", top: "31%", left: "58%", size: "w-8", rotate: 19 },
  { icon: "paper", top: "35%", left: "12%", size: "w-14", rotate: -17 },
  { icon: "calculator", top: "38%", left: "80%", size: "w-9", rotate: 12 },
  { icon: "pencil", top: "42%", left: "27%", size: "w-7", rotate: -6 },
  { icon: "paper", top: "45%", left: "66%", size: "w-13", rotate: 23 },
  { icon: "calculator", top: "49%", left: "3%", size: "w-10", rotate: -21 },
  { icon: "pencil", top: "52%", left: "45%", size: "w-8", rotate: 9 },
  { icon: "paper", top: "55%", left: "90%", size: "w-11", rotate: -14 },
  { icon: "calculator", top: "59%", left: "20%", size: "w-12", rotate: 17 },
  { icon: "pencil", top: "62%", left: "73%", size: "w-7", rotate: -9 },
  { icon: "paper", top: "65%", left: "55%", size: "w-14", rotate: 6 },
  { icon: "calculator", top: "69%", left: "9%", size: "w-9", rotate: -25 },
  { icon: "pencil", top: "72%", left: "84%", size: "w-8", rotate: 20 },
  { icon: "paper", top: "76%", left: "40%", size: "w-12", rotate: -12 },
  { icon: "calculator", top: "79%", left: "63%", size: "w-11", rotate: 15 },
  { icon: "pencil", top: "83%", left: "18%", size: "w-7", rotate: -18 },
  { icon: "paper", top: "86%", left: "97%", size: "w-13", rotate: 7 },
  { icon: "calculator", top: "90%", left: "48%", size: "w-10", rotate: -10 },
  { icon: "pencil", top: "93%", left: "30%", size: "w-8", rotate: 24 },
  { icon: "paper", top: "97%", left: "76%", size: "w-14", rotate: -6 },
] as const;

const SCATTER = SCATTER_LAYOUT.map((item, index) => ({
  ...ICONS[item.icon as keyof typeof ICONS],
  top: item.top,
  left: item.left,
  size: item.size,
  rotate: item.rotate,
  opacity: OPACITY_TIERS[index % OPACITY_TIERS.length],
}));

// Owns every piece of skeleton-level state: active tab, which tabs have
// been visited (a stand-in for "filled in" -- see ProgressChecklist),
// semester, whether the mobile chat overlay is open, and whether the
// desktop chat panel is collapsed. Nothing here is real Selections/form
// state yet, so it stays local to this component rather than lifted to
// context or a store. Each tab panel keeps its own placeholder field state
// internally until a real form exists to lift it into.
export function DashboardShell() {
  const [activeTab, setActiveTab] = useState<TabId>("major");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["major"]));
  const [semester, setSemester] = useState<Semester>("fall");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    setVisitedTabs((current) => new Set(current).add(tab));
  }

  const ActivePanel = PANELS[activeTab];

  return (
    <div className="relative isolate flex flex-1 flex-col">
      {/* pointer-events-none + -z-10 + overflow-hidden on this layer only
          (not the root) so it can't affect layout, clicks, or the sticky
          chat/summary bar elsewhere in the tree. inset-0 against the
          isolate'd root above spans the page's real (scrollable) height,
          not just one viewport, so the scatter covers the whole page. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {SCATTER.map((item, index) => (
          <Image
            key={index}
            src={item.src}
            alt=""
            width={item.w}
            height={item.h}
            className={`absolute ${item.size}`}
            style={{ top: item.top, left: item.left, transform: `rotate(${item.rotate}deg)`, opacity: item.opacity }}
          />
        ))}
      </div>

      {/* Same font as the homepage's h1, at a scale that fits a persistent
          bar instead of a hero. */}
      <div className="px-4 pt-6 pb-2 text-center md:px-8 md:pt-8 md:text-left">
        <h1 className="font-spicy-rice text-2xl tracking-wider text-foreground md:text-3xl">UMD Bill Estimator</h1>
      </div>

      <DashboardNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        semester={semester}
        onSemesterChange={setSemester}
        chatCollapsed={chatCollapsed}
        onToggleChat={() => setChatCollapsed((current) => !current)}
      />

      <div className="grid flex-1 grid-cols-1 items-start gap-4 p-4 md:grid-cols-[1fr_auto] md:p-8">
        <div className="flex min-w-0 flex-col gap-4">
          <ProgressChecklist visited={visitedTabs} />

          <div className="animate-fade-in-up flex flex-1 flex-col rounded-none bg-card/85 p-6 ring-1 ring-foreground/10 shadow-[-6px_10px_20px_-2px_rgba(0,0,0,0.35)]">
            <ActivePanel spacious={chatCollapsed} />
          </div>

          <CostBreakdown semester={semester} />

          <SummaryBar semester={semester} />
        </div>

        {!chatCollapsed && <ChatPanel onCollapse={() => setChatCollapsed(true)} />}
      </div>

      <ChatFab onClick={() => setChatOpen(true)} />
      <ChatOverlay open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
