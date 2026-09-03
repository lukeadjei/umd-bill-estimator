import Link from "next/link";
import { ArrowLeftIcon, ShieldCheckIcon } from "lucide-react";
import { ScatteredIllustrations, type ScatterItem } from "@/components/ScatteredIllustrations";
import { Button } from "@/components/ui/button";

// Same scattered-icon background language as the auth/settings/dashboard
// pages, hand-jittered for this page's own shape -- this is the tallest page
// in the app by far (long-form content, not a fixed-height panel), so the
// layout spreads across the full scroll length instead of clustering near
// the top the way a short single-viewport page's would.
const SCATTER_LAYOUT: ScatterItem[] = [
  { icon: "calculator", top: "1%", left: "6%", size: "w-13", rotate: -14 },
  { icon: "pencil", top: "3%", left: "84%", size: "w-8", rotate: 19 },
  { icon: "paper", top: "9%", left: "40%", size: "w-10", rotate: -6 },
  { icon: "calculator", top: "15%", left: "92%", size: "w-9", rotate: 12 },
  { icon: "pencil", top: "19%", left: "16%", size: "w-7", rotate: -21 },
  { icon: "paper", top: "26%", left: "68%", size: "w-12", rotate: 8 },
  { icon: "calculator", top: "32%", left: "3%", size: "w-10", rotate: -10 },
  { icon: "pencil", top: "38%", left: "88%", size: "w-8", rotate: 23 },
  { icon: "paper", top: "45%", left: "22%", size: "w-11", rotate: -15 },
  { icon: "calculator", top: "51%", left: "72%", size: "w-9", rotate: 7 },
  { icon: "pencil", top: "58%", left: "8%", size: "w-7", rotate: -19 },
  { icon: "paper", top: "64%", left: "90%", size: "w-13", rotate: 13 },
  { icon: "calculator", top: "71%", left: "38%", size: "w-10", rotate: -8 },
  { icon: "pencil", top: "78%", left: "82%", size: "w-8", rotate: 17 },
  { icon: "paper", top: "85%", left: "14%", size: "w-11", rotate: -12 },
  { icon: "calculator", top: "91%", left: "64%", size: "w-9", rotate: 10 },
  { icon: "pencil", top: "97%", left: "30%", size: "w-7", rotate: -17 },
  { icon: "paper", top: "99%", left: "78%", size: "w-10", rotate: 15 },
];

export function AboutShell() {
  return (
    <div className="relative isolate flex flex-1 flex-col items-center overflow-hidden px-6 py-16">
      <ScatteredIllustrations layout={SCATTER_LAYOUT} />

      {/* Same darker/moodier blue accent as the auth page, sparingly here --
          this page is dense with reading text, so only a couple of blobs
          (top and bottom, both bled off the page edges) rather than the
          fuller five-blob treatment auth uses behind a small centered card. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-28 -right-24 h-80 w-80 rounded-full bg-[#3d6fa8]/25 blur-3xl" />
        <div className="absolute top-[140%] -left-32 h-96 w-96 rounded-full bg-[#3d6fa8]/20 blur-3xl" />
      </div>

      <div className="animate-fade-in-up flex w-full max-w-3xl flex-col items-center gap-8">
        <Button
          variant="ghost"
          className="self-start rounded-full"
          nativeButton={false}
          render={<Link href="/" />}
        >
          <ArrowLeftIcon className="size-4" />
          Back to home
        </Button>

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-spicy-rice text-3xl tracking-wider text-foreground md:text-4xl">
            About &amp; Methodology
          </h1>
          <p className="text-sm text-muted-foreground">What this tool does, and how its numbers earn your trust.</p>
        </div>

        <div className="flex w-full flex-col gap-8 rounded-none bg-card/90 p-6 ring-1 ring-foreground/10 shadow-[-6px_10px_20px_-2px_rgba(0,0,0,0.3)] md:p-10">
          {/* Not affiliated -- deliberately the first thing in the window,
              in a visually distinct neutral box (not the primary-tinted
              highlight used for the methodology section below), and in more
              depth than the homepage/footer's one-line version per the brief. */}
          <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-4 ring-1 ring-foreground/10">
            <span className="text-sm font-semibold text-foreground">Unofficial, unaffiliated project</span>
            <p className="text-sm text-muted-foreground">
              UMD Bill Estimator is an independent, student-built portfolio project. It is not affiliated with, endorsed
              by, or sponsored by the University of Maryland — it&apos;s a personal software project built to estimate
              costs using published, publicly available rate information. It is not a substitute for your official bill,
              financial aid award, or Testudo account, and it shouldn&apos;t be used as the sole basis for a financial
              decision.
            </p>
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="font-heading text-xl font-semibold text-foreground">Why this exists</h2>
            <p className="text-base text-muted-foreground">
              UMD&apos;s own billing system, Testudo, is authoritative but not exactly easy to read at a glance —
              itemized charges, term codes, and per-credit breakdowns spread across dense pages that are hard to
              compare against a different choice: a different residence hall, a different dining plan, a different
              credit load. This project doesn&apos;t try to reproduce that format. It exists to answer a question
              Testudo isn&apos;t built to answer — &ldquo;what would my total look like if…&rdquo; — with one clean,
              visual running total that updates as you pick options, broken down by category instead of buried in a
              line-item statement.
            </p>
          </section>

          <section className="flex flex-col gap-2 border-t border-border pt-6">
            <h2 className="font-heading text-xl font-semibold text-foreground">What it estimates</h2>
            <p className="text-base text-muted-foreground">
              The goal is a realistic full cost of attendance, not just a tuition number:
            </p>
            <ul className="mt-1 flex flex-col gap-1.5 text-base text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Tuition</span> — resident and non-resident rates, plus
                differential tuition for Business, Engineering, and Computer Science juniors and seniors
              </li>
              <li>
                <span className="font-medium text-foreground">Mandatory fees</span>
              </li>
              <li>
                <span className="font-medium text-foreground">Housing</span> — by room type and building category
              </li>
              <li>
                <span className="font-medium text-foreground">Dining plans</span> — resident and block plans
              </li>
              <li>
                <span className="font-medium text-foreground">Parking permits</span>
              </li>
              <li>
                <span className="font-medium text-foreground">Health insurance (SHIP)</span> — for students who meet
                the enrollment threshold
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-3 border-t border-border pt-6">
            <h2 className="font-heading text-xl font-semibold text-foreground">How the data stays accurate</h2>
            <p className="text-base text-muted-foreground">
              Every rate in this tool — tuition, fees, housing, dining, parking, insurance — starts as a value pulled
              directly from UMD&apos;s own published pages: billpay.umd.edu, Residential Facilities, Dining Services,
              and DOTS.
            </p>
            <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-4">
              <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-sm text-foreground/80">
                Nothing goes straight from the scraper into the tables the app reads from. Scraped values land in a
                staging area first, get manually checked one by one against the live source HTML, and only get
                promoted to the live tables once verified — a deliberate staging → review → promote pipeline, not an
                automated pass-through. That full pipeline has already been run end to end against the real 2026–2027
                academic year rates, not just exercised in the abstract.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-2 border-t border-border pt-6">
            <h2 className="font-heading text-xl font-semibold text-foreground">Built like production software</h2>
            <p className="text-base text-muted-foreground">
              The part that actually turns your selections into a dollar total — <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">calculateTotal</code> — is
              a set of pure functions: no database calls inside them, no side effects, no mutating a running total as
              you click through options. Every total on screen is recomputed from your full current selections on
              every change, not incremented as you go, which is what keeps a stray bug from quietly compounding into
              the wrong number. Being pure is also what makes these functions unit-testable, and they are — the test
              suite covers tuition, fees, housing, dining, parking, and insurance across their branching rules (which
              selections are required, when a dining plan is optional, where the health-insurance threshold falls).
            </p>
          </section>

          <section className="flex flex-col gap-2 border-t border-border pt-6">
            <h2 className="font-heading text-xl font-semibold text-foreground">Where AI fits in</h2>
            <p className="text-base text-muted-foreground">
              A natural-language input feature — describe your situation in a sentence and have it fill in your
              selections — is planned but not yet built. Its role is deliberately narrow: it only ever parses free
              text into structured selections, or explains a total the calculator already produced. It never
              generates a dollar figure itself. <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">calculateTotal</code> is the
              only function in the codebase allowed to produce a price, and that stays true regardless of whether the
              input came from clicking through the form or from a sentence typed into a future AI box.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
