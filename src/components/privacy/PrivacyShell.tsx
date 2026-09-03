import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { ScatteredIllustrations, type ScatterItem } from "@/components/ScatteredIllustrations";
import { Button } from "@/components/ui/button";

// Own hand-jittered layout for this page -- content is a single tall reading
// column rather than a centered card or a rail+content grid, so icons are
// spread down the full scroll length (including well past the first
// viewport) instead of clustering near the top the way a short page's would.
// No McKeldin here, matching Settings' reasoning: this is dense body copy,
// not a hero, so the corner building would just get scrolled past unseen.
const SCATTER_LAYOUT: ScatterItem[] = [
  { icon: "paper", top: "2%", left: "6%", size: "w-12", rotate: -14 },
  { icon: "calculator", top: "4%", left: "82%", size: "w-10", rotate: 17 },
  { icon: "pencil", top: "11%", left: "48%", size: "w-8", rotate: -25 },
  { icon: "calculator", top: "18%", left: "16%", size: "w-9", rotate: 9 },
  { icon: "paper", top: "23%", left: "90%", size: "w-11", rotate: -11 },
  { icon: "pencil", top: "31%", left: "72%", size: "w-7", rotate: 21 },
  { icon: "calculator", top: "38%", left: "4%", size: "w-13", rotate: -8 },
  { icon: "paper", top: "45%", left: "58%", size: "w-10", rotate: 15 },
  { icon: "pencil", top: "52%", left: "28%", size: "w-8", rotate: -19 },
  { icon: "calculator", top: "60%", left: "86%", size: "w-11", rotate: 12 },
  { icon: "paper", top: "68%", left: "10%", size: "w-9", rotate: -16 },
  { icon: "pencil", top: "75%", left: "64%", size: "w-7", rotate: 23 },
  { icon: "calculator", top: "83%", left: "36%", size: "w-10", rotate: -10 },
  { icon: "paper", top: "90%", left: "80%", size: "w-12", rotate: 8 },
  { icon: "pencil", top: "97%", left: "20%", size: "w-8", rotate: -20 },
];

export function PrivacyShell() {
  return (
    <div className="relative isolate flex flex-1 flex-col items-center overflow-hidden px-6 py-16">
      <ScatteredIllustrations layout={SCATTER_LAYOUT} />

      {/* Kept sparser than the auth page's -- this is dense body copy the
          reader is here to actually read, so only two soft blobs pinned to
          the very top corners rather than the auth page's full five-blob
          treatment, which would compete with the text instead of just
          setting a mood behind a single centered card. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-32 h-72 w-72 rounded-full bg-[#3d6fa8]/25 blur-3xl" />
        <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-[#3d6fa8]/20 blur-3xl" />
      </div>

      <div className="animate-fade-in-up flex w-full max-w-3xl flex-col gap-8">
        <Button variant="ghost" className="self-start rounded-full" nativeButton={false} render={<Link href="/" />}>
          <ArrowLeftIcon className="size-4" />
          Back to home
        </Button>

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-spicy-rice text-3xl tracking-wider text-foreground md:text-4xl">Privacy &amp; Data</h1>
          <p className="text-sm text-muted-foreground">Last updated September 2, 2026</p>
        </div>

        <div className="flex flex-col gap-8 rounded-none bg-card/90 p-6 ring-1 ring-foreground/10 shadow-[-6px_10px_20px_-2px_rgba(0,0,0,0.3)] md:p-10">
          <p className="text-base text-muted-foreground">
            UMD Bill Estimator is an unofficial, student-built portfolio project. It is not affiliated with,
            endorsed by, or sponsored by the University of Maryland. This page explains, in plain terms, what data
            this app touches and what it does with it.
          </p>

          <Section title="What we collect">
            <p>
              Using the estimator itself doesn&apos;t require an account and doesn&apos;t send us anything — you can
              build out a full tuition, housing, dining, and parking estimate anonymously, and nothing about that
              session is stored.
            </p>
            <p>
              An account is only created if you choose to sign in with Google. If you then choose to save a
              scenario, we store the selections that make it up (which tuition rate, housing type, dining plan, and
              parking permit you picked) and the resulting computed total, tied to your account.
            </p>
          </Section>

          <Section title="How it's used">
            <p>
              Saved selections and totals exist for one purpose: so you can come back later and see the estimates
              you built, instead of re-entering everything from scratch. They aren&apos;t used for anything beyond
              that — no analytics profiling, no advertising, no resale.
            </p>
            <p>
              If natural-language input is used to fill out a scenario, that text is parsed by an AI model into
              structured selections only (which options you meant) — the AI never computes or has any part in
              producing a dollar amount. Every price shown always comes from this app&apos;s own calculation logic,
              run locally against the same public rate data described below.
            </p>
          </Section>

          <Section title="How it's protected">
            <p>
              Saved scenarios live in a Postgres database with row-level security enforced by the database itself,
              not just application code: the policy on the <code className="rounded bg-muted px-1 py-0.5 text-sm">scenarios</code> table
              restricts every read to rows where <code className="rounded bg-muted px-1 py-0.5 text-sm">auth.uid() = user_id</code> — meaning
              Postgres itself refuses to return anyone else&apos;s saved scenarios to you, and refuses to return yours
              to anyone else.
            </p>
            <p>
              Writes work the same way from the other direction: saving or updating a scenario goes through a
              server-side action using a service-role key that never reaches the browser, so a saved scenario
              can&apos;t be forged or tampered with by calling the database directly from client code.
            </p>
          </Section>

          <Section title="Your controls">
            <p>
              You can delete a saved scenario, or your entire account and everything tied to it, at any time from
              the Account tab on the{" "}
              <Link href="/settings" className="text-primary underline-offset-4 hover:underline">
                Settings
              </Link>{" "}
              page. Account deletion is permanent and immediate — there&apos;s no recovery window or support ticket
              needed.
            </p>
          </Section>

          <Section title="Third parties">
            <p>
              We don&apos;t sell or share your saved selections or account information with any third party. Google
              is used only as the sign-in provider (via Supabase Auth) — no separate advertising or tracking
              integrations are wired into this app.
            </p>
          </Section>

          <Section title="Public rate data">
            <p>
              Tuition, fee, housing, dining, and parking rates shown in the estimator are public information
              published by UMD, gathered by an automated scraper and manually reviewed before it goes live. That
              data describes UMD&apos;s published rates, not you — it has nothing to do with, and isn&apos;t linked
              to, any individual user or account.
            </p>
          </Section>

          <Section title="Questions">
            <p>
              This is a solo portfolio project. If you have a question about how it handles data, reach out at{" "}
              <a
                href="mailto:boomcloud3000@gmail.com"
                className="text-primary underline-offset-4 hover:underline"
              >
                boomcloud3000@gmail.com
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-heading text-xl font-semibold text-foreground">{title}</h2>
      <div className="flex flex-col gap-3 text-base text-muted-foreground">{children}</div>
    </div>
  );
}
