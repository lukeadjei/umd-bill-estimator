import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Server-only client, built from the anon key -- the 11 reference tables are
// public-read per RLS (see docs/BUILD-REFERENCE.md), so no elevated key is
// needed here. The service role key stays reserved for the `scenarios`
// write path via Server Actions.
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient<Database>(url, anonKey);
}
