import { MAX_CREDIT_HOURS, MIN_CREDIT_HOURS } from "./constants";
import type { RatesBundle, Selections } from "./types";

// Deliberately a hand-picked allowlist, not `Partial<Selections>` spread --
// if a future field is ever added to Selections, it does NOT automatically
// become AI-writable just by existing on that type; someone has to add it
// here on purpose. `grants` is excluded entirely (2026-09-15 decision):
// it's the one field group with no rate-table lookup behind it (raw
// user-typed dollar amounts), and letting the AI set it directly was judged
// not worth the risk for the value it adds. When grants come up in
// conversation, the system prompt directs the user to the Aid & Grants tab
// instead -- there is no tool path to set them.
//
// Notice there is no field here for a price/total of any kind -- Selections
// itself has none (every dollar figure is computed by calculateTotal from
// these identifiers, never stored on the selection). That's what makes
// CLAUDE.md rule 1 ("the AI never computes dollar amounts") true by
// construction: this type is structurally incapable of expressing one.
export type AiSelectionsPatch = {
  semester?: Selections["semester"];
  educationLevel?: Selections["educationLevel"];
  residency?: Selections["residency"];
  creditHours?: Selections["creditHours"];
  appliesDifferentialTuition?: Selections["appliesDifferentialTuition"];
  insurance?: Selections["insurance"];
  livingSituation?: Selections["livingSituation"];
  housing?: Selections["housing"];
  residentDiningPlan?: Selections["residentDiningPlan"];
  blockDiningPlan?: Selections["blockDiningPlan"];
  parking?: Selections["parking"];
};

// A plain field-overwrite merge -- patch fields win where present, base
// fields carry through untouched otherwise. Used to build a HYPOTHETICAL
// selections object for evaluateBudget (never applied to real state on its
// own; only setSelections' patch is ever passed to onSelectionsChange).
export function mergeSelectionsPatch(base: Selections, patch: AiSelectionsPatch): Selections {
  return { ...base, ...patch };
}

const SEMESTER_VALUES = ["fall", "spring"] as const;
const EDUCATION_LEVEL_VALUES = ["undergraduate", "graduate"] as const;
const RESIDENCY_VALUES = ["resident", "non_resident"] as const;
const LIVING_SITUATION_VALUES = ["on_campus", "commuter"] as const;

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values));
}

// Plain JSON Schema (the format Gemini/Claude/OpenAI-style function-calling
// APIs all accept in near-identical shape) describing exactly the fields
// above. Built fresh from the live RatesBundle on every request -- never a
// hardcoded enum list -- for the same reason the dashboard panels derive
// their dropdown options from real data instead of hardcoding them (see the
// 2026-09-04 PROGRESS-LOG entry: hardcoded option strings not matching real
// Supabase casing would have made calculateTotal's findOrThrow crash the
// app). Whatever the model is allowed to choose from here is exactly what
// verifyAiPatch below will accept -- one derivation, two consumers, so the
// tool's own schema can never drift out of sync with what's actually valid.
export function buildAiPatchToolSchema(rates: RatesBundle): object {
  const roomTypes = uniqueValues(rates.housingRates.map((r) => r.room_type));
  const buildingCategories = uniqueValues(rates.housingRates.map((r) => r.building_category));
  const residentPlanNames = uniqueValues(rates.residentDiningPlans.map((r) => r.plan_name));
  const blockPlanLabels = uniqueValues(rates.blockDiningPlans.map((r) => r.plan_label));
  const permitTypes = uniqueValues(rates.parkingPermits.map((r) => r.permit_type));
  const permitTerms = uniqueValues(rates.parkingPermits.map((r) => r.term));

  return {
    type: "object",
    description:
      "A partial patch of the student's selections, extracted from their message. Only include fields you're confident about -- omit anything unclear rather than guessing.",
    properties: {
      semester: { type: "string", enum: SEMESTER_VALUES },
      educationLevel: { type: "string", enum: EDUCATION_LEVEL_VALUES },
      residency: { type: "string", enum: RESIDENCY_VALUES },
      creditHours: { type: "integer", minimum: MIN_CREDIT_HOURS, maximum: MAX_CREDIT_HOURS },
      appliesDifferentialTuition: { type: "boolean" },
      insurance: { type: "boolean" },
      livingSituation: { type: "string", enum: LIVING_SITUATION_VALUES },
      housing: {
        type: "object",
        description: "Both fields required together -- don't set one without the other.",
        properties: {
          roomType: { type: "string", enum: roomTypes },
          buildingCategory: { type: "string", enum: buildingCategories },
        },
        required: ["roomType", "buildingCategory"],
      },
      residentDiningPlan: {
        type: "object",
        properties: { planName: { type: "string", enum: residentPlanNames } },
        required: ["planName"],
      },
      blockDiningPlan: {
        type: "object",
        properties: { planLabel: { type: "string", enum: blockPlanLabels } },
        required: ["planLabel"],
      },
      parking: {
        type: "object",
        description: "Both fields required together -- don't set one without the other.",
        properties: {
          permitType: { type: "string", enum: permitTypes },
          term: { type: "string", enum: permitTerms },
        },
        required: ["permitType", "term"],
      },
    },
    required: [],
  };
}

export type VerifyAiPatchResult = { ok: true; patch: AiSelectionsPatch } | { ok: false; errors: string[] };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

// Re-checks the model's tool-call arguments against the SAME real rate data
// buildAiPatchToolSchema above was built from -- a schema-valid call from the
// model's perspective (right shape, right types) can still name a
// combination that doesn't exist as a real row (e.g. a roomType/
// buildingCategory pair with no matching housing_rates entry, the same
// "Converted Single only exists under Traditional Without AC" gap
// HousingPanel already has to handle). Every field is independently
// collected into `errors` rather than stopping at the first problem, same
// "report everything at once" philosophy validateSelections already uses.
//
// Deliberately does NOT check cross-field legality (e.g. "not both
// residentDiningPlan and blockDiningPlan") -- that's validateSelections' job,
// run by the caller against the MERGED selections after this patch is
// applied, not duplicated here. This function only answers "is this shaped
// like real data," not "is this a legal combination."
export function verifyAiPatch(rawArgs: unknown, rates: RatesBundle): VerifyAiPatchResult {
  const errors: string[] = [];

  if (!isPlainObject(rawArgs)) {
    return { ok: false, errors: ["Tool call arguments must be a JSON object."] };
  }

  const patch: AiSelectionsPatch = {};
  const allowedKeys = new Set([
    "semester",
    "educationLevel",
    "residency",
    "creditHours",
    "appliesDifferentialTuition",
    "insurance",
    "livingSituation",
    "housing",
    "residentDiningPlan",
    "blockDiningPlan",
    "parking",
  ]);

  for (const key of Object.keys(rawArgs)) {
    if (!allowedKeys.has(key)) {
      errors.push(`Unrecognized field "${key}" -- not something this tool is allowed to set.`);
    }
  }

  if ("semester" in rawArgs) {
    if (isOneOf(rawArgs.semester, SEMESTER_VALUES)) patch.semester = rawArgs.semester;
    else errors.push(`semester must be one of: ${SEMESTER_VALUES.join(", ")}.`);
  }

  if ("educationLevel" in rawArgs) {
    if (isOneOf(rawArgs.educationLevel, EDUCATION_LEVEL_VALUES)) patch.educationLevel = rawArgs.educationLevel;
    else errors.push(`educationLevel must be one of: ${EDUCATION_LEVEL_VALUES.join(", ")}.`);
  }

  if ("residency" in rawArgs) {
    if (isOneOf(rawArgs.residency, RESIDENCY_VALUES)) patch.residency = rawArgs.residency;
    else errors.push(`residency must be one of: ${RESIDENCY_VALUES.join(", ")}.`);
  }

  if ("creditHours" in rawArgs) {
    const value = rawArgs.creditHours;
    if (typeof value === "number" && Number.isInteger(value) && value >= MIN_CREDIT_HOURS && value <= MAX_CREDIT_HOURS) {
      patch.creditHours = value;
    } else {
      errors.push(`creditHours must be a whole number between ${MIN_CREDIT_HOURS} and ${MAX_CREDIT_HOURS}.`);
    }
  }

  if ("appliesDifferentialTuition" in rawArgs) {
    if (typeof rawArgs.appliesDifferentialTuition === "boolean") {
      patch.appliesDifferentialTuition = rawArgs.appliesDifferentialTuition;
    } else {
      errors.push("appliesDifferentialTuition must be true or false.");
    }
  }

  if ("insurance" in rawArgs) {
    if (typeof rawArgs.insurance === "boolean") patch.insurance = rawArgs.insurance;
    else errors.push("insurance must be true or false.");
  }

  if ("livingSituation" in rawArgs) {
    if (isOneOf(rawArgs.livingSituation, LIVING_SITUATION_VALUES)) patch.livingSituation = rawArgs.livingSituation;
    else errors.push(`livingSituation must be one of: ${LIVING_SITUATION_VALUES.join(", ")}.`);
  }

  if ("housing" in rawArgs) {
    const value = rawArgs.housing;
    if (
      isPlainObject(value) &&
      typeof value.roomType === "string" &&
      typeof value.buildingCategory === "string"
    ) {
      const { roomType, buildingCategory } = value;
      const matches = rates.housingRates.some((r) => r.room_type === roomType && r.building_category === buildingCategory);
      if (matches) patch.housing = { roomType, buildingCategory };
      else errors.push(`housing: no rate data for room type "${roomType}" in building category "${buildingCategory}".`);
    } else {
      errors.push("housing requires both roomType and buildingCategory as strings.");
    }
  }

  if ("residentDiningPlan" in rawArgs) {
    const value = rawArgs.residentDiningPlan;
    if (isPlainObject(value) && typeof value.planName === "string") {
      const matches = rates.residentDiningPlans.some((r) => r.plan_name === value.planName);
      if (matches) patch.residentDiningPlan = { planName: value.planName };
      else errors.push(`residentDiningPlan: no resident dining plan named "${value.planName}".`);
    } else {
      errors.push("residentDiningPlan requires planName as a string.");
    }
  }

  if ("blockDiningPlan" in rawArgs) {
    const value = rawArgs.blockDiningPlan;
    if (isPlainObject(value) && typeof value.planLabel === "string") {
      const matches = rates.blockDiningPlans.some((r) => r.plan_label === value.planLabel);
      if (matches) patch.blockDiningPlan = { planLabel: value.planLabel };
      else errors.push(`blockDiningPlan: no block dining plan labeled "${value.planLabel}".`);
    } else {
      errors.push("blockDiningPlan requires planLabel as a string.");
    }
  }

  if ("parking" in rawArgs) {
    const value = rawArgs.parking;
    if (isPlainObject(value) && typeof value.permitType === "string" && typeof value.term === "string") {
      const { permitType, term } = value;
      const matches = rates.parkingPermits.some((r) => r.permit_type === permitType && r.term === term);
      if (matches) patch.parking = { permitType, term };
      else errors.push(`parking: no permit data for type "${permitType}" with term "${term}".`);
    } else {
      errors.push("parking requires both permitType and term as strings.");
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, patch };
}
