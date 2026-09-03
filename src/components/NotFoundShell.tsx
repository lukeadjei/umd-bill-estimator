import Link from "next/link";
import { HomeIcon } from "lucide-react";
import { ScatteredIllustrations, type ScatterItem } from "@/components/ScatteredIllustrations";
import { Button } from "@/components/ui/button";

// A much lighter scatter than the content-heavy pages (auth/settings run
// 14-16 icons) -- this page is just a message and a button, so a dense
// scatter would fight the emptiness rather than fill it tastefully. Six
// icons loosely framing the centered content, none crowding the text.
const SCATTER_LAYOUT: ScatterItem[] = [
  { icon: "calculator", top: "8%", left: "12%", size: "w-12", rotate: -14 },
  { icon: "pencil", top: "14%", left: "82%", size: "w-8", rotate: 19 },
  { icon: "paper", top: "68%", left: "88%", size: "w-11", rotate: -10 },
  { icon: "calculator", top: "78%", left: "6%", size: "w-10", rotate: 12 },
  { icon: "pencil", top: "40%", left: "92%", size: "w-7", rotate: -21 },
  { icon: "paper", top: "88%", left: "35%", size: "w-10", rotate: 8 },
];

export function NotFoundShell() {
  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      <ScatteredIllustrations layout={SCATTER_LAYOUT} />

      {/* Same darker-blue glow language as the auth page, but a single blob
          instead of five -- this page is intentionally sparse, and one soft
          highlight behind the "404" is enough to keep it from feeling like a
          blank error screen without dressing it up into a bigger moment than
          it deserves. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3d6fa8]/20 blur-3xl" />
      </div>

      <div className="animate-fade-in-up flex flex-col items-center gap-4 text-center">
        <h1 className="font-spicy-rice text-7xl tracking-wider text-foreground md:text-8xl">404</h1>

        <div className="flex flex-col items-center gap-1">
          <h2 className="font-heading text-xl font-semibold text-foreground">Page not found</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            This page skipped town -- maybe check the address, or head back to familiar ground.
          </p>
        </div>

        <Button className="mt-4 gap-2 rounded-full" nativeButton={false} render={<Link href="/" />}>
          <HomeIcon className="size-4" />
          Back to home
        </Button>
      </div>
    </div>
  );
}
