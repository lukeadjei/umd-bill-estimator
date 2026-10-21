import { promoteAllStaging, promoteWinterSession } from "./promoteStaging";

// Copies reviewed staging data into the live tables the app actually reads
// from. Run this only after looking at the staged rows in Supabase Studio --
// this script has no review logic of its own, it trusts everything currently
// sitting in staging for the given year.
async function main() {
  const academicYearId = process.argv[2];
  const scope = process.argv[3];
  if (!academicYearId || (scope !== undefined && scope !== "winter")) {
    console.error("Usage: npm run promote -- <academic_year_id> [winter]");
    process.exit(1);
  }

  // `winter` promotes only the winter tables. A full promote re-inserts every live
  // rate table, which fails once saved scenarios reference those rows.
  if (scope === "winter") {
    console.log(`Promoting staged WINTER data for academic_year_id ${academicYearId} into live tables...`);
    await promoteWinterSession(academicYearId);
    console.log("Done. Live winter tables now reflect the reviewed staged data.");
    return;
  }

  console.log(`Promoting staged data for academic_year_id ${academicYearId} into live tables...`);
  await promoteAllStaging(academicYearId);
  console.log("Done. Live tables now reflect the reviewed staged data.");
}

main().catch((error) => {
  console.error("Promotion failed:", error);
  process.exit(1);
});
