import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { getServerUser } from "@/lib/supabase/authServer";

const GUEST_ID_COOKIE = "ai_guest_id";
const GUEST_ID_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type CallerIdentity = { identifier: string; userId: string | null; isSignedIn: boolean };

// Resolves who's calling the chat endpoint, for both rate limiting and
// logging. Signed-in users get their real Supabase user_id. Guests get a
// server-set httpOnly cookie, not IP alone -- IP-based limiting would
// misfire on real students behind a shared university/mobile-carrier NAT
// (see the rate-limiting plan in PROGRESS-LOG.md, 2026-09-15). A determined
// abuser can still clear cookies to reset their limit; the goal here is
// raising the floor against casual/scripted abuse, not building an airtight
// identity system.
export async function resolveCallerIdentity(): Promise<CallerIdentity> {
  const user = await getServerUser();
  if (user) {
    return { identifier: `user:${user.id}`, userId: user.id, isSignedIn: true };
  }

  const cookieStore = await cookies();
  const existingGuestId = cookieStore.get(GUEST_ID_COOKIE)?.value;
  if (existingGuestId) {
    return { identifier: `guest:${existingGuestId}`, userId: null, isSignedIn: false };
  }

  const guestId = randomUUID();
  cookieStore.set(GUEST_ID_COOKIE, guestId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: GUEST_ID_COOKIE_MAX_AGE_SECONDS,
  });
  return { identifier: `guest:${guestId}`, userId: null, isSignedIn: false };
}
