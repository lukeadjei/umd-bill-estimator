import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function Hero() {
  return (
    // isolate creates a self-contained stacking context for this section --
    // without it, the negative z-index illustration below gets compared
    // against the grid parent's own gradient background (painted after
    // negative-z descendants per the CSS paint-order spec) and disappears
    // behind it entirely, regardless of opacity.
    <section className="relative isolate flex flex-col items-center gap-4 px-6 pt-8 pb-16 text-center md:items-start md:px-12 md:pt-12 md:pb-20 md:text-left">
      {/* Soft glow positioned right behind the title specifically -- an oval
          (unequal height/width on rounded-full), not a circle, sized wide to
          match the title's shape. Lighter blur than before (xl, not 3xl) so
          the oval's outline is still somewhat visible rather than a totally
          shapeless haze, and lower opacity (20%, not 40%) per feedback that
          it was too strong. Same --primary token as everything else. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-4 left-1/2 -z-10 h-37 w-[32rem] -translate-x-1/2 rounded-full bg-primary/35 blur-lg md:top-0 md:-left-5 md:translate-x-0"
      />

      {/* Test placement of the first custom illustration -- faded, rotated
          like the preview cards, sitting behind the text (-z-10) so the
          description/list overlap it rather than the other way around.
          pointer-events-none so it never blocks clicking through to text/links.
          left-1/2 (not a fixed px value) so this scales with the column's
          actual width instead of risking the same overflow bug the earlier
          fixed left-125 caused -- lands in the empty middle gap between the
          text and the buttons/cards, clear of both. */}
      {/* width/height match the SVG's real aspect ratio (29:43, scaled up) --
          Next.js uses these to reserve the right proportions; the actual
          rendered size still comes from the w-40 class below. */}
      <Image
        src="/illustrations/calculator.svg"
        alt=""
        width={290}
        height={430}
        className="pointer-events-none absolute top-32 left-4 -z-10 w-40 -rotate-12 opacity-10 md:top-12 md:left-1/2 md:-translate-x-1/2"
      />

      {/* Written-paper illustration. The md: position/size below is exactly
          what was hand-placed directly in the browser/devtools on the
          desktop layout -- left untouched. The mobile (unprefixed) values
          are a separate placement: at mobile widths, McKeldin's flush
          bottom-left corner image and the calculator/paper/pencil cluster
          don't have room to stack the old way without colliding, so on
          mobile the three small doodles are scattered together in the open
          upper-right area instead (smaller too -- w-28, not w-44, purely at
          mobile -- md:w-44 keeps the desktop size exactly as placed).
          Corner-only mask (radial, not the two-edge composite used on
          McKeldin) -- only the top-left tip fades, and only down to 40% of
          its own strength rather than fully transparent, so the image keeps
          roughly even visibility instead of visibly dissolving. */}
      <Image
        src="/illustrations/paper.svg"
        alt=""
        width={230}
        height={340}
        className="pointer-events-none absolute top-8 left-52 -z-10 w-28 rotate-6 opacity-10 md:top-50 md:left-1/2 md:w-44 md:translate-x-35"
        style={{
          maskImage: "radial-gradient(circle at top left, rgba(0,0,0,0.4) 0%, black 40%)",
          WebkitMaskImage: "radial-gradient(circle at top left, rgba(0,0,0,0.4) 0%, black 40%)",
        }}
      />

      {/* Pencil illustration -- same story as the paper above: md: values
          are the hand-placed desktop position, untouched. At mobile, sits
          just below-right of the paper in that same upper-right cluster,
          clear of both the calculator and McKeldin's corner image (checked
          via getBoundingClientRect, not eyeballed). md:w-10 keeps the
          desktop size exactly as placed, since w-8 here is mobile-only.
          Rotated further than before (-rotate-16) so it reads as more
          deliberately tilted. Opposite corner fade (bottom-right, not
          top-left) than the paper so the two don't read as identical
          treatments. */}
      <Image
        src="/illustrations/pencil.svg"
        alt=""
        width={110}
        height={630}
        className="pointer-events-none absolute top-52 left-64 -z-10 w-8 -rotate-16 opacity-10 md:top-[25rem] md:left-1/2 md:w-10 md:translate-x-2"
        style={{
          maskImage: "radial-gradient(circle at bottom right, rgba(0,0,0,0.4) 0%, black 40%)",
          WebkitMaskImage: "radial-gradient(circle at bottom right, rgba(0,0,0,0.4) 0%, black 40%)",
        }}
      />

      {/* McKeldin Library illustration, flush into the bottom-left corner of
          the section -- left unrotated (unlike the calculator) since a
          tilted building reads as wrong in a way a tilted generic icon
          doesn't. width/height match the real SVG aspect ratio (3130:1376).
          Masked with a two-gradient composite (mask-composite: intersect)
          so the top and right edges dissolve into the background instead of
          ending in a hard rectangle -- the left and bottom edges are already
          flush against the actual corner, so they don't need a fade. Because
          the fade hides where the image "ends," it can sit bigger and
          closer into the corner than an unmasked image could without
          crowding the text above it. */}
      <Image
        src="/illustrations/mckeldin.svg"
        alt=""
        width={3130}
        height={1376}
        className="pointer-events-none absolute bottom-0 left-0 -z-10 w-80 opacity-50 md:w-[37rem]"
        style={{
          maskImage:
            "linear-gradient(to right, black 55%, transparent 95%), linear-gradient(to bottom, transparent 0%, black 35%)",
          maskComposite: "intersect",
          WebkitMaskImage:
            "linear-gradient(to right, black 55%, transparent 95%), linear-gradient(to bottom, transparent 0%, black 35%)",
          WebkitMaskComposite: "source-in",
        }}
      />

      <p className="text-sm text-muted-foreground">Unofficial · Not affiliated with the University of Maryland</p>

      {/* font-spicy-rice -- specifically requested by name, loaded via
          next/font/google like the other fonts. Single-weight display font,
          so font-bold doesn't do much here, left in harmlessly. */}
      <h1 className="w-fit max-w-full font-spicy-rice text-4xl font-bold tracking-wider text-foreground md:text-5xl">
        UMD Bill Estimator
      </h1>

      {/* Backdrop-fade glow behind the two left-side content cards, concentrated
          toward their bottom-left corner -- same recipe as the title glow
          (large rounded-full, blurred, --primary token) but a separate div
          since it needs its own position/size to sit behind the cards instead
          of the title. Opacity higher than a first pass at /30, which measured
          as correctly positioned but visually too faint showing through the
          cards' own bg-card/85. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-56 left-0 -z-10 h-64 w-64 rounded-full bg-primary/45 blur-2xl md:top-64 md:left-4"
      />

      {/* Same Card component the preview cards use, for the same white
          background + rounded corners + subtle ring look -- reusing the
          shared component rather than hand-rolling matching classes.
          -ml-4 compensates for the Card's own internal padding so the text
          inside lines up flush with the title's left edge instead of sitting
          indented relative to it. Only applied at md+ -- on mobile the section
          is centered (items-center), not flush-left, so this negative margin
          would just knock the card off-center instead of aligning it with
          anything. bg-card/85 lets the backdrop glow and illustrations show
          through slightly instead of fully opaque white. size="sm" tightens
          the Card's own internal padding (a built-in variant, not a custom
          override). The arbitrary shadow is deliberately asymmetric --
          negative x-offset, positive y-offset -- so it falls toward the
          bottom-left instead of the default even-on-all-sides look, and kept
          small/low-opacity per feedback that it shouldn't be a big shadow. */}
      <Card
        size="sm"
        className="max-w-xs bg-card/85 shadow-[-3px_4px_8px_-3px_rgba(0,0,0,0.18)] md:-ml-4"
      >
        <CardContent className="flex flex-col gap-2">
          <p className="text-base leading-snug font-semibold text-foreground">
            Estimate your total cost at the University of Maryland — tuition, housing, dining, and parking — before
            you commit to anything.
          </p>

          <p className="text-base leading-snug font-semibold text-foreground">
            Tired of digging through a dense Testudo bill breakdown? See it clearly, before you even register.
          </p>
        </CardContent>
      </Card>

      {/* Steps list wrapped in its own matching Card -- same treatment as the
          description Card above so the two read as a pair: max-w-xs, size="sm",
          the bottom-left shadow, tightened text. */}
      <Card
        size="sm"
        className="max-w-xs bg-card/85 shadow-[-3px_4px_8px_-3px_rgba(0,0,0,0.18)] md:-ml-4"
      >
        <CardContent>
          <ol className="flex flex-col gap-1.5 text-base leading-snug font-semibold text-foreground">
            <li>
              <span className="font-bold">1.</span> Pick your tuition, housing, dining, and parking options
            </li>
            <li>
              <span className="font-bold">2.</span> See your total update instantly
            </li>
            <li>
              <span className="font-bold">3.</span> Save it — or just walk away, no account required
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Placement per the rough sketch: near the seam between the two columns,
          vertically centered. Only positioned this way at md+ -- on mobile it's
          just centered in normal document flow. */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row md:absolute md:top-1/2 md:-right-8 md:mt-0 md:-translate-y-1/2 md:flex-col">
        {/* Overriding size="lg"'s default height/padding here rather than
            editing button.tsx -- keeps "lg" generic for buttons elsewhere,
            this is just how big *these two* need to be. */}
        <Button size="lg" className="h-14 px-26 text-base font-bold">
          Try it now
        </Button>
        <Button size="lg" variant="outline" className="h-14 px-26 text-base font-bold">
          Sign In
        </Button>
      </div>
    </section>
  );
}
