import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder preview cards -- real content/images once the other pages exist.
// Each Card's rotate/translate/z-index is written out explicitly (not built
// from a data array) specifically so Tailwind's build-time class scanner can
// see every class name as a literal string in this file. A dynamically
// constructed class name (e.g. `rotate-${n}`) wouldn't reliably get picked up.
export function FeaturePreviewStack() {
  return (
    // Vertical gradient on mobile (stacked layout -- the "seam" is the top
    // edge of this section, not a side, so the fade runs top-to-bottom
    // instead of left-to-right). Starts at plain background so it blends
    // seamlessly with whatever's above (Hero, which is unstyled/white),
    // reaches the tint by 20% down, holds it for the rest of the section --
    // same shape as the desktop gradient, just rotated 90 degrees.
    // At md+, the parent grid's left-to-right gradient takes over instead --
    // this goes transparent so that one shows through undisturbed.
    // md:bg-none, not md:bg-transparent -- the mobile gradient sets
    // background-image, and bg-transparent only clears background-color, a
    // separate CSS sub-property. Without bg-none here, this section's own
    // vertical gradient kept painting over the parent's horizontal one at
    // md+, which is exactly what broke the desktop gradient last round.
    <section className="flex items-center justify-center bg-gradient-to-b from-background to-primary/15 to-20% px-6 py-16 md:bg-none md:px-12">
      {/* inset-0 (dropped) made every card the exact same size as the container --
          fine when they overlapped in place, but now that they're spread out
          vertically each one needs its own explicit width instead. Rotation
          alternates -6/+6/-6 -- a repeating zigzag, not random tilts. */}
      {/* xl:, not md: -- the cards are already close to the column's edge at
          narrower md widths (~768-1024px), and shifting them right there
          causes real overflow. Only shifting once there's actually room. */}
      <div className="relative h-[32rem] w-full max-w-xs xl:translate-x-8">
        <Card className="absolute top-0 left-0 z-30 w-60 -rotate-6">
          <CardHeader>
            <CardTitle>Housing</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Preview coming soon</CardContent>
        </Card>

        <Card className="absolute top-40 left-10 z-20 w-60 rotate-6">
          <CardHeader>
            <CardTitle>Dining</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Preview coming soon</CardContent>
        </Card>

        <Card className="absolute top-80 left-0 z-10 w-60 -rotate-6">
          <CardHeader>
            <CardTitle>Parking</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Preview coming soon</CardContent>
        </Card>
      </div>
    </section>
  );
}
