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
// The rates fetch itself is cached (see getRatesBundle.ts) -- this await
// only pays the real Supabase round-trip cost for whichever request is
// first to hit a cache miss, not every visitor.
export default async function DashboardPage() {
  const rates = await getRatesBundle();
  return <DashboardShell academicYearLabel={rates.academicYear.label} rates={rates} />;
}
