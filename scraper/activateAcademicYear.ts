import { supabase } from "./supabaseClient";

// The only safe order: turn every currently-current year off FIRST, then
// turn the target year on. academic_years has a partial unique index
// (`where is_current`) allowing at most one true row at a time -- doing
// this in the other order (or as a single UPDATE that tried to set two rows
// true) would violate that constraint. Two statements, deliberately
// sequential, not a single query.
async function main() {
  const academicYearId = process.argv[2];
  if (!academicYearId) {
    console.error("Usage: npm run academic-year:activate -- <academic_year_id>");
    process.exit(1);
  }

  const { data: target, error: targetError } = await supabase
    .from("academic_years")
    .select("id, label")
    .eq("id", academicYearId)
    .maybeSingle();
  if (targetError) throw targetError;
  if (!target) throw new Error(`No academic_years row found for id ${academicYearId}`);

  const { error: deactivateError } = await supabase.from("academic_years").update({ is_current: false }).eq("is_current", true);
  if (deactivateError) throw deactivateError;

  const { error: activateError } = await supabase.from("academic_years").update({ is_current: true }).eq("id", academicYearId);
  if (activateError) throw activateError;

  console.log(`"${target.label}" (${academicYearId}) is now the current academic year.`);
  console.log("Note: cached rate bundles (getRatesBundle) can take up to 24h to reflect this without a redeploy.");
}

main().catch((error) => {
  console.error("Failed to activate academic year:", error);
  process.exit(1);
});
