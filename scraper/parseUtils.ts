// Shared helpers for pulling numbers out of loosely-structured page text --
// UMD's pages are mostly hand-authored rich text, not clean data tables, so
// this is regex-based extraction rather than reading isolated cell values.

export function parseDollarAmount(text: string): number {
  const match = text.match(/\$([\d,]+\.?\d*)/);
  if (!match) throw new Error(`Could not parse a dollar amount from: "${text}"`);
  return Number(match[1].replace(/,/g, ""));
}

export function parseLeadingInteger(text: string): number {
  const match = text.match(/(\d+)/);
  if (!match) throw new Error(`Could not parse a leading integer from: "${text}"`);
  return Number(match[1]);
}
