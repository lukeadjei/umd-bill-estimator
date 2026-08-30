import { fetchAndLoad } from "./fetchHtml";
import { parseDollarAmount } from "./parseUtils";
import type { HousingRatesPageData, ScrapedHousingRate } from "./types";

const URL = "https://reslife.umd.edu/apply-housing/rates-terms";

export async function fetchHousingRatesPage(): Promise<HousingRatesPageData> {
  const $ = await fetchAndLoad(URL);

  // Two tables on this page share the exact same header structure: the
  // current year's rates and the prior year's (shown for comparison). UMD
  // lists the current year first -- this relies on that ordering, since the
  // only other distinguishing signal is the preceding heading text, which
  // embeds the specific year (e.g. "Fall 2026 and Spring 2027") and can't be
  // hardcoded without breaking every year.
  const table = $("table")
    .filter((_, el) => {
      const headers = $(el).find("thead th");
      return headers.eq(0).text().trim() === "Room Type" && headers.eq(1).text().trim() === "Traditional Without AC";
    })
    .first();

  const buildingCategories = table
    .find("thead th")
    .slice(1)
    .map((_, el) => $(el).text().trim())
    .get();

  const housingRates: ScrapedHousingRate[] = [];
  table.find("tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    const roomType = cells.eq(0).text().trim();
    buildingCategories.forEach((buildingCategory, i) => {
      const cellText = cells.eq(i + 1).text().trim();
      // "None" means that room type x building category combination doesn't
      // exist -- no row for it, not a $0 rate.
      if (cellText === "None") return;
      housingRates.push({ roomType, buildingCategory, rate: parseDollarAmount(cellText) });
    });
  });

  return { housingRates };
}
