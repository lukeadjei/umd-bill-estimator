import { describe, expect, it } from "vitest";
import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH, trimChatHistory, validateChatMessage } from "./chatInput";
import type { ChatMessage } from "./chatInput";

describe("validateChatMessage", () => {
  it("accepts a normal sentence", () => {
    expect(validateChatMessage("I'm an out-of-state sophomore in a double in Denton.")).toEqual({ valid: true });
  });

  it("rejects an empty message", () => {
    expect(validateChatMessage("").valid).toBe(false);
  });

  it("rejects a whitespace-only message", () => {
    expect(validateChatMessage("   \n\t  ").valid).toBe(false);
  });

  it("accepts a message right at the length cap", () => {
    // Varied text, not a single repeated character -- repeat("a") would also
    // trip the degenerate-repetition check below, conflating the two cases.
    const phrase = "I am describing my housing situation in real detail. ";
    const atCap = phrase.repeat(Math.ceil(MAX_MESSAGE_LENGTH / phrase.length)).slice(0, MAX_MESSAGE_LENGTH);
    expect(atCap).toHaveLength(MAX_MESSAGE_LENGTH);
    expect(validateChatMessage(atCap).valid).toBe(true);
  });

  it("rejects a message over the length cap", () => {
    expect(validateChatMessage("a".repeat(MAX_MESSAGE_LENGTH + 1)).valid).toBe(false);
  });

  it("rejects control characters", () => {
    expect(validateChatMessage("hello\x00world").valid).toBe(false);
  });

  it("allows normal newlines and tabs", () => {
    expect(validateChatMessage("line one\nline two\tindented").valid).toBe(true);
  });

  it("rejects degenerate single-character repetition spam", () => {
    expect(validateChatMessage("a".repeat(100)).valid).toBe(false);
  });

  it("does not false-positive on ordinary repeated words/punctuation", () => {
    expect(validateChatMessage("really really really unsure about housing!!!").valid).toBe(true);
  });
});

describe("trimChatHistory", () => {
  function message(i: number): ChatMessage {
    return { role: i % 2 === 0 ? "user" : "assistant", content: `message ${i}` };
  }

  it("leaves a short history untouched", () => {
    const history = [message(1), message(2)];
    expect(trimChatHistory(history)).toEqual(history);
  });

  it("keeps exactly the cap when history is at the boundary", () => {
    const history = Array.from({ length: MAX_HISTORY_MESSAGES }, (_, i) => message(i));
    expect(trimChatHistory(history)).toHaveLength(MAX_HISTORY_MESSAGES);
  });

  it("drops the oldest messages first when over the cap", () => {
    const history = Array.from({ length: MAX_HISTORY_MESSAGES + 3 }, (_, i) => message(i));
    const trimmed = trimChatHistory(history);
    expect(trimmed).toHaveLength(MAX_HISTORY_MESSAGES);
    expect(trimmed[0]).toEqual(message(3));
    expect(trimmed[trimmed.length - 1]).toEqual(message(MAX_HISTORY_MESSAGES + 2));
  });
});
