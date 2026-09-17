// The seam that makes the provider swap (Gemini now, possibly a Claude model
// later if quality proves insufficient) a one-file change instead of a
// rewrite. Every tool definition and the chat Route Handler import ONLY from
// this file -- never a provider SDK directly. Implementing AiProvider for a
// new provider, and pointing src/lib/ai/getProvider.ts at it, is the entire
// swap.

export type AiToolDefinition = {
  name: string;
  description: string;
  // Plain JSON Schema -- every major provider's function-calling API accepts
  // this shape (or a near-identical one) directly, so it's kept
  // provider-agnostic here rather than typed against any one SDK's schema type.
  parametersSchema: object;
};

export type AiToolCall = {
  name: string;
  args: Record<string, unknown>;
  // Some providers key a tool-call/tool-result pair by an id; others don't
  // need one. Optional here so a provider that doesn't use one just omits it.
  id?: string;
};

export type AiConversationMessage = { role: "user" | "assistant"; content: string };

export type AiGenerateResult = {
  // Plain-text portion of the reply, if any. A turn can have text, tool
  // calls, or both -- never assume one implies the absence of the other.
  text: string | null;
  toolCalls: AiToolCall[];
  // Opaque, provider-specific conversation state as of after this turn
  // (e.g. Gemini's own Content[] history, including the model's own turn).
  // Passed straight back into continueWithToolResult so a provider never has
  // to reconstruct history from scratch for a second turn -- callers must
  // never inspect or serialize this, it has no meaning outside the provider
  // that produced it.
  providerState: unknown;
};

export interface AiProvider {
  generate(params: {
    systemPrompt: string;
    history: AiConversationMessage[];
    message: string;
    tools: AiToolDefinition[];
  }): Promise<AiGenerateResult>;

  // Continues a conversation after OUR OWN code has actually executed a
  // requested tool call, feeding the real result back so the model can
  // compose a natural-language reply around it (e.g. "Set you up in a Denton
  // double."). toolResult is whatever the tool's execute() returned -- never
  // anything the model produced itself.
  continueWithToolResult(params: {
    systemPrompt: string;
    tools: AiToolDefinition[];
    providerState: unknown;
    toolCall: AiToolCall;
    toolResult: unknown;
  }): Promise<AiGenerateResult>;
}
