import type { RatesBundle, Selections } from "@/lib/calculator/types";
import type { AiToolDefinition } from "../providers/types";

export type AiToolContext = {
  rates: RatesBundle;
  // The student's real current selections, as already reflected in the
  // dashboard -- needed by any tool that has to reason about the FULL bill,
  // not just the one thing being asked about (e.g. evaluateBudget: "can I
  // add a dining plan and stay under budget" is meaningless without also
  // knowing the already-chosen housing/tuition situation). Typed as the
  // plain calculator Selections, not the dashboard's DashboardSelections --
  // this layer shouldn't depend on the components layer for a type it
  // doesn't need `major` from anyway.
  currentSelections: Selections;
};

export type AiToolExecuteResult = { ok: true; result: unknown } | { ok: false; errors: string[] };

// A tool's schema is built fresh per request (from the live RatesBundle, via
// buildDefinition) -- never cached/hardcoded -- so it can never drift from
// what execute() actually accepts. See verifyAiPatch.ts for why this matters.
export interface AiTool {
  name: string;
  buildDefinition(rates: RatesBundle): AiToolDefinition;
  execute(rawArgs: unknown, context: AiToolContext): Promise<AiToolExecuteResult>;
}
