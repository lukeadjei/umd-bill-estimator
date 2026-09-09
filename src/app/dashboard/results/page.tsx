import type { Metadata } from "next";
import { getRatesBundle } from "@/lib/supabase/getRatesBundle";
import { ResultsShell } from "@/components/dashboard/results/ResultsShell";

export const metadata: Metadata = {
  title: "Your Estimate — UMD Bill Estimator",
  description: "Printable summary of your UMD cost estimate.",
};

// Same reasoning as dashboard/page.tsx: this calls getRatesBundle() (a real,
// cached Supabase fetch) -- must not run at build time, or it fails in CI
// the same way /dashboard originally did.
export const dynamic = "force-dynamic";

// No auth gating and no server-side selections lookup here on purpose --
// the actual selections only exist client-side (sessionStorage, written by
// DashboardShell), which a Server Component can't read at all. ResultsShell
// handles that read itself; this just supplies the one thing that IS safe
// to fetch server-side, the current rate data.
export default async function ResultsPage() {
  const rates = await getRatesBundle();
  return <ResultsShell rates={rates} />;
}
