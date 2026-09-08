import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs on (almost) every request. Two jobs:
//
// 1. Refresh the Supabase session cookie. Server Components can't write
//    cookies themselves (see authServer.ts's try/catch on setAll) -- without
//    something refreshing an expiring session, users would eventually get
//    silently signed out. This layer CAN write cookies (via NextResponse),
//    so it's the one place that keeps sessions alive long-term. This is
//    Supabase's own documented pattern for the Next.js App Router.
//
// 2. Defense in depth on /settings: the page itself (settings/page.tsx)
//    already redirects unauthenticated visitors to /sign-in -- this is a
//    second, independent enforcement of the same rule, at a layer that runs
//    before any page code executes. Neither check depends on the other; if
//    one had a bug, the other still protects the route.
//
// File is named proxy.ts, not middleware.ts -- Next.js 16 deprecated the
// middleware.ts convention in favor of proxy.ts (same underlying mechanism,
// confirmed by reading Next's own build source: both resolve through
// identical code, and the compiled output is renamed back to middleware.js
// internally either way -- this is a naming-convention migration only, not
// a behavior change).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getUser(), not getSession() -- revalidates against Supabase's auth
  // server rather than trusting a possibly-stale cookie, same reasoning as
  // authServer.ts's getServerUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith("/settings") && !user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return response;
}

export const config = {
  // Excludes static assets and image files -- no session/auth relevance for
  // those, and running this on every single asset request would just be
  // wasted Supabase calls.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
