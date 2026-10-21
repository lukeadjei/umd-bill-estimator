import { Button } from "@/components/ui/button";
import { SparklesIcon } from "lucide-react";

// Phones only. A labeled pill, not an icon-only bubble: a bare chat icon in the
// bottom-right corner looks like a generic "contact support" widget and gets
// ignored, so people never learn the assistant can fill the whole form out
// from one sentence. Absolutely positioned relative to the SummaryBar's sticky
// wrapper (it renders as that wrapper's child), so it always sits just above
// the bar no matter how tall the bar grows -- the old `fixed bottom-24` was a
// guess at the bar's height and overlapped it whenever errors made it taller.
// `nudge`: until the visitor has opened the assistant (or dismissed the intro card), the button
// pulses gently -- one hint, not a nag; it stops for good once they've seen it.
export function ChatFab({ onClick, nudge = false }: { onClick: () => void; nudge?: boolean }) {
  return (
    <Button
      type="button"
      className={`absolute -top-14 right-4 z-10 h-11 gap-2 rounded-full px-4 text-base shadow-lg md:hidden ${nudge ? "motion-safe:animate-pulse ring-4 ring-primary/30" : ""}`}
      onClick={onClick}
      aria-label="Open assistant chat"
    >
      <SparklesIcon />
      Ask the assistant
    </Button>
  );
}
