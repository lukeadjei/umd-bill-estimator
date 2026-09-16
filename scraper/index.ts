import { runScrape } from "./runScrape";

// Thin CLI wrapper -- argv parsing and process.exit are CLI-specific
// concerns, not something the Lambda handler needs (or could even use --
// Lambda has no argv, and calling process.exit() inside a Lambda would kill
// the whole execution environment). The actual scraping logic lives in
// runScrape.ts, shared by both entry points.
async function main() {
  const academicYearId = process.argv[2];
  if (!academicYearId) {
    console.error("Usage: npm run scrape -- <academic_year_id>");
    process.exit(1);
  }

  await runScrape(academicYearId);
}

main().catch((error) => {
  console.error("Scrape failed:", error);
  process.exit(1);
});
