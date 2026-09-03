"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ChatPanelContent } from "@/components/dashboard/ChatPanelContent";

// Mobile-only bottom sheet, opened by ChatFab. Reuses the same
// ChatPanelContent as the desktop ChatPanel so the two surfaces can't drift
// apart -- only the wrapper (fixed side panel vs. bottom sheet) differs.
export function ChatOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-none p-0 shadow-[0_-8px_20px_-3px_rgba(0,0,0,0.32)] data-[side=bottom]:h-[85vh] md:hidden">
        <SheetTitle className="sr-only">Assistant chat</SheetTitle>
        <ChatPanelContent />
      </SheetContent>
    </Sheet>
  );
}
