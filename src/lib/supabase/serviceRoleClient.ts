import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Bypasses RLS -- only for tables with zero public policies (ai_parse_logs,
// ai_rate_limits, and scenarios' own write path in dashboard/actions.ts).
// Never used for anything a client-side request should read/write directly;
// those go through createAuthServerClient() (authServer.ts) instead, so RLS
// does the real per-user filtering.
export function createServiceRoleClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}
