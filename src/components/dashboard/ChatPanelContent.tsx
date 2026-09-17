"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_MESSAGE_LENGTH } from "@/lib/ai/chatInput";
import type { EvaluateBudgetResult } from "@/lib/ai/tools";
import { ChatBudgetComparison } from "./ChatBudgetComparison";
import { ChatConfirmationChips } from "./ChatConfirmationChips";
import { ChatPhotoPreview } from "./ChatPhotoPreview";
import type { DashboardSelections } from "./selections";
import type { AiSelectionsPatch } from "@/lib/calculator/verifyAiPatch";

type ChatToolResult =
  | { name: "setSelections"; result: AiSelectionsPatch }
  | { name: "getHousingPhotos"; result: { photos: string[] } }
  | { name: "evaluateBudget"; result: EvaluateBudgetResult };

type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolResult?: ChatToolResult;
  isError?: boolean;
};

type ChatApiResponse = { reply: string; toolResult: { name: string; result: unknown } | null };
type ChatApiError = { error: string; scope?: "minute" | "day"; signInHint?: boolean };

function isSetSelectionsResult(
  toolResult: { name: string; result: unknown } | null
): toolResult is { name: "setSelections"; result: AiSelectionsPatch } {
  return toolResult?.name === "setSelections";
}

function isGetHousingPhotosResult(
  toolResult: { name: string; result: unknown } | null
): toolResult is { name: "getHousingPhotos"; result: { photos: string[] } } {
  return toolResult?.name === "getHousingPhotos";
}

function isEvaluateBudgetResult(
  toolResult: { name: string; result: unknown } | null
): toolResult is { name: "evaluateBudget"; result: EvaluateBudgetResult } {
  return toolResult?.name === "evaluateBudget";
}

// Shared between the desktop side panel and the mobile bottom-sheet overlay
// so the two surfaces can't drift out of sync. Talks to POST /api/chat --
// never computes a dollar amount itself (CLAUDE.md rule 1); a successful
// setSelections tool call is applied to the SAME onSelectionsChange patch
// updater the manual dropdown panels already use, so the rest of the
// dashboard (CostBreakdown, SummaryBar, the live total) picks it up and
// recomputes exactly the way it would for a manual click -- no separate
// "plan summary" rendering needed here, the dashboard already IS that,
// updating live the instant a patch lands.
export function ChatPanelContent({
  selections,
  onSelectionsChange,
  headerAction,
}: {
  selections: DashboardSelections;
  onSelectionsChange: (patch: Partial<DashboardSelections>) => void;
  headerAction?: React.ReactNode;
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMessage: DisplayMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history, selections }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as ChatApiError | null;
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: errorBody?.error ?? "Something went wrong -- please try again.",
            isError: true,
          },
        ]);
        return;
      }

      const data = (await response.json()) as ChatApiResponse;

      if (isSetSelectionsResult(data.toolResult)) {
        onSelectionsChange(data.toolResult.result);
      }

      // evaluateBudget is deliberately absent from the auto-apply check above
      // -- it's a "what if" query, never applied to real state on its own.
      // The only way one of its scenarios reaches onSelectionsChange is the
      // student explicitly clicking "Apply this scenario" on the rendered
      // card, same click-to-commit model as everywhere else in this app.
      const toolResult: ChatToolResult | undefined = isSetSelectionsResult(data.toolResult)
        ? data.toolResult
        : isGetHousingPhotosResult(data.toolResult)
          ? data.toolResult
          : isEvaluateBudgetResult(data.toolResult)
            ? data.toolResult
            : undefined;

      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply, toolResult },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Couldn't reach the assistant -- check your connection and try again.",
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Ask the assistant</h2>
          <p className="text-sm text-muted-foreground">
            Describe your situation in plain English -- it fills in the tabs for you.
          </p>
        </div>
        {headerAction}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-base text-muted-foreground">
            Try something like &ldquo;I&apos;m an out-of-state sophomore living in a double in Denton with the
            Preferred meal plan.&rdquo;
          </p>
        )}

        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : msg.isError
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-foreground"
                }`}
              >
                {msg.content}
              </div>

              {msg.toolResult?.name === "setSelections" && <ChatConfirmationChips patch={msg.toolResult.result} />}
              {msg.toolResult?.name === "getHousingPhotos" && msg.toolResult.result.photos.length > 0 && (
                <ChatPhotoPreview urls={msg.toolResult.result.photos} alt="Housing photo" />
              )}
              {msg.toolResult?.name === "evaluateBudget" && (
                <ChatBudgetComparison result={msg.toolResult.result} onApplyScenario={onSelectionsChange} />
              )}
            </div>
          ))}

          {sending && <div className="text-sm text-muted-foreground italic">Assistant is typing…</div>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form
        className="flex items-center gap-2 border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(message);
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type a message..."
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={sending}
          className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
        />
        <Button type="submit" className="rounded-full" disabled={sending || message.trim().length === 0}>
          Send
        </Button>
      </form>
    </div>
  );
}
