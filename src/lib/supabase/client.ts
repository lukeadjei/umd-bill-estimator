import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Browser-side client, cookie-aware (via @supabase/ssr) -- used from client
// components to kick off signInWithOAuth. Distinct from server.ts's plain
// anon-key client, which never touches cookies/sessions and is only used
// for the public-read RatesBundle fetch.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
