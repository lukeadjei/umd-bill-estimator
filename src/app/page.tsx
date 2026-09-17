import { FeaturePreviewStack } from "@/components/home/FeaturePreviewStack";
import { Hero } from "@/components/home/Hero";

export default function Home() {
  // grid-cols-1 by default (stacked, full width each) -- only becomes the
  // side-by-side split at lg and wider.
  //
  // lg:, not md: -- with real screenshots in FeaturePreviewStack's cards
  // (previously just short placeholder text), a narrow column is too tight
  // to hold a legible card between roughly 768-1023px: confirmed by
  // measuring actual overflow in the browser at those widths. Pushing the
  // split to lg (1024) keeps the single-column stacked layout through that
  // whole cramped range instead of visibly clipping cards, and only
  // switches to side-by-side once there's actually enough room for the
  // narrow column to work with.
  //
  // Split changed from 7fr_3fr to 3fr_2fr (70/30 -> 60/40) specifically to
  // give the preview cards noticeably more room -- per explicit feedback
  // that the previous card-size bump (w-60 -> w-64) was too small a second
  // time around, w-64 -> w-80 needed real column width to back it up.
  // Verified in the browser at 1024/1280/1440/1920 that Hero's own content
  // (text column + the two absolutely-positioned buttons pinned to
  // md:-right-8) still has enough room at 60% and doesn't collide with the
  // cards column.
  //
  // The gradient lives on this shared parent, not on either column, so it can
  // blend continuously across the seam instead of two solid colors meeting at
  // a hard edge. Only active at lg+ -- FeaturePreviewStack keeps its own
  // solid background below that, which is what actually paints on mobile.
  // Tinting toward primary (not muted gray) so the shift is actually
  // noticeable. Starts at 70% -- close to where the cards column begins,
  // per feedback that 40% made the shift happen too early/gradually.
  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[3fr_2fr] lg:bg-gradient-to-r lg:from-background lg:from-70% lg:to-primary/15">
      <Hero />
      <FeaturePreviewStack />
    </div>
  );
}
