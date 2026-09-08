"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { ScatteredIllustrations, type ScatterItem } from "@/components/ScatteredIllustrations";
import { SettingsNav } from "@/components/settings/SettingsNav";
import { Button } from "@/components/ui/button";
import type { CategoryId } from "@/components/settings/categories";
import { AccountPanel } from "@/components/settings/panels/AccountPanel";
import { SavedScenariosPanel } from "@/components/settings/panels/SavedScenariosPanel";
import type { SavedScenario } from "@/lib/supabase/scenarios";

// Reads ?tab= and reports back which category it names -- "scenarios"
// selects the Saved Scenarios panel on load (e.g. a link from
// DashboardNav), anything else (missing param, "account", or an
// unrecognized value) defaults to "account" same as before this existed.
// useSearchParams() bails a Client Component out of static rendering for
// whatever it's called in unless that call is wrapped in <Suspense>, so
// the read is isolated in this tiny component rather than at the top of
// SettingsShell.
function InitialTabReader({ onResolved }: { onResolved: (tab: CategoryId) => void }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  // useEffect, not a call during render: onResolved calls setActive on the
  // parent, and updating a different component's state mid-render (rather
  // than after this one has committed) is what React's rules of rendering
  // disallow. Runs once per resolved tab value.
  useEffect(() => {
    onResolved(tab === "scenarios" ? "scenarios" : "account");
  }, [tab, onResolved]);

  return null;
}

// Same scattered-icon background language as the dashboard/auth pages, minus
// McKeldin -- this page is a small centered panel, not a full hero, so the
// corner building wouldn't actually be visible without cropping badly.
const SCATTER_LAYOUT: ScatterItem[] = [
  { icon: "calculator", top: "2%", left: "8%", size: "w-14", rotate: -15 },
  { icon: "pencil", top: "5%", left: "78%", size: "w-8", rotate: 20 },
  { icon: "paper", top: "12%", left: "42%", size: "w-11", rotate: -8 },
  { icon: "calculator", top: "18%", left: "18%", size: "w-9", rotate: 13 },
  { icon: "pencil", top: "22%", left: "90%", size: "w-7", rotate: -22 },
  { icon: "paper", top: "28%", left: "62%", size: "w-13", rotate: 10 },
  { icon: "calculator", top: "34%", left: "4%", size: "w-10", rotate: -11 },
  { icon: "pencil", top: "40%", left: "85%", size: "w-8", rotate: 24 },
  { icon: "paper", top: "48%", left: "10%", size: "w-12", rotate: -17 },
  { icon: "calculator", top: "56%", left: "70%", size: "w-11", rotate: 7 },
  { icon: "pencil", top: "64%", left: "30%", size: "w-7", rotate: -20 },
  { icon: "paper", top: "72%", left: "88%", size: "w-14", rotate: 14 },
  { icon: "calculator", top: "80%", left: "12%", size: "w-9", rotate: -9 },
  { icon: "pencil", top: "88%", left: "55%", size: "w-8", rotate: 18 },
  { icon: "paper", top: "94%", left: "78%", size: "w-12", rotate: -13 },
  { icon: "calculator", top: "97%", left: "22%", size: "w-10", rotate: 11 },
];

type SettingsShellProps = {
  name: string | null;
  email: string | null;
  scenarios: SavedScenario[];
};

// Only two categories today -- Account and Saved Scenarios. Which one's
// active is the only real state here. The two panels now take different,
// incompatible prop shapes (Account needs name/email, Saved Scenarios needs
// the scenarios list), so rendering the active one is a plain conditional
// rather than a generic `PANELS` component lookup -- there's no prop shape
// a single lookup type could describe for both anymore.
export function SettingsShell({ name, email, scenarios }: SettingsShellProps) {
  const [active, setActive] = useState<CategoryId>("account");

  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* Renders nothing -- it only resolves ?tab= into the initial `active`
          value via the effect above. Suspense fallback is null since there's
          no visible content to placeholder here. */}
      <Suspense fallback={null}>
        <InitialTabReader onResolved={setActive} />
      </Suspense>

      <ScatteredIllustrations layout={SCATTER_LAYOUT} />

      <div className="animate-fade-in-up flex w-full max-w-4xl flex-col items-center gap-8">
        {/* Goes to a fixed destination (the dashboard), not router.back() --
            router.back() would depend on browser history, which is exactly
            what this button exists to be an alternative to (e.g. someone
            who opened /settings in a new tab or from a bookmark has no
            useful "back" entry at all). "Where does this actually take you"
            should never be ambiguous. */}
        <Button
          variant="ghost"
          className="self-start rounded-full"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          <ArrowLeftIcon className="size-4" />
          Back to dashboard
        </Button>

        <h1 className="font-spicy-rice text-3xl tracking-wider text-foreground md:text-4xl">Settings</h1>

        {/* The "smaller inward rectangle" -- one bordered/shadowed window
            (not two separate cards like the dashboard's content+chat) with
            an internal 20/80 split: category rail, then active content.
            Single column on mobile (nav row on top, content below) since
            20% of a phone width isn't enough room for readable labels.
            max-w-4xl (up from max-w-3xl) both makes the box bigger overall
            and, as a direct side effect, gives the 20% rail more real
            breathing room -- at max-w-3xl it measured out to ~120px
            available for the button after padding, which is what was
            actually crowding "Saved Scenarios" against the divider (the
            20/80 split itself was correct, the box was just too small for
            it to read comfortably). */}
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-none bg-card/90 ring-1 ring-foreground/10 shadow-[-6px_10px_20px_-2px_rgba(0,0,0,0.3)] md:grid-cols-[20%_80%]">
          <div className="border-b border-border p-4 md:border-r md:border-b-0">
            <SettingsNav active={active} onChange={setActive} />
          </div>

          <div className="min-h-[24rem] p-6 md:p-8">
            {active === "account" ? (
              <AccountPanel name={name} email={email} />
            ) : (
              <SavedScenariosPanel scenarios={scenarios} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
