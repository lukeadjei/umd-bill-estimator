import { createServiceRoleClient } from "@/lib/supabase/serviceRoleClient";
import type { Json } from "@/lib/supabase/database.types";

export type LogAiParseParams = {
  userId: string | null;
  provider: string;
  userMessage: string;
  toolCallOutput: Json | null;
  validationErrors: string[] | null;
  latencyMs: number;
  success: boolean;
  errorMessage: string | null;
};

// Debugging log only. Deliberately swallows its own failures -- a logging
// bug must never break the chat response it's trying to help debug later.
// See docs/BUILD-REFERENCE.md for the retention/access design this
// implements (service-role-only table, short retention) and the /privacy
// disclosure that shipped alongside this feature.
export async function logAiParse(params: LogAiParseParams): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("ai_parse_logs").insert({
      user_id: params.userId,
      provider: params.provider,
      user_message: params.userMessage,
      tool_call_output: params.toolCallOutput,
      validation_errors: params.validationErrors,
      latency_ms: params.latencyMs,
      success: params.success,
      error_message: params.errorMessage,
    });
    if (error) throw error;
  } catch (error) {
    console.error("Failed to write AI parse log (non-fatal):", error);
  }
}
