import { evaluateBudgetTool } from "./evaluateBudget";
import { findMaxCreditsTool } from "./findMaxCredits";
import { getHousingPhotosTool } from "./getHousingPhotos";
import { setSelectionsTool } from "./setSelections";
import type { AiTool } from "./types";

export const AI_TOOLS: AiTool[] = [setSelectionsTool, getHousingPhotosTool, evaluateBudgetTool, findMaxCreditsTool];

export { evaluateBudgetTool } from "./evaluateBudget";
export type { EvaluateBudgetResult, EvaluateBudgetScenario } from "./evaluateBudget";
export type { CreditHourOutcome, FindMaxCreditsResult } from "./findMaxCredits";

export function findAiTool(name: string): AiTool | undefined {
  return AI_TOOLS.find((tool) => tool.name === name);
}

export type { AiTool, AiToolContext, AiToolExecuteResult } from "./types";
