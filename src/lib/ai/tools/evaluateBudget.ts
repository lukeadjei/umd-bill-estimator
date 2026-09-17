import { calculateAid, calculateNetTotal, calculateTotal } from "@/lib/calculator/calculateTotal";
import { validateSelections } from "@/lib/calculator/validateSelections";
import { buildAiPatchToolSchema, mergeSelectionsPatch, verifyAiPatch } from "@/lib/calculator/verifyAiPatch";
import type { AiSelectionsPatch } from "@/lib/calculator/verifyAiPatch";
import type { AiTool } from "./types";

const MAX_SCENARIOS = 3;

export type EvaluateBudgetScenario = {
  label: string;
  // The exact patch this scenario represents, unchanged -- lets the frontend
  // offer a one-click "apply this" by handing it straight to the same
  // onSelectionsChange updater setSelections already uses. Never applied
  // automatically; evaluateBudget itself never mutates real state.
  changes: AiSelectionsPatch;
  valid: boolean;
  // Real validateSelections messages when a scenario is still missing a
  // required field or hits an illegal combination -- NOT a tool failure,
  // genuinely useful information ("you'd need to pick housing first").
  validationErrors: string[];
  semester: "fall" | "spring";
  total: number | null;
  aid: number;
  netTotal: number | null;
  underBudgetGross: boolean | null;
  underBudgetNet: boolean | null;
};

export type EvaluateBudgetResult = {
  targetBudget: number | null;
  scenarios: EvaluateBudgetScenario[];
  // Non-fatal notes about anything skipped/ignored -- e.g. a malformed
  // scenario that couldn't even be represented, or an invalid budget value.
  notes: string[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Real math only -- runs the SAME calculateTotal/calculateNetTotal/
// validateSelections every other path in this app uses, on a hypothetical
// merge of the student's real current selections + one scenario's changes.
// This tool never invents a number; it only calls the functions that are
// already this codebase's sole source of truth for one (CLAUDE.md rule 1).
export const evaluateBudgetTool: AiTool = {
  name: "evaluateBudget",

  buildDefinition(rates) {
    const changesSchema = buildAiPatchToolSchema(rates);
    return {
      name: "evaluateBudget",
      description:
        "Check whether one or more hypothetical plans fit a stated budget, or compare several scenarios against each other. Does NOT change the student's real selections -- purely evaluates 'what if.' ALWAYS include at least one scenario, even for a plain 'am I under budget?' question with nothing hypothetical to add -- use changes:{} for that case, representing the student's plan exactly as it stands. Default to exactly ONE scenario representing the student's question unless they explicitly ask for multiple options or a comparison (e.g. 'give me a few scenarios', 'compare X and Y') -- up to 3 max. Every scenario is evaluated on top of whatever the student has already told you (housing, residency, etc.), not from scratch, so `changes` should only include what's DIFFERENT for that scenario, not fields already set.",
      parametersSchema: {
        type: "object",
        properties: {
          targetBudget: {
            type: "number",
            description: "The dollar amount the student mentioned wanting to stay under, if any.",
          },
          scenarios: {
            type: "array",
            minItems: 1,
            maxItems: MAX_SCENARIOS,
            items: {
              type: "object",
              properties: {
                label: {
                  type: "string",
                  description: "Short human-readable label, e.g. \"With Preferred meal plan\" or \"Fall semester\".",
                },
                changes: changesSchema,
              },
              required: ["label"],
            },
          },
        },
        required: ["scenarios"],
      },
    };
  },

  async execute(rawArgs, context) {
    if (!isPlainObject(rawArgs)) {
      return { ok: false, errors: ["Tool call arguments must be a JSON object."] };
    }

    const notes: string[] = [];

    let targetBudget: number | null = null;
    if ("targetBudget" in rawArgs) {
      if (typeof rawArgs.targetBudget === "number" && rawArgs.targetBudget >= 0) {
        targetBudget = rawArgs.targetBudget;
      } else {
        notes.push("targetBudget must be a non-negative number -- ignored.");
      }
    }

    const rawScenarios = Array.isArray(rawArgs.scenarios) ? rawArgs.scenarios : null;
    if (!rawScenarios || rawScenarios.length === 0) {
      return { ok: false, errors: ["At least one scenario is required."] };
    }
    if (rawScenarios.length > MAX_SCENARIOS) {
      return { ok: false, errors: [`No more than ${MAX_SCENARIOS} scenarios at once.`] };
    }

    const scenarios: EvaluateBudgetScenario[] = [];
    const fatalErrors: string[] = [];

    for (const rawScenario of rawScenarios) {
      if (!isPlainObject(rawScenario) || typeof rawScenario.label !== "string" || rawScenario.label.trim().length === 0) {
        fatalErrors.push("Each scenario needs a non-empty label.");
        continue;
      }
      const label = rawScenario.label.trim();

      const rawChanges = rawScenario.changes ?? {};
      const verifyResult = verifyAiPatch(rawChanges, context.rates);
      if (!verifyResult.ok) {
        fatalErrors.push(`Scenario "${label}": ${verifyResult.errors.join(" ")}`);
        continue;
      }

      const merged = mergeSelectionsPatch(context.currentSelections, verifyResult.patch);
      const validation = validateSelections(merged);

      if (!validation.valid) {
        scenarios.push({
          label,
          changes: verifyResult.patch,
          valid: false,
          validationErrors: validation.errors.map((e) => e.message),
          semester: merged.semester,
          total: null,
          aid: 0,
          netTotal: null,
          underBudgetGross: null,
          underBudgetNet: null,
        });
        continue;
      }

      const total = calculateTotal(merged, context.rates);
      const aid = calculateAid(merged);
      const netTotal = calculateNetTotal(merged, context.rates);

      scenarios.push({
        label,
        changes: verifyResult.patch,
        valid: true,
        validationErrors: [],
        semester: merged.semester,
        total,
        aid,
        netTotal,
        underBudgetGross: targetBudget === null ? null : total <= targetBudget,
        underBudgetNet: targetBudget === null ? null : netTotal <= targetBudget,
      });
    }

    // Only a hard failure (fed back for a retry) when NOTHING could be
    // evaluated at all -- a scenario that's merely missing required fields
    // is still a successful, useful result (valid: false), not an error.
    if (scenarios.length === 0) {
      return { ok: false, errors: fatalErrors.length > 0 ? fatalErrors : ["No valid scenarios could be evaluated."] };
    }

    return { ok: true, result: { targetBudget, scenarios, notes: [...notes, ...fatalErrors] } satisfies EvaluateBudgetResult };
  },
};
