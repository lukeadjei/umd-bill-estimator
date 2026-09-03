import type { Metadata } from "next";
import { NotFoundShell } from "@/components/NotFoundShell";

export const metadata: Metadata = {
  title: "Page Not Found — UMD Bill Estimator",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return <NotFoundShell />;
}
