import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY -- run via `npm run scrape`, which loads .env.local"
  );
}

// service_role bypasses RLS -- required since staging tables have zero
// policies at all (not even the scraper's own writes are allowed via the
// public anon key). This client only ever runs here, never in the browser.
export const supabase = createClient<Database>(url, serviceRoleKey);
