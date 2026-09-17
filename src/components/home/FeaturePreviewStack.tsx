import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

// Real screenshots replaced the "Preview coming soon" placeholders. Each is a
// full desktop-width capture of actual app UI (1200-1800px wide), which is
// why these aren't rendered raw inside a rotated card the way a simple
// icon/illustration would be: at card size, tilted, a data table or form
// just reads as noise. Two changes fix that:
//   1. Each image sits in a fixed-aspect-ratio box with object-cover +
//      object-top, cropped to *its own* most representative region (the
//      dashboard's header/tabs, the bill's title/summary, the scenarios
//      list) instead of the whole tall/wide screenshot squeezed to fit.
//   2. Rotation is trimmed from -6/+6 to -3/+3 -- enough to keep the
//      "casually stacked photos" feel the design already established, but
//      subtle enough that on-screen text doesn't visibly warp.
//
// Second sizing pass: cards went from w-64 (256px) to a 320px cap -- a real
// jump this time, per explicit feedback that the first bump (w-60 -> w-64)
// wasn't enough. 320px flat would have overflowed the old 30%-width preview
// column (confirmed by measuring in the browser), so page.tsx's grid split
// moved from 7fr_3fr to 3fr_2fr (70/30 -> 60/40) to give this column real
// room to hold the bigger cards -- see the comment there. Vertical spacing
// between cards was pulled apart the same way: each card's top offset now
// clears the previous card's actual rendered height (image + label bar) with
// margin, instead of overlapping into it, and the stack's container height
// grew (36rem -> 66rem, later 66rem -> 70rem alongside the Bill Page/Saved
// Scenarios gap bump below) to match. Both measured against the live
// rendered card heights in the browser, not computed blind.
//
// Card width itself is w-[min(20rem,calc(100vw-4rem))], not a flat w-80 --
// a flat 320px card overflows the viewport horizontally below ~370px wide
// (confirmed in the browser at 320px, a real if now uncommon phone width:
// the rotated card's bounding box ran ~30px past the right edge). The
// calc() caps it at 320px everywhere the column has room (which is every
// breakpoint this section's mobile layout actually needs to worry about --
// the two-column desktop split doesn't kick in until lg, where 100vw is
// always comfortably over 20rem), and shrinks it to fit on anything
// narrower, using the same 4rem total horizontal budget as the section's
// own mobile px-6 padding (1.5rem each side) plus slack for the ±3deg
// rotation's overhang.
//
// Titles changed from the old placeholder set (Housing/Dining/Parking) to
// match what these three screenshots actually show -- Dashboard, Bill Page,
// Saved Scenarios -- since a real screenshot under a mismatched label would
// be more confusing than no label at all. Each title now sits in a solid
// bg-primary bar across the bottom of the card (the same --primary token as
// the Hero's "Try it now" button, text-primary-foreground on top of it for
// contrast) instead of plain text, so it reads as a deliberate label rather
// than a caption.
//
// Each Card's rotate/translate/z-index is written out explicitly (not built
// from a data array) specifically so Tailwind's build-time class scanner can
// see every class name as a literal string in this file. A dynamically
// constructed class name (e.g. `rotate-${n}`) wouldn't reliably get picked up.
//
// Edge fades (desktop only): a CSS mask-image on the *section* itself fades
// its right edge to transparent (a wide ~20% band) and its left edge to
// transparent too (a shorter ~18% band, at the seam with the Hero column --
// sized to actually reach where the cards start, not just fade empty
// section padding, see the inline comment below). lg:-prefixed only,
// matching the breakpoint where the two-column layout itself turns on --
// below that, the section is a single centered mobile column and the mask
// doesn't apply.
//
// The cards themselves stay left-anchored (left-0, same position as always)
// and grow wider at lg/xl/2xl instead of being translated rightward as a
// block -- per explicit feedback that "extend the cards" meant grabbing the
// right edge and stretching it, not repositioning the whole stack. Each
// image's wrapper uses a fixed height (h-60/h-80/h-40, matching what it
// rendered at the original 20rem card width) instead of an aspect-ratio box,
// so growing the Card's own width only pushes the right edge further right
// -- height never changes with it. See the inline comment on the card-stack
// div for the actual width values and how they were measured against each
// breakpoint's real available space.
export function FeaturePreviewStack() {
  return (
    // Vertical gradient on mobile (stacked layout -- the "seam" is the top
    // edge of this section, not a side, so the fade runs top-to-bottom
    // instead of left-to-right). Starts at plain background so it blends
    // seamlessly with whatever's above (Hero, which is unstyled/white),
    // reaches the tint by 20% down, holds it for the rest of the section --
    // same shape as the desktop gradient, just rotated 90 degrees.
    // At lg+, the parent grid's left-to-right gradient takes over instead --
    // this goes transparent so that one shows through undisturbed. lg:, not
    // md: -- kept in sync with page.tsx's grid breakpoint (see that file for
    // why the two-column split itself was pushed from md to lg).
    // lg:bg-none, not lg:bg-transparent -- the mobile gradient sets
    // background-image, and bg-transparent only clears background-color, a
    // separate CSS sub-property. Without bg-none here, this section's own
    // vertical gradient kept painting over the parent's horizontal one at
    // lg+, which is exactly what broke the desktop gradient last round.
    <section className="flex items-center justify-center overflow-x-clip bg-gradient-to-b from-background to-primary/15 to-20% px-6 py-16 lg:bg-none lg:px-12 lg:[mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_80%,transparent_100%)] lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_80%,transparent_100%)]">
      {/* Right-edge fade lives on the *section* itself, not a narrow wrapper
          around the card stack -- a first attempt put mask-image + overflow
          on a wrapper sized to just the (320px) card column, but that column
          is centered well inside the section with real padding on both
          sides, so its own right edge sits ~60-100px short of the section's
          actual edge (confirmed with getBoundingClientRect in the browser).
          The fade ended up dissolving into empty space well before the real
          screen edge instead of reading as the cards themselves fading into
          it. Applying it to the full-width section instead means the fade's
          75-100% band lands right at the section's true right edge -- which,
          per layout.tsx, has no page-level max-width wrapping it, so at lg+
          that's also the actual browser window edge. overflow-x-clip (not
          lg:overflow-hidden) so the mobile stacked layout below lg never has
          horizontal clipping applied to it -- x-only, and un-prefixed since
          it's harmless at any width (nothing overflows horizontally on
          mobile in the first place). */}
      {/* Left-edge fade: a 0-18% transparent-to-black ramp on the same
          gradient, shorter than the right fade's 20%-wide (80-100%) band --
          this is the seam where the cards column meets the Hero text
          column, so it only needs to soften the join, not dissolve the
          cards themselves. 18%, not a smaller number, because the cards are
          centered well inside this section (per the right-edge fade's own
          note above on why a narrower wrapper doesn't work) -- measured via
          getBoundingClientRect that the cards' left edge sits ~20% into the
          section's width, so a shorter ramp was fading empty padding
          instead of ever reaching real card content. Same lg: prefix as
          everything else here, so mobile's single centered column (no side
          it's "meeting" anything at) stays completely untouched. */}
      {/* Every card sits at left-0 -- no horizontal stagger (see file-header
          note on why that was dropped), and no rightward translate on the
          container either -- the stack stays exactly where it's always
          centered by the section's flex layout. Rotation still alternates
          -3/+3/-3 -- a repeating zigzag, not random tilts -- and each card's
          fixed height (h-60/h-80/h-40 below) varies enough that the stack
          still reads as a loose pile, not a rigid grid. */}
      {/* transition-transform + hover:-translate-y-2 gives each card a small
          lift on hover; hover:z-40 (above all three base z-indexes) so the
          lifted card always comes to the front instead of sliding behind
          whichever neighbor already has a higher base z-index. */}
      {/* lg:w-[24rem] xl:w-[30rem] 2xl:w-[36rem] on each Card below -- the
          actual "extend to the right" growth, on top of the mobile-safe
          w-[min(20rem,calc(100vw-4rem))] base. Each step was checked live
          against document.documentElement.scrollWidth and the cards' own
          right edge at that breakpoint's real viewport (1024/1280/1440/1920)
          -- 26rem/32rem alone reached past the true right edge through xl,
          but fell ~35-40px short again at 1920 since this column is a
          *percentage* of viewport width (page.tsx's 3fr_2fr split) while a
          flat rem width isn't, so 2xl:40rem was added to keep pace at wider
          screens too. Safe to keep growing purely horizontally because each
          image box below uses a fixed height (h-60/h-80/h-40), not an
          aspect-ratio -- width has no effect on card height. */}
      <div className="relative h-[52rem] w-full max-w-xs">
        <Card
          size="sm"
          className="absolute top-0 left-0 z-30 w-[min(20rem,calc(100vw-4rem))] -rotate-3 gap-2 overflow-hidden py-0 transition-transform duration-300 hover:-translate-y-2 hover:z-40 hover:shadow-lg lg:w-[24rem] xl:w-[30rem] 2xl:w-[36rem]"
        >
          {/* h-60 (240px) is what dashboardPic.png's aspect-[4/3] box used to
              render at the original 20rem card width -- kept as a fixed
              height rather than an aspect-ratio specifically so the width
              growth above doesn't grow this card's height too (per explicit
              feedback: wider, not taller). object-cover now shows more of
              the screenshot's width at that same height as the box gets
              wider, which reads as less cropped, not distorted. object-top
              keeps the header/tabs/progress bar (the part that reads as "a
              real app") in frame instead of centering on the middle of the
              page. scale-125 origin-top-left zooms in on top of that crop
              specifically so the title/tab bar is actually legible at card
              size instead of reading as a thin gray strip -- origin-top-left
              (not the default center) anchors the zoom to the top-*left*
              corner specifically because the tab bar's leftmost item
              ("Major", the active/highlighted one) and the title both start
              at the left edge; a center-origin zoom was cropping exactly
              that tab off while keeping less-important trailing tabs like
              "Aid & Grants" in frame (confirmed in the browser). Extra
              magnification now eats into the right and bottom instead.
              overflow-hidden on this wrapper (not just relying on the
              Card's own) is what clips the scaled image to exactly this box
              instead of bleeding down into the label bar. */}
          <div className="relative h-40 w-full overflow-hidden">
            <Image
              src="/illustrations/dashboardPic.png"
              alt="UMD Bill Estimator dashboard, showing the major/tuition/housing selection tabs and a running cost breakdown"
              fill
              sizes="(min-width: 1024px) 680px, 320px"
              className="scale-125 origin-top-left -translate-y-2 object-cover object-top"
            />
          </div>
          {/* bg-primary + text-primary-foreground -- the exact same token
              pair as the Hero "Try it now" button's default variant (see
              button.tsx), so the label reads as deliberately matching it
              rather than a coincidentally similar blue. */}
          <CardContent className="bg-primary py-3 text-base font-semibold text-primary-foreground">
            Dashboard
          </CardContent>
        </Card>

        <Card
          size="sm"
          className="absolute top-[17.5rem] left-0 z-20 w-[min(20rem,calc(100vw-4rem))] rotate-3 gap-2 overflow-hidden py-0 transition-transform duration-300 hover:-translate-y-2 hover:z-40 hover:shadow-lg lg:w-[24rem] xl:w-[30rem] 2xl:w-[36rem]"
        >
          {/* h-80 (320px) is what BillPagePic.png's aspect-square box used
              to render at the original 20rem card width -- fixed height, not
              aspect-ratio, for the same reason as the Dashboard card above
              (width grows, height doesn't). scale-125 origin-top-left zooms
              into that same top region --
              the "UMD Bill Estimator" title plus "Your selections" -- since
              a near-square screenshot barely cropped by object-cover alone
              still renders every line of body text too small to read at
              320px wide. origin-top-left, not center -- the title and every
              label in this screenshot are left-aligned starting near the
              image's left edge, so a center-origin zoom was clipping the
              "UM" off "UMD Bill Estimator" while keeping empty right-side
              margin in frame (confirmed in the browser). Trades the Total
              line and the right-hand value column (further down/right on
              the page) for a legible, uncropped title, which is the more
              identifiable "this is the bill page" signal at a glance. */}
          <div className="relative h-56 w-full overflow-hidden">
            <Image
              src="/illustrations/BillPagePic.png"
              alt="Printable UMD Bill Estimator summary page, showing selections and a full cost breakdown"
              fill
              sizes="(min-width: 1024px) 680px, 320px"
              className="scale-125 origin-top-left -translate-y-2 object-cover object-top"
            />
          </div>
          <CardContent className="bg-primary py-3 text-base font-semibold text-primary-foreground">
            Bill Page
          </CardContent>
        </Card>

        <Card
          size="sm"
          className="absolute top-[39rem] left-0 z-10 w-[min(20rem,calc(100vw-4rem))] -rotate-3 gap-2 overflow-hidden py-0 transition-transform duration-300 hover:-translate-y-2 hover:z-40 hover:shadow-lg lg:w-[24rem] xl:w-[30rem] 2xl:w-[36rem]"
        >
          {/* top-[54rem], not top-[52rem] -- a little extra clearance below
              the Bill Page card since -3deg/+3deg rotation swells each
              card's actual on-screen bounding box a few pixels past its
              unrotated edges, and this card's rotation direction tips its
              top-left corner up toward the Bill Page card's bottom-left
              corner, right where they'd be closest. Confirmed with
              getBoundingClientRect in the browser at lg/xl/1440/1920 -- both
              cards use a fixed height (not aspect-ratio, see the width-growth
              comment above), so this gap stays consistent at every
              breakpoint rather than shrinking as cards get wider. */}
          {/* h-40 (160px) is what savedScenariosPic.png's aspect-[2/1] box
              used to render at the original 20rem card width -- fixed height
              for the same reason as the other two cards. scale-125 with
              the default (center) transform-origin, not origin-top like the
              other two cards -- there's barely any vertical crop headroom
              here to sacrifice, so the zoom is left free to eat evenly off
              all four sides, which lands squarely on the "Saved Scenarios"
              title and the estimate rows instead of pushing them toward an
              edge. */}
          <div className="relative h-28 w-full overflow-hidden">
            <Image
              src="/illustrations/savedScenariosPic.png"
              alt="Saved Scenarios list, showing previously saved bill estimates with their totals"
              fill
              sizes="(min-width: 1024px) 680px, 320px"
              className="scale-125 -translate-y-2 object-cover object-top"
            />
          </div>
          <CardContent className="bg-primary py-3 text-base font-semibold text-primary-foreground">
            Saved Scenarios
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
