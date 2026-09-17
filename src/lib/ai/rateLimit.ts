import { createServiceRoleClient } from "@/lib/supabase/serviceRoleClient";

type RateLimitWindow = { kind: "minute" | "day"; limit: number; durationSeconds: number };

// Starting numbers, not derived from real traffic yet -- tunable once real
// usage exists (see PROGRESS-LOG.md, 2026-09-15). Signed-in gets roughly 2-3x
// the guest allowance, rewarding an account without guests being unable to
// meaningfully try the feature.
const GUEST_LIMITS: RateLimitWindow[] = [
  { kind: "minute", limit: 5, durationSeconds: 60 },
  { kind: "day", limit: 20, durationSeconds: 86_400 },
];

const SIGNED_IN_LIMITS: RateLimitWindow[] = [
  { kind: "minute", limit: 10, durationSeconds: 60 },
  { kind: "day", limit: 60, durationSeconds: 86_400 },
];

export type RateLimitResult = { allowed: true } | { allowed: false; scope: "minute" | "day" };

// Checks (and atomically consumes, via check_and_consume_ai_rate_limit) both
// the per-minute and per-day windows for this caller. Runs BEFORE any call
// to the Gemini API -- this is the actual cost protection, not a
// nice-to-have; a limit that's checked after the paid call has already
// happened protects nothing.
export async function checkRateLimit(identifier: string, isSignedIn: boolean): Promise<RateLimitResult> {
  const supabase = createServiceRoleClient();
  const windows = isSignedIn ? SIGNED_IN_LIMITS : GUEST_LIMITS;

  for (const window of windows) {
    const { data: allowed, error } = await supabase.rpc("check_and_consume_ai_rate_limit", {
      p_identifier: identifier,
      p_window_kind: window.kind,
      p_limit: window.limit,
      p_duration_seconds: window.durationSeconds,
    });
    if (error) throw error;
    if (!allowed) return { allowed: false, scope: window.kind };
  }

  return { allowed: true };
}
