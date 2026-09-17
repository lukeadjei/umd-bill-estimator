import type { Metadata } from "next";
import { Nunito, Playfair_Display, Spicy_Rice } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
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

// metadataBase makes the openGraph image URL below resolve to an absolute
// https://umd-bill-estimator.vercel.app/... URL instead of a relative one --
// required for social platforms (which fetch this page from their own
// servers, with no concept of "relative to this site") to actually load it.
const SITE_URL = "https://umd-bill-estimator.vercel.app";

export const metadata: Metadata = {
  title: "UMD Bill Estimator",
  description: "Unofficial cost estimator for the University of Maryland -- tuition, housing, dining, and parking.",
  metadataBase: new URL(SITE_URL),
  // Without this, a link to this site pasted into iMessage/Slack/Discord/
  // LinkedIn shows as bare text with no preview card -- these two blocks are
  // what those platforms actually read to build one. Reusing the Dashboard
  // preview card's own screenshot (the same image used on the homepage)
  // rather than commissioning a separate designed asset -- real dimensions
  // (1768x1360) declared explicitly so platforms don't have to guess/crop
  // blind.
  openGraph: {
    title: "UMD Bill Estimator",
    description: "Unofficial cost estimator for the University of Maryland -- tuition, housing, dining, and parking.",
    url: SITE_URL,
    siteName: "UMD Bill Estimator",
    images: [{ url: "/illustrations/dashboardPic.png", width: 1768, height: 1360 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UMD Bill Estimator",
    description: "Unofficial cost estimator for the University of Maryland -- tuition, housing, dining, and parking.",
    images: ["/illustrations/dashboardPic.png"],
  },
};

// Dark mode activation.
//
// globals.css already ships a complete `.dark { ... }` palette (part of the
// original shadcn scaffold) and every `dark:` utility class in this app only
// activates when a `.dark` class is present on an ancestor. A manual choice
// made via ThemeToggle (src/components/layout/ThemeToggle.tsx) is persisted
// to localStorage and takes priority; only when no manual choice has ever
// been made do we fall back to the OS/browser `prefers-color-scheme`.
//
// Why an inline <script> instead of a React useEffect: useEffect runs after
// the first paint, so for a split second the page would render in the wrong
// theme and then flip -- a visible flash. An inline script in <head> runs
// synchronously before the browser paints anything, so the class is already
// correct on the very first frame. This is the standard "no flash of wrong
// theme" pattern for statically-rendered Next.js App Router pages.
const THEME_INIT_SCRIPT = `
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${playfairDisplay.variable} ${spicyRice.variable} h-full antialiased`}
      // The inline script below adds/omits the "dark" class before React
      // hydrates, based on localStorage/a browser API the server can't know
      // about -- without this, React would log a (harmless but noisy)
      // hydration mismatch warning purely because of that class attribute.
      suppressHydrationWarning
    >
      <head>
        {/* Deliberately a plain synchronous <script>, not next/script --
            it must run before paint (see THEME_INIT_SCRIPT above), which
            next/script's async-by-default loading can't guarantee here. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Rendered once here so it appears on every page (home, dashboard,
            settings, privacy, sign-in, about, 404, results) without each
            page having to include it individually. print:hidden lives on
            the button itself too, matching Footer's own convention, so it
            never shows up on the printed bill document. */}
        <ThemeToggle />
        {/* flex-1 here is what makes the Footer stick to the bottom even on
            short pages -- this element grows to fill any leftover height,
            pushing the footer down instead of leaving it floating mid-page. */}
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
