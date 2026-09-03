"use client";

import Image from "next/image";
import { ScatteredIllustrations, type ScatterItem } from "@/components/ScatteredIllustrations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Same jittered scatter language as the dashboard, just its own layout --
// no nav bar/multi-column grid to work around here, so the icons spread
// more evenly across the single centered column instead of hugging edges.
const SCATTER_LAYOUT: ScatterItem[] = [
  { icon: "calculator", top: "3%", left: "10%", size: "w-14", rotate: -16 },
  { icon: "pencil", top: "6%", left: "80%", size: "w-8", rotate: 22 },
  { icon: "paper", top: "14%", left: "45%", size: "w-11", rotate: -7 },
  { icon: "calculator", top: "20%", left: "70%", size: "w-10", rotate: 14 },
  { icon: "pencil", top: "24%", left: "20%", size: "w-7", rotate: -23 },
  { icon: "paper", top: "30%", left: "88%", size: "w-13", rotate: 9 },
  { icon: "calculator", top: "36%", left: "5%", size: "w-9", rotate: -12 },
  { icon: "pencil", top: "44%", left: "60%", size: "w-8", rotate: 18 },
  { icon: "paper", top: "50%", left: "30%", size: "w-12", rotate: -19 },
  { icon: "calculator", top: "58%", left: "85%", size: "w-11", rotate: 6 },
  // Four pencil/paper entries were removed from this bottom stretch (was:
  // pencil 64%/12%, paper 70%/68%, pencil 84%/90%, paper 90%/18%) -- on
  // mobile specifically, McKeldin's w-80 covers ~85% of the viewport width
  // at the bottom, so items that cleared it on desktop still landed on top
  // of it at narrow widths. Confirmed via getBoundingClientRect overlap at
  // both breakpoints, not just eyeballed. The two calculator entries here
  // stay -- only pencil/paper were asked to be cleared.
  { icon: "calculator", top: "78%", left: "40%", size: "w-10", rotate: -9 },
  { icon: "calculator", top: "96%", left: "58%", size: "w-9", rotate: 11 },
];

export function AuthShell() {
  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      <ScatteredIllustrations layout={SCATTER_LAYOUT} />

      {/* Darker, more saturated blue than --primary (the pastel homepage/
          dashboard tone) -- these read as a deliberately different, moodier
          accent behind the sign-in card rather than more of the same light
          glow used everywhere else. Varying sizes, all bleeding off their
          nearest edge (negative offsets past the container bounds) rather
          than sitting fully inside it, per the brief. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-32 h-72 w-72 rounded-full bg-[#3d6fa8]/35 blur-3xl" />
        <div className="absolute -top-40 -right-20 h-96 w-96 rounded-full bg-[#3d6fa8]/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-40 h-[28rem] w-[28rem] rounded-full bg-[#3d6fa8]/30 blur-3xl" />
        <div className="absolute -bottom-16 left-1/4 h-56 w-56 rounded-full bg-[#3d6fa8]/25 blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-64 w-64 rounded-full bg-[#3d6fa8]/20 blur-3xl" />
      </div>

      {/* Same McKeldin treatment as the homepage's bottom-left corner --
          identical size/opacity/mask so the two pages read as the same
          building in the same spot, not a re-styled version of it. */}
      <Image
        src="/illustrations/mckeldin.svg"
        alt=""
        width={3130}
        height={1376}
        className="pointer-events-none absolute bottom-0 left-0 -z-10 w-80 opacity-50 md:w-[37rem]"
        style={{
          maskImage:
            "linear-gradient(to right, black 55%, transparent 95%), linear-gradient(to bottom, transparent 0%, black 35%)",
          maskComposite: "intersect",
          WebkitMaskImage:
            "linear-gradient(to right, black 55%, transparent 95%), linear-gradient(to bottom, transparent 0%, black 35%)",
          WebkitMaskComposite: "source-in",
        }}
      />

      <div className="animate-fade-in-up flex flex-col items-center gap-8">
        <h1 className="font-spicy-rice text-3xl tracking-wider text-foreground md:text-4xl">UMD Bill Estimator</h1>

        <Card className="w-full max-w-sm rounded-none bg-card/90 shadow-[-6px_10px_20px_-2px_rgba(0,0,0,0.3)]">
          <CardContent className="flex flex-col items-center gap-6 py-4 text-center">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use your Google account to save scenarios and come back to them later.
              </p>
            </div>

            {/* Not wired yet -- Google Cloud Console + Supabase provider
                config are deferred until this screen itself is settled (see
                PROGRESS-LOG.md, 2026-09-02). onClick is a placeholder. */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-3 rounded-full text-base"
              onClick={() => {
                // TODO: supabase.auth.signInWithOAuth({ provider: "google" })
              }}
            >
              <GoogleIcon className="size-5" />
              Continue with Google
            </Button>

            <p className="text-xs text-muted-foreground">No account required to use the estimator itself.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.581C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
