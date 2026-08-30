import { findTableByFirstHeader } from "./cheerioUtils";
import { fetchAndLoad } from "./fetchHtml";
import { parseDollarAmount, parseLeadingInteger } from "./parseUtils";
import type { BlockDiningPlansPageData, ScrapedBlockDiningPlan } from "./types";

const URL = "https://dining.umd.edu/students/connector-plans";

export async function fetchBlockDiningPlansPage(): Promise<BlockDiningPlansPageData> {
  const $ = await fetchAndLoad(URL);

  const table = findTableByFirstHeader($, $("body"), "Option");

  const plans: ScrapedBlockDiningPlan[] = table
    .find("tbody tr")
    .map((_, row): ScrapedBlockDiningPlan => {
      const cells = $(row).find("td");
      // "Option" cells are a verbose quote, e.g. `1: "I love to cook, but
      // some days I'm busy"` -- using the part before the colon (UMD's own
      // option number/label, e.g. "1" or "Combo") rather than the full quote.
      const optionText = cells.eq(0).text().trim();
      const planLabel = optionText.split(":")[0].trim();

      // "Meals" cells are usually just "25 meals", but the Combo row reads
      // "70 meals + 250 Dining Dollars" -- both numbers need pulling out of
      // one cell.
      const mealsText = cells.eq(1).text().trim();
      const diningDollarsMatch = mealsText.match(/(\d+)\s*Dining Dollars/i);

      return {
        planLabel,
        mealCount: parseLeadingInteger(mealsText),
        diningDollars: diningDollarsMatch ? Number(diningDollarsMatch[1]) : 0,
        price: parseDollarAmount(cells.eq(2).text()),
      };
    })
    .get();

  return { plans };
}
