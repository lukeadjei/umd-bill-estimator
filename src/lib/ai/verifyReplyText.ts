const DOLLAR_AMOUNT_PATTERN = /\$[\d,]+(?:\.\d{1,2})?/g;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\([^)]*\)/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\([^)]*\)/g;
const BARE_URL_PATTERN = /https?:\/\/\S+/g;

// Photos/links are ALWAYS rendered separately via a tool's structured result
// (ImageLightbox for getHousingPhotos, a scenario card for evaluateBudget) --
// there's no legitimate case for a raw URL or markdown link/image sitting in
// the chat text itself, so this strips them from EVERY reply unconditionally,
// regardless of which tool ran. Markdown links keep their link TEXT (e.g.
// "[Traditional dorm](url)" -> "Traditional dorm"), since that's usually a
// real, readable word the model meant to say; images and bare URLs are
// dropped outright, they have no meaningful text fallback.
export function stripLinksAndImages(text: string): string {
  return text
    .replace(MARKDOWN_IMAGE_PATTERN, "")
    .replace(MARKDOWN_LINK_PATTERN, "$1")
    .replace(BARE_URL_PATTERN, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

// Dollar amounts the STUDENT typed themselves are safe for the model to
// restate -- that's transcription, not computation, same category grant
// amounts already fall into (CLAUDE.md precedent). Used to extend the
// verified set with whatever the student's own message already stated (e.g.
// "$8,000 budget"), so the model can acknowledge it while asking for missing
// fields without tripping the check below.
export function extractDollarAmounts(text: string): number[] {
  const matches = text.match(DOLLAR_AMOUNT_PATTERN);
  if (!matches) return [];
  return matches.map((match) => Number(match.replace(/[$,]/g, "")));
}

// True if every dollar-amount-looking substring in `text` matches one of the
// REAL numbers a tool actually computed (compared in cents to avoid float
// drift). An empty verifiedAmounts list means "no tool produced any dollar
// figure this turn" -- so ANY dollar amount at all fails the check. This is
// the generalized, always-on version of CLAUDE.md rule 1: the model may
// relay a real number evaluateBudget just computed, but may never state,
// estimate, or round a dollar figure of its own, in any reply, ever.
export function replyDollarAmountsAreVerified(text: string, verifiedAmounts: number[]): boolean {
  const matches = text.match(DOLLAR_AMOUNT_PATTERN);
  if (!matches) return true;

  const verifiedCents = new Set(verifiedAmounts.map((amount) => Math.round(amount * 100)));
  return matches.every((match) => {
    const parsed = Number(match.replace(/[$,]/g, ""));
    return verifiedCents.has(Math.round(parsed * 100));
  });
}
