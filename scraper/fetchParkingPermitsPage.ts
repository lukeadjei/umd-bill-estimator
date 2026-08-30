import {
  COMMUTER_PARKING_PERMIT_TYPE,
  OVERNIGHT_STORAGE_PARKING_PERMIT_TYPE,
  RESIDENT_PARKING_PERMIT_TYPE,
} from "@/lib/calculator/constants";
import { fetchAndLoad } from "./fetchHtml";
import { parseDollarAmount } from "./parseUtils";
import type { ParkingPermitsPageData, ScrapedParkingPermit } from "./types";

const URL = "https://transportation.umd.edu/parking/students/fees-and-permit-types";

const TERM_LABELS: Record<string, ScrapedParkingPermit["term"]> = {
  annual: "annual",
  "fall only": "fall",
  "spring only": "spring",
  "summer only": "summer",
};

export async function fetchParkingPermitsPage(): Promise<ParkingPermitsPageData> {
  const $ = await fetchAndLoad(URL);

  // No <thead> -- header row is a plain <td> row, and this table shares its
  // "table" class with several unrelated refund-schedule tables further down
  // the page, so it's identified by its first cell's text instead.
  const table = $("table")
    .filter((_, el) => $(el).find("tbody tr").first().find("td").first().text().trim() === "Academic Term")
    .first();

  const permits: ScrapedParkingPermit[] = [];
  table
    .find("tbody tr")
    .slice(1) // skip the header-like first row
    .each((_, row) => {
      const cells = $(row).find("td");
      const termLabel = cells.eq(0).text().trim().toLowerCase();
      const term = TERM_LABELS[termLabel];
      if (!term) throw new Error(`Unrecognized parking term label: "${termLabel}"`);

      // Column order: [Academic Term, Resident Student, Overnight Storage Parking, Commuter Student, Expiration Date]
      permits.push({ permitType: RESIDENT_PARKING_PERMIT_TYPE, term, price: parseDollarAmount(cells.eq(1).text()) });
      permits.push({
        permitType: OVERNIGHT_STORAGE_PARKING_PERMIT_TYPE,
        term,
        price: parseDollarAmount(cells.eq(2).text()),
      });
      permits.push({ permitType: COMMUTER_PARKING_PERMIT_TYPE, term, price: parseDollarAmount(cells.eq(3).text()) });
    });

  return { permits };
}
