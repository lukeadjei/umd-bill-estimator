import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard — UMD Bill Estimator",
  description: "Build your estimated UMD bill: tuition, housing, dining, and parking.",
};

// Public route, no auth gating -- matches the homepage's own "save it, or
// just walk away, no account required" flow. Inherits fonts/Footer/flex
// shell from the root layout automatically.
export default function DashboardPage() {
  return <DashboardShell />;
}
