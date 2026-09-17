import { createGeminiProvider } from "./providers/gemini";
import type { AiProvider } from "./providers/types";

// The one place that decides which provider is active. Swapping to a
// different model later (e.g. a Claude model, if Gemini's quality proves
// insufficient at some point) means adding a new providers/*.ts file
// implementing AiProvider and changing the return statement below --
// nothing else in this feature (tools, systemPrompt, the Route Handler)
// needs to change.
export function getAiProvider(): AiProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }
  return createGeminiProvider(apiKey);
}

export const AI_PROVIDER_NAME = "gemini-3.5-flash-lite";
