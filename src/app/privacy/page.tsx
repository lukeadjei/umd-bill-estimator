import type { Metadata } from "next";
import { PrivacyShell } from "@/components/privacy/PrivacyShell";

export const metadata: Metadata = {
  title: "Privacy Policy — UMD Bill Estimator",
  description: "What UMD Bill Estimator collects, how it's used, and how to delete it.",
};

export default function PrivacyPage() {
  return <PrivacyShell />;
}
