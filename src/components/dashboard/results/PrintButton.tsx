"use client";

import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// window.print() needs a client component -- shared by the live/in-session
// results page and the saved-scenario view so both use the exact same
// button instead of two copies of an onClick handler.
export function PrintButton() {
  return (
    <Button type="button" className="rounded-full" onClick={() => window.print()}>
      <PrinterIcon className="size-4" />
      Print / Save as PDF
    </Button>
  );
}
