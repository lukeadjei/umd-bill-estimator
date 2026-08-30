import { findTableByFirstHeader } from "./cheerioUtils";
import { fetchAndLoad } from "./fetchHtml";
import { parseDollarAmount } from "./parseUtils";
import type { ResidentDiningPlansPageData, ScrapedResidentDiningPlan } from "./types";

const URL = "https://dining.umd.edu/students/resident-plans";

export async function fetchResidentDiningPlansPage(): Promise<ResidentDiningPlansPageData> {
  const $ = await fetchAndLoad(URL);

  const table = findTableByFirstHeader($, $("body"), "Resident Dining");

  const plans: ScrapedResidentDiningPlan[] = table
    .find("tbody tr")
    .map((_, row): ScrapedResidentDiningPlan => {
      const cells = $(row).find("td");
      // Column order: [name, Dining Dollars, Guest Passes, Fall price, Spring
      // price, price above base, savings %]. Only the first five are source
      // data -- the last two are derived from the others, deliberately not stored.
      const diningDollarsText = cells.eq(1).text().trim();
      return {
        planName: cells.eq(0).text().trim(),
        // Base plan shows "-" instead of a number, meaning 0.
        diningDollars: diningDollarsText === "-" ? 0 : Number(diningDollarsText),
        guestPasses: Number(cells.eq(2).text().trim()),
        fallPrice: parseDollarAmount(cells.eq(3).text()),
        springPrice: parseDollarAmount(cells.eq(4).text()),
      };
    })
    .get();

  return { plans };
}
