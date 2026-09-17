import { buildAiPatchToolSchema, verifyAiPatch } from "@/lib/calculator/verifyAiPatch";
import type { AiTool } from "./types";

// The core "preset the plan" tool. buildDefinition and execute both go
// through verifyAiPatch -- one schema, two consumers, so what the model is
// offered to choose from and what actually gets accepted can never drift
// apart (see verifyAiPatch.ts for the full reasoning).
export const setSelectionsTool: AiTool = {
  name: "setSelections",

  buildDefinition(rates) {
    return {
      name: "setSelections",
      description:
        "Apply a partial patch of the student's selections (major/residency/credit hours/housing/dining/parking/insurance/etc.) based on what they described. Only include fields you're confident about -- omit anything ambiguous rather than guessing. Never includes grants/aid amounts -- those aren't settable through this tool.",
      parametersSchema: buildAiPatchToolSchema(rates),
    };
  },

  async execute(rawArgs, context) {
    const result = verifyAiPatch(rawArgs, context.rates);
    if (!result.ok) return { ok: false, errors: result.errors };
    return { ok: true, result: result.patch };
  },
};
