import { InfoIcon } from "lucide-react";
import { panelTextSizes } from "@/components/dashboard/typography";

// Shows a plain-language explanation of whichever option is CURRENTLY
// selected -- not a price explanation (the breakdown already covers that),
// just "what is this." Always visible for the current selection, never a
// click-to-expand toggle -- the caller re-renders this with new `children`
// as soon as the selection changes, so switching options swaps the text in
// place rather than requiring a second interaction to see it. Renders
// nothing if there's no description for the current value (e.g. a typo'd
// key, or a value that genuinely has none yet) rather than showing an empty
// box -- see each panel's usage for how that's guarded.
export function SelectionDetail({ spacious, children }: { spacious: boolean; children: React.ReactNode }) {
  const t = panelTextSizes(spacious);
  return (
    <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 ring-1 ring-foreground/10">
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className={`text-foreground/80 ${t.label}`}>{children}</p>
    </div>
  );
}
