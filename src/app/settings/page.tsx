import type { Metadata } from "next";
import { SettingsShell } from "@/components/settings/SettingsShell";

export const metadata: Metadata = {
  title: "Settings — UMD Bill Estimator",
  description: "Manage your account and saved scenarios.",
};

export default function SettingsPage() {
  return <SettingsShell />;
}
