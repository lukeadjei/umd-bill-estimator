import type { Metadata } from "next";
import { AboutShell } from "@/components/about/AboutShell";

export const metadata: Metadata = {
  title: "About — UMD Bill Estimator",
  description: "What this tool estimates, why it exists, and how its rate data is kept accurate.",
};

export default function AboutPage() {
  return <AboutShell />;
}
