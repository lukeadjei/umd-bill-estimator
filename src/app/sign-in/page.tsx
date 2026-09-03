import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Sign In — UMD Bill Estimator",
  description: "Sign in to save and revisit your UMD bill estimates.",
};

export default function SignInPage() {
  return <AuthShell />;
}
