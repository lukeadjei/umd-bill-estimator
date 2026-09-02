import { Button } from "@/components/ui/button";
import { MessageCircleIcon } from "lucide-react";

// Mobile-only. bottom-24 (not bottom-4) clears the fixed SummaryBar sitting
// at the very bottom of the screen on mobile, so the two never overlap.
export function ChatFab({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      size="icon-lg"
      className="fixed right-4 bottom-24 z-50 rounded-full shadow-lg md:hidden"
      onClick={onClick}
      aria-label="Open assistant chat"
    >
      <MessageCircleIcon />
    </Button>
  );
}
