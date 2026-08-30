import { promoteAllStaging } from "./promoteStaging";

// Copies reviewed staging data into the live tables the app actually reads
// from. Run this only after looking at the staged rows in Supabase Studio --
// this script has no review logic of its own, it trusts everything currently
// sitting in staging for the given year.
async function main() {
  const academicYearId = process.argv[2];
  if (!academicYearId) {
    console.error("Usage: npm run promote -- <academic_year_id>");
    process.exit(1);
  }

  console.log(`Promoting staged data for academic_year_id ${academicYearId} into live tables...`);
  await promoteAllStaging(academicYearId);
  console.log("Done. Live tables now reflect the reviewed staged data.");
}

main().catch((error) => {
  console.error("Promotion failed:", error);
  process.exit(1);
});
