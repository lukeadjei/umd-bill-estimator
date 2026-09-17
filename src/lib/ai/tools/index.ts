import { evaluateBudgetTool } from "./evaluateBudget";
import { getHousingPhotosTool } from "./getHousingPhotos";
import { setSelectionsTool } from "./setSelections";
import type { AiTool } from "./types";

export const AI_TOOLS: AiTool[] = [setSelectionsTool, getHousingPhotosTool, evaluateBudgetTool];

export { evaluateBudgetTool } from "./evaluateBudget";
export type { EvaluateBudgetResult, EvaluateBudgetScenario } from "./evaluateBudget";

export function findAiTool(name: string): AiTool | undefined {
  return AI_TOOLS.find((tool) => tool.name === name);
}

export type { AiTool, AiToolContext, AiToolExecuteResult } from "./types";
