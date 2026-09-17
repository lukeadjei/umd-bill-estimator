// Input handling for the AI chat feature -- shared by both the client
// (ChatPanelContent, UX convenience: maxLength, disable Send) and the server
// (the chat Route Handler, the actual enforcement) so the two can't drift,
// same defense-in-depth split saveScenario already uses for notes/grants.

export const MAX_MESSAGE_LENGTH = 500;

// The message history resent on every turn for follow-up context ("actually
// make it a Single"). Capped rather than sent in full -- Selections itself
// is already the running memory of what's been decided (resent fresh every
// turn regardless), so history only needs to cover short-range references
// to the immediately preceding exchange, not a full transcript.
export const MAX_HISTORY_MESSAGES = 6;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatInputValidationResult = { valid: true } | { valid: false; error: string };

// Loose backstop against trivial token-inflation spam (e.g. one character
// pasted hundreds of times) -- deliberately a high threshold so it never
// false-positives on legitimate phrasing (repeated words/punctuation in a
// real sentence). The length cap and rate limiting are the actual cost
// defenses; this only catches the degenerate case neither of those would.
const DEGENERATE_REPETITION_PATTERN = /(.)\1{39,}/;

// Non-printable control characters, excluding tab/newline/carriage return
// (the only ones that can legitimately appear in typed text).
const CONTROL_CHARACTER_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

export function validateChatMessage(rawMessage: string): ChatInputValidationResult {
  const message = rawMessage.trim();

  if (message.length === 0) {
    return { valid: false, error: "Message can't be empty." };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` };
  }
  if (CONTROL_CHARACTER_PATTERN.test(message)) {
    return { valid: false, error: "Message contains characters that aren't allowed." };
  }
  if (DEGENERATE_REPETITION_PATTERN.test(message)) {
    return { valid: false, error: "Message doesn't look like a real question -- try rephrasing." };
  }

  return { valid: true };
}

// Keeps only the most recent exchanges, oldest dropped first. Enforced
// server-side regardless of what the client sends, same as the length cap
// above -- never trust a client to have already trimmed its own history.
export function trimChatHistory(history: ChatMessage[]): ChatMessage[] {
  if (history.length <= MAX_HISTORY_MESSAGES) return history;
  return history.slice(history.length - MAX_HISTORY_MESSAGES);
}
