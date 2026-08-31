import { FeaturePreviewStack } from "@/components/home/FeaturePreviewStack";
import { Hero } from "@/components/home/Hero";

export default function Home() {
  // grid-cols-1 by default (stacked, full width each) -- only becomes the
  // 70/30 side-by-side split at md and wider.
  //
  // The gradient lives on this shared parent, not on either column, so it can
  // blend continuously across the seam instead of two solid colors meeting at
  // a hard edge. Only active at md+ -- FeaturePreviewStack keeps its own
  // solid background below that, which is what actually paints on mobile.
  // Tinting toward primary (not muted gray) so the shift is actually
  // noticeable. Starts at 70% -- close to where the cards column begins,
  // per feedback that 40% made the shift happen too early/gradually.
  return (
    <div className="grid flex-1 grid-cols-1 md:grid-cols-[7fr_3fr] md:bg-gradient-to-r md:from-background md:from-70% md:to-primary/15">
      <Hero />
      <FeaturePreviewStack />
    </div>
  );
}
