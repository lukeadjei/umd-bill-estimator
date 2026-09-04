import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getRatesBundle } from "@/lib/supabase/getRatesBundle";

export const metadata: Metadata = {
  title: "Dashboard — UMD Bill Estimator",
  description: "Build your estimated UMD bill: tuition, housing, dining, and parking.",
};

// Public route, no auth gating -- matches the homepage's own "save it, or
// just walk away, no account required" flow. Inherits fonts/Footer/flex
// shell from the root layout automatically.
//
// force-dynamic: this page must render per-request, not be statically
// pre-rendered at build time. Without this, `next build` tries to actually
// run getRatesBundle() -> a real Supabase call during the build itself --
// which fails in CI (no .env.local, correctly not committed) and would
// defeat the point of the unstable_cache design either way: that caching
// strategy assumes a live per-request render (first real visitor after a
// cache miss pays the round-trip cost), not one HTML snapshot frozen into
// the build output.
export const dynamic = "force-dynamic";

// The rates fetch itself is cached (see getRatesBundle.ts) -- this await
// only pays the real Supabase round-trip cost for whichever request is
// first to hit a cache miss, not every visitor.
export default async function DashboardPage() {
  const rates = await getRatesBundle();
  return <DashboardShell academicYearLabel={rates.academicYear.label} rates={rates} />;
}
