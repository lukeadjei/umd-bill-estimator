import type { CheerioAPI } from "cheerio";
import { fetchAndLoad } from "./fetchHtml";
import { parseDollarAmount, parseLeadingInteger } from "./parseUtils";
import type { ScrapedWinterTuitionRate, WinterSessionPageData } from "./types";

const URL = "https://exst.umd.edu/current-incoming-and-former-umd-students/winter-session/tuition-and-fees";

// Both tables on this page start with a "Student Type" header, so
// findTableByFirstHeader can't tell them apart -- identify each by a header
// only it has instead.
function findTableWithHeader($: CheerioAPI, headerText: string) {
  const wanted = headerText.trim().toLowerCase();
  const table = $("table")
    .filter((_, el) =>
      $(el)
        .find("th")
        .toArray()
        .some((th) => $(th).text().trim().toLowerCase().startsWith(wanted))
    )
    .first();
  if (table.length === 0) throw new Error(`Winter page: could not find a table with a "${headerText}" header`);
  return table;
}

// Exact comparison on purpose -- "non-resident" contains "resident".
function parseResidency(text: string): "resident" | "non_resident" {
  const normalized = text.trim().toLowerCase();
  if (normalized === "resident") return "resident";
  if (normalized === "non-resident") return "non_resident";
  throw new Error(`Winter page: unrecognized residency "${text}"`);
}

// The chart's columns are "Rate for 1 credit", "Rate for 2 credits", ... --
// the credit count comes from each header, not from column position, so a
// column UMD adds or reorders can't silently shift prices onto the wrong count.
function parseTuitionTable($: CheerioAPI) {
  const table = findTableWithHeader($, "Residency Classification");

  const creditColumns: { index: number; creditHours: number }[] = [];
  table
    .find("th")
    .each((index, th) => {
      const text = $(th).text();
      if (/^\s*rate for/i.test(text)) creditColumns.push({ index, creditHours: parseLeadingInteger(text) });
    });
  if (creditColumns.length === 0) throw new Error('Winter page: no "Rate for N credit(s)" columns found');

  const undergraduateTuition: ScrapedWinterTuitionRate[] = [];
  const graduateTuition: ScrapedWinterTuitionRate[] = [];

  table.find("tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length === 0) return; // header row
    const studentType = cells.eq(0).text().trim().toLowerCase();
    const target =
      studentType === "undergraduate" ? undergraduateTuition : studentType === "graduate" ? graduateTuition : null;
    if (!target) throw new Error(`Winter page: unrecognized student type "${cells.eq(0).text().trim()}"`);

    const residency = parseResidency(cells.eq(1).text());
    for (const { index, creditHours } of creditColumns) {
      target.push({ residency, creditHours, price: parseDollarAmount(cells.eq(index).text()) });
    }
  });

  return { undergraduateTuition, graduateTuition };
}

// Every level x residency must have exactly the same contiguous credit counts
// 1..N -- a missing/duplicated/renamed column would otherwise only surface
// later as a runtime lookup failure on a real student's estimate.
function assertCompleteChart(label: string, rates: ScrapedWinterTuitionRate[]) {
  for (const residency of ["resident", "non_resident"] as const) {
    const counts = rates
      .filter((rate) => rate.residency === residency)
      .map((rate) => rate.creditHours)
      .sort((a, b) => a - b);
    if (counts.length === 0) throw new Error(`Winter page: no ${label} ${residency} tuition row`);
    counts.forEach((count, i) => {
      if (count !== i + 1) throw new Error(`Winter page: ${label} ${residency} credit counts are not 1..N: ${counts.join(",")}`);
    });
  }
  const sizes = new Set(["resident", "non_resident"].map((r) => rates.filter((x) => x.residency === r).length));
  if (sizes.size !== 1) throw new Error(`Winter page: ${label} residencies list a different number of credit counts`);
}

function parseFees($: CheerioAPI) {
  const table = findTableWithHeader($, "Category");
  let campusServicesRate: number | null = null;
  let distanceLearningRate: number | null = null;

  table.find("tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length === 0) return;
    const category = cells.eq(2).text().trim().toLowerCase();
    const rate = parseDollarAmount(cells.eq(3).text());
    if (category.includes("campus services")) campusServicesRate = rate;
    else if (category.includes("distance learning")) distanceLearningRate = rate;
  });

  if (campusServicesRate === null) throw new Error("Winter page: Winter Campus Services Fee row not found");
  if (distanceLearningRate === null) throw new Error("Winter page: Winter Distance Learning Fee row not found");
  return { campusServicesRate, distanceLearningRate };
}

export async function fetchWinterSessionPage(): Promise<WinterSessionPageData> {
  const $ = await fetchAndLoad(URL);

  const { undergraduateTuition, graduateTuition } = parseTuitionTable($);
  assertCompleteChart("undergraduate", undergraduateTuition);
  assertCompleteChart("graduate", graduateTuition);

  return { undergraduateTuition, graduateTuition, fees: parseFees($) };
}
