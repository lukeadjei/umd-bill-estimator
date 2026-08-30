import type { CheerioAPI, Cheerio } from "cheerio";
import type { Element } from "domhandler";

// Several UMD pages have tables with no distinguishing class/id at all --
// this finds one by its first header cell's exact text (case-insensitive).
// Exact match, not .includes(), specifically because "NON-RESIDENT TUITION"
// contains "RESIDENT TUITION" as a substring.
export function findTableByFirstHeader($: CheerioAPI, scope: Cheerio<Element>, headerText: string): Cheerio<Element> {
  const normalized = headerText.trim().toUpperCase();
  const table = scope
    .find("table")
    .filter((_, el) => $(el).find("th").first().text().trim().toUpperCase() === normalized)
    .first();
  if (table.length === 0) throw new Error(`Could not find a table with first header "${headerText}"`);
  return table;
}

// For tables with no <th> at all (just plain <td> "header" rows) -- finds a
// row by its first cell's text containing (not equaling) the given text,
// since row labels sometimes carry extra content (asterisks, embedded links)
// beyond the plain label.
export function findRowByFirstCellContaining($: CheerioAPI, table: Cheerio<Element>, text: string): Cheerio<Element> {
  const normalized = text.toUpperCase();
  const row = table
    .find("tr")
    .filter((_, el) => $(el).find("td").first().text().trim().toUpperCase().includes(normalized))
    .first();
  if (row.length === 0) throw new Error(`Could not find a row whose first cell contains "${text}"`);
  return row;
}
