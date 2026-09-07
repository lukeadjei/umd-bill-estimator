import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

// Google never redirects back to this app directly -- it redirects to
// Supabase's own callback (https://<project-ref>.supabase.co/auth/v1/callback,
// configured in Google Cloud Console), and Supabase then redirects the
// browser here with a one-time `code` to exchange for a real session.
// This route only handles that exchange; it isn't hit by end users directly.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Missing code or a failed exchange -- send back to sign-in rather than
  // silently landing on a page that assumes a session exists.
  return NextResponse.redirect(`${origin}/sign-in?error=auth`);
}
