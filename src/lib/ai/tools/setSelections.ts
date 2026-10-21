import { buildAiPatchToolSchema, verifyAiPatch } from "@/lib/calculator/verifyAiPatch";
import { checkPatchForRealPlan } from "./patchGuards";
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
        "Apply a partial patch of the student's selections (semester/residency/credit hours/housing/dining/parking/insurance/winter class format/etc.) based on what they described. Only include fields you're confident about -- omit anything ambiguous rather than guessing. Never includes grants/aid amounts -- those aren't settable through this tool. Only include fields that apply to the current semester (Winter uses just education level, residency, credit hours and winterClassFormat).",
      parametersSchema: buildAiPatchToolSchema(rates),
    };
  },

  async execute(rawArgs, context) {
    const result = verifyAiPatch(rawArgs, context.rates);
    if (!result.ok) return { ok: false, errors: result.errors };
    // Needs the student's current plan / target semester, which verifyAiPatch doesn't have: refuses to
    // clear a plan by switching semester kind, set fields the semester ignores, or set impossible credits.
    const problems = checkPatchForRealPlan(result.patch, context.currentSelections, context.rates);
    if (problems.length > 0) return { ok: false, errors: problems };
    return { ok: true, result: result.patch };
  },
};
