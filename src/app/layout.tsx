import type { Metadata } from "next";
import { Nunito, Playfair_Display, Spicy_Rice } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

// Nunito's rounded terminals read as warm/approachable -- picked specifically
// for the "friendly" feel, used for both headings and body text rather than
// pairing two families, to keep it simple and cohesive.
// Variable name matters here: globals.css's --font-sans expects exactly this
// name -- a mismatch here is what silently broke the font before (it was
// defined as --font-geist-sans, which nothing referenced).
const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
});

// A real, deliberate serif for the headline specifically -- close in spirit to
// the accidental browser-default serif from before the font bug was fixed,
// but an actual chosen font this time, used only where font-heading is applied.
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

// Requested by name for the H1 title specifically -- loaded via next/font/google
// (self-hosted at build time) rather than the raw <link> tags Google Fonts
// gives you, since that's what the rest of the project's fonts already do:
// no runtime request to Google's CDN, no layout shift while it loads.
// Spicy Rice only ships one weight (400), so no variable-weight config needed.
const spicyRice = Spicy_Rice({
  variable: "--font-spicy-rice",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "UMD Bill Estimator",
  description: "Unofficial cost estimator for the University of Maryland -- tuition, housing, dining, and parking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${playfairDisplay.variable} ${spicyRice.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* flex-1 here is what makes the Footer stick to the bottom even on
            short pages -- this element grows to fill any leftover height,
            pushing the footer down instead of leaving it floating mid-page. */}
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
