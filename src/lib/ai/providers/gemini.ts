import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai";
import type { Content, FunctionCall } from "@google/genai";
import type {
  AiConversationMessage,
  AiGenerateResult,
  AiProvider,
  AiToolCall,
  AiToolDefinition,
} from "./types";

// Cheapest current Gemini tier -- right-sized for short structured
// extraction, not deep reasoning. The original cost research (PROGRESS-LOG.md,
// 2026-09-15) priced gemini-2.5-flash-lite; that model was retired for new
// API keys mid-build (confirmed via a real 404 on the first live test, not
// assumed) -- gemini-3.5-flash-lite is Google's replacement, at higher fixed
// pricing ($0.30/$2.50 per MTok vs. 2.5's $0.10/$0.40) with no confirmed
// promotional-free-tier carryover. Still meaningfully cheaper than Claude's
// cheapest tier for this workload, just not quite the original estimate --
// flagged to the user alongside this fix.
const MODEL = "gemini-3.5-flash-lite";

// Gemini has no server-side memory of its own between calls -- every request
// resends the FULL conversation so far, including the model's own prior
// turns. providerState carries that array between generate() and
// continueWithToolResult() so this file is the only place that ever has to
// know that.
type GeminiProviderState = Content[];

function toGeminiContents(history: AiConversationMessage[], message: string): Content[] {
  const contents: Content[] = history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
  contents.push({ role: "user", parts: [{ text: message }] });
  return contents;
}

function toFunctionDeclarations(tools: AiToolDefinition[]) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parametersJsonSchema: tool.parametersSchema,
  }));
}

function toAiToolCalls(functionCalls: FunctionCall[] | undefined): AiToolCall[] {
  if (!functionCalls) return [];
  return functionCalls.map((fc) => ({ name: fc.name ?? "", args: fc.args ?? {}, id: fc.id }));
}

export function createGeminiProvider(apiKey: string): AiProvider {
  const client = new GoogleGenAI({ apiKey });

  // Shared by generate() and continueWithToolResult() -- both are just
  // "call the model with this contents array" once the array itself is built.
  async function callModel(
    contents: Content[],
    systemPrompt: string,
    tools: AiToolDefinition[]
  ): Promise<AiGenerateResult> {
    const response = await client.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        tools: tools.length > 0 ? [{ functionDeclarations: toFunctionDeclarations(tools) }] : undefined,
        toolConfig:
          tools.length > 0 ? { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } } : undefined,
      },
    });

    // Append the model's own turn (which may contain functionCall parts) so
    // a follow-up continueWithToolResult() call can resend the full
    // conversation including it -- required by Gemini's stateless contract,
    // not optional bookkeeping.
    const modelContent = response.candidates?.[0]?.content;
    const providerState: GeminiProviderState = modelContent ? [...contents, modelContent] : contents;

    return {
      text: response.text ?? null,
      toolCalls: toAiToolCalls(response.functionCalls),
      providerState,
    };
  }

  return {
    async generate({ systemPrompt, history, message, tools }) {
      const contents = toGeminiContents(history, message);
      return callModel(contents, systemPrompt, tools);
    },

    async continueWithToolResult({ systemPrompt, tools, providerState, toolCall, toolResult }) {
      const contents: Content[] = [...(providerState as GeminiProviderState)];
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              id: toolCall.id,
              name: toolCall.name,
              response: toolResult as Record<string, unknown>,
            },
          },
        ],
      });
      return callModel(contents, systemPrompt, tools);
    },
  };
}
