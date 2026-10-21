import { calculateAid, calculateNetTotal, calculateTotal } from "@/lib/calculator/calculateTotal";
import { SEMESTER_CONFIG } from "@/lib/calculator/semesterConfig";
import type { Semester } from "@/lib/calculator/types";
import { validateSelections } from "@/lib/calculator/validateSelections";
import { buildAiPatchToolSchema, mergeSelectionsPatch, verifyAiPatch } from "@/lib/calculator/verifyAiPatch";
import type { AiSelectionsPatch } from "@/lib/calculator/verifyAiPatch";
import { checkScenarioPatch } from "./patchGuards";
import type { AiTool } from "./types";

export type CreditHourOutcome = { creditHours: number; total: number; netTotal: number };

export type FindMaxCreditsResult = {
  // found: some credit count fits. none_fit: even the fewest legal credits is over budget.
  // needs_info: a required field is still missing, so no real number exists yet (validationErrors
  // says what to ask the student for).
  status: "found" | "none_fit" | "needs_info";
  targetBudget: number;
  semester: Semester;
  aid: number;
  validationErrors: string[];
  // What was held fixed on top of the student's known plan (the same patch shape setSelections uses).
  changes: AiSelectionsPatch;
  creditRange: { min: number; max: number };
  maxCreditHours: number | null;
  atMax: CreditHourOutcome | null;
  // The next credit count above the max, which is over budget -- shows what the extra credit would cost.
  firstOver: CreditHourOutcome | null;
  // The fewest credits the semester allows; what's shown when nothing fits.
  cheapest: CreditHourOutcome | null;
  // Lowest credit count that costs exactly the same as atMax (flat full-time tuition makes 12..20 cost
  // the same), so "max credits" isn't misread as "this many is the cheapest way to reach this price".
  sameCostFrom: number | null;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Finds the MOST credit hours that keep the student's bill within a budget, by pricing every legal
// credit count with the app's real engine and picking the largest that fits. This is the "search"
// that evaluateBudget (check one plan) can't do: a model asked "how many credits can I take under
// $5,000?" with only evaluateBudget has to guess candidate counts, and guessed three that were all
// over budget. Nothing here is estimated -- every figure comes from calculateTotal/calculateNetTotal
// (CLAUDE.md rule 1), and the budget comparison uses the AFTER-aid total, what the student owes.
export const findMaxCreditsTool: AiTool = {
  name: "findMaxCredits",

  buildDefinition(rates) {
    return {
      name: "findMaxCredits",
      description:
        "Finds the MOST credit hours the student can take while keeping their estimated total at or under a budget. Use this for questions like 'how many credits can I take for under $X', 'what's the most credits I can afford', or 'how much can I take within my budget'. It tries every legal credit count with the real pricing engine, so NEVER guess credit counts with evaluateBudget for this kind of question. It needs the student's required details to be known (education level, residency, and for Fall/Spring living situation; for Winter the class format) -- if any is missing the result lists exactly what to ask. `changes` holds only what differs from the student's known plan for this question (e.g. a semester, a dining plan); never include creditHours -- that's what this tool solves for. Does NOT change the student's real plan.",
      parametersSchema: {
        type: "object",
        properties: {
          targetBudget: { type: "number", description: "The dollar amount the student wants to stay at or under." },
          changes: buildAiPatchToolSchema(rates),
        },
        required: ["targetBudget"],
      },
    };
  },

  async execute(rawArgs, context) {
    if (!isPlainObject(rawArgs)) {
      return { ok: false, errors: ["Tool call arguments must be a JSON object."] };
    }

    const targetBudget = rawArgs.targetBudget;
    if (typeof targetBudget !== "number" || !Number.isFinite(targetBudget) || targetBudget < 0) {
      return { ok: false, errors: ["targetBudget must be a non-negative number."] };
    }

    const verifyResult = verifyAiPatch(rawArgs.changes ?? {}, context.rates);
    if (!verifyResult.ok) return { ok: false, errors: verifyResult.errors };
    if (verifyResult.patch.creditHours !== undefined) {
      return { ok: false, errors: ["Don't include creditHours in changes -- this tool solves for it."] };
    }

    const merged = mergeSelectionsPatch(context.currentSelections, verifyResult.patch);
    const misuse = checkScenarioPatch(verifyResult.patch, merged.semester);
    if (misuse.length > 0) return { ok: false, errors: misuse };

    const { min, max } = SEMESTER_CONFIG[merged.semester].creditHourRange(context.rates);
    const aid = calculateAid(merged);
    const base = {
      targetBudget,
      semester: merged.semester,
      aid,
      changes: verifyResult.patch,
      creditRange: { min, max },
    };
    const empty = { maxCreditHours: null, atMax: null, firstOver: null, cheapest: null, sameCostFrom: null };

    // Validate with the fewest legal credits: any error left is about something OTHER than credit
    // hours (missing education level/residency/living situation/class format, an illegal combination,
    // winter unavailable), so no real number exists yet.
    const probe = validateSelections({ ...merged, creditHours: min }, context.rates);
    if (max < min || !probe.valid) {
      const messages = probe.errors.map((e) => e.message);
      return {
        ok: true,
        result: {
          ...base,
          ...empty,
          status: "needs_info",
          validationErrors: messages.length > 0 ? messages : ["No credit hours are available for this semester."],
        } satisfies FindMaxCreditsResult,
      };
    }

    const outcomes: CreditHourOutcome[] = [];
    for (let creditHours = min; creditHours <= max; creditHours++) {
      const plan = { ...merged, creditHours };
      outcomes.push({
        creditHours,
        total: calculateTotal(plan, context.rates),
        netTotal: calculateNetTotal(plan, context.rates),
      });
    }

    // The largest count that fits (not merely the last of a contiguous run) -- price is flat across
    // some ranges and could in principle be non-monotonic, so scan from the top.
    const atMax = [...outcomes].reverse().find((outcome) => outcome.netTotal <= targetBudget) ?? null;
    const cheapest = outcomes[0];

    if (!atMax) {
      return {
        ok: true,
        result: { ...base, ...empty, status: "none_fit", validationErrors: [], cheapest } satisfies FindMaxCreditsResult,
      };
    }

    const firstOver = outcomes.find((outcome) => outcome.creditHours > atMax.creditHours) ?? null;
    let sameCostFrom = atMax.creditHours;
    while (sameCostFrom > min && outcomes[sameCostFrom - 1 - min].netTotal === atMax.netTotal) sameCostFrom--;

    return {
      ok: true,
      result: {
        ...base,
        status: "found",
        validationErrors: [],
        maxCreditHours: atMax.creditHours,
        atMax,
        firstOver,
        cheapest,
        sameCostFrom,
      } satisfies FindMaxCreditsResult,
    };
  },
};
