// Remembers, per browser, that this visitor has already been introduced to the
// assistant -- the first-visit card and the button's one-time nudge both stop for
// good once it's set. localStorage can throw (private windows, blocked site data),
// so every access is wrapped: if it fails, the card just shows again next visit,
// which is a nuisance, not a bug.
const ASSISTANT_SEEN_KEY = "assistantIntroSeen";

export function readAssistantSeen(): boolean {
  try {
    return localStorage.getItem(ASSISTANT_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAssistantSeen(): void {
  try {
    localStorage.setItem(ASSISTANT_SEEN_KEY, "1");
  } catch {
    // Storage unavailable -- see above.
  }
}

// Example messages for the first-visit card. Each is a real thing the assistant
// can turn into selections, written the way a student would actually say it.
export const ASSISTANT_EXAMPLE_PROMPTS = [
  "In-state sophomore, 15 credits, living in a double",
  "Out-of-state commuter taking 12 credits",
  "In-state grad student commuting, 9 credits",
] as const;
