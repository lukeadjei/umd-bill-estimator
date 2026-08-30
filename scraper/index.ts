import { fetchBlockDiningPlansPage } from "./fetchBlockDiningPlansPage";
import { fetchGraduateTuitionPage } from "./fetchGraduateTuitionPage";
import { fetchHousingRatesPage } from "./fetchHousingRatesPage";
import { fetchParkingPermitsPage } from "./fetchParkingPermitsPage";
import { fetchResidentDiningPlansPage } from "./fetchResidentDiningPlansPage";
import { fetchUndergraduateTuitionPage } from "./fetchUndergraduateTuitionPage";
import {
  clearStagingForAcademicYear,
  writeBlockDiningPlansPageToStaging,
  writeGraduateTuitionPageToStaging,
  writeHousingRatesPageToStaging,
  writeParkingPermitsPageToStaging,
  writeResidentDiningPlansPageToStaging,
  writeUndergraduateTuitionPageToStaging,
} from "./writeToStaging";

// Scrapes every link group and writes the results into staging tables --
// never live tables. Sequential, not parallel: if one page's structure has
// changed and extraction fails, we want to know immediately, not after
// writing five other groups' worth of data.
async function main() {
  const academicYearId = process.argv[2];
  if (!academicYearId) {
    console.error("Usage: npm run scrape -- <academic_year_id>");
    process.exit(1);
  }

  console.log(`Clearing any existing staged data for academic_year_id ${academicYearId}...`);
  await clearStagingForAcademicYear(academicYearId);

  console.log("Scraping undergraduate tuition (link group 1)...");
  const undergrad = await fetchUndergraduateTuitionPage();
  await writeUndergraduateTuitionPageToStaging(undergrad, academicYearId);
  console.log("  staged.");

  console.log("Scraping graduate tuition (link group 2)...");
  const graduate = await fetchGraduateTuitionPage();
  await writeGraduateTuitionPageToStaging(graduate, academicYearId);
  console.log("  staged.");

  console.log("Scraping housing rates (link group 3)...");
  const housing = await fetchHousingRatesPage();
  await writeHousingRatesPageToStaging(housing, academicYearId);
  console.log("  staged.");

  console.log("Scraping resident dining plans (link group 4)...");
  const residentDining = await fetchResidentDiningPlansPage();
  await writeResidentDiningPlansPageToStaging(residentDining, academicYearId);
  console.log("  staged.");

  console.log("Scraping block dining plans (link group 5)...");
  const blockDining = await fetchBlockDiningPlansPage();
  await writeBlockDiningPlansPageToStaging(blockDining, academicYearId);
  console.log("  staged.");

  console.log("Scraping parking permits (link group 6)...");
  const parking = await fetchParkingPermitsPage();
  await writeParkingPermitsPageToStaging(parking, academicYearId);
  console.log("  staged.");

  console.log("\nAll done. Review the staged data in Supabase Studio before promoting anything to the live tables.");
}

main().catch((error) => {
  console.error("Scrape failed:", error);
  process.exit(1);
});
