import { supabase } from "./supabaseClient";

// Deliberately its own step, separate from scrape/promote and from
// activation below -- creating a new year is a rarer, more consequential
// action than refreshing an existing one's rates, so it gets its own
// explicit command rather than being folded into `promote`.
//
// Created with is_current = false on purpose: this lets you scrape/promote/
// review the new year's data (npm run scrape / npm run promote against the
// id this prints) while production traffic keeps seeing the outgoing year's
// rates, then flip over deliberately with `academic-year:activate` once
// you're satisfied it's correct -- same staged/reviewed philosophy as
// promotion itself, just one level up.
//
// Thresholds are copied from whichever year is currently current -- the
// column is NOT NULL, so *some* value has to go in at creation time; scrape
// + promote overwrite these with the new year's real values the normal way,
// this is only ever a starting placeholder, never trusted as final data.
async function main() {
  const label = process.argv[2];
  if (!label) {
    console.error("Usage: npm run academic-year:create -- <label>");
    process.exit(1);
  }

  const { data: currentYear, error: currentYearError } = await supabase
    .from("academic_years")
    .select("undergrad_tuition_full_time_credit_threshold, full_time_fee_credit_threshold")
    .eq("is_current", true)
    .maybeSingle();
  if (currentYearError) throw currentYearError;

  const { data: newYear, error: insertError } = await supabase
    .from("academic_years")
    .insert({
      label,
      is_current: false,
      undergrad_tuition_full_time_credit_threshold: currentYear?.undergrad_tuition_full_time_credit_threshold ?? 12,
      full_time_fee_credit_threshold: currentYear?.full_time_fee_credit_threshold ?? 9,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  console.log(`Created academic_years row for "${label}": ${newYear.id}`);
  console.log(`Not marked current yet. Next steps:`);
  console.log(`  npm run scrape -- ${newYear.id}`);
  console.log(`  (review the staged data in Supabase Studio)`);
  console.log(`  npm run promote -- ${newYear.id}`);
  console.log(`  (once you're satisfied it's correct)`);
  console.log(`  npm run academic-year:activate -- ${newYear.id}`);
}

main().catch((error) => {
  console.error("Failed to create academic year:", error);
  process.exit(1);
});
