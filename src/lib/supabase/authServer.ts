import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

// Cookie-aware server client for reading the CURRENT user's session in
// Server Components/Actions -- distinct from server.ts (anon-key only, no
// cookies, used for the public RatesBundle read) and client.ts (browser-side,
// used to kick off signInWithOAuth). This is the piece both the save flow
// and the guest/signed-in UI split need: "who is actually signed in right
// now," checked server-side.
// Exported (not just used internally by getServerUser) so other server-side
// code that needs to run a query AS the signed-in user -- letting RLS do the
// per-user filtering, rather than the service-role key bypassing it -- can
// reuse the same cookie handling instead of reimplementing it. See
// scenarios.ts's getUserScenarios for the actual use case.
export async function createAuthServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // getUser() can try to refresh an expiring token as a side effect,
            // which means writing a cookie -- but Next.js only allows cookie
            // writes from a Server Action or Route Handler, not a plain
            // Server Component render (e.g. dashboard/page.tsx calling this).
            // Safe to ignore here: session refresh will happen the next time
            // a Server Action/Route Handler runs. Matches Supabase's own
            // documented pattern for this exact case.
          }
        },
      },
    }
  );
}

// getUser() (not getSession()) -- deliberately revalidates against
// Supabase's auth server rather than trusting a possibly-stale cookie-decoded
// session. This is Supabase's own documented guidance for server-side auth
// checks, and it's the check the save Server Action relies on to know a
// request is really authenticated, not just carrying an old cookie.
export async function getServerUser() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
