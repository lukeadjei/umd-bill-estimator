// Shared size tiers for panel text, used by every tab panel. Two tiers, not
// one -- the baseline is already a step up from the first skeleton pass (per
// feedback that fonts needed to be bigger everywhere), and `spacious` bumps
// one step further when the chat panel is collapsed and the content column
// has the extra room to use it.
export function panelTextSizes(spacious: boolean) {
  return {
    heading: spacious ? "text-2xl" : "text-xl",
    body: spacious ? "text-lg" : "text-base",
    label: spacious ? "text-base" : "text-sm",
    hint: spacious ? "text-sm" : "text-xs",
  };
}
