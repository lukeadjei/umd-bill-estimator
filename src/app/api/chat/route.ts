import { NextResponse } from "next/server";
import { resolveCallerIdentity } from "@/lib/ai/callerIdentity";
import { trimChatHistory, validateChatMessage } from "@/lib/ai/chatInput";
import type { ChatMessage } from "@/lib/ai/chatInput";
import { describeCheapestDefaults, describeKnownSelections } from "@/lib/ai/describeSelections";
import { getAiProvider, AI_PROVIDER_NAME } from "@/lib/ai/getProvider";
import { logAiParse } from "@/lib/ai/logging";
import { checkRateLimit } from "@/lib/ai/rateLimit";
import { SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";
import { AI_TOOLS, findAiTool } from "@/lib/ai/tools";
import type { EvaluateBudgetResult } from "@/lib/ai/tools";
import { extractDollarAmounts, replyDollarAmountsAreVerified, stripLinksAndImages } from "@/lib/ai/verifyReplyText";
import { EMPTY_SELECTIONS } from "@/lib/calculator/constants";
import { getRatesBundle } from "@/lib/supabase/getRatesBundle";
import type { Json } from "@/lib/supabase/database.types";
import type { Selections } from "@/lib/calculator/types";

type ChatRequestBody = { message?: unknown; history?: unknown; selections?: unknown };
type ChatToolResult = { name: string; result: unknown };

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const { role, content } = value as { role?: unknown; content?: unknown };
  return (role === "user" || role === "assistant") && typeof content === "string";
}

function parseHistory(rawHistory: unknown): ChatMessage[] {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory.filter(isChatMessage);
}

// Lenient on purpose -- the client sends its DashboardSelections (a superset
// with `major`, which this layer ignores), and any field it omits just falls
// back to the same empty baseline a brand-new guest would have. This is
// context for the AI's tools (evaluateBudget in particular needs to know the
// FULL current bill, not just what's changing), never written to a database,
// so a malformed/partial value degrading gracefully is the right failure
// mode -- not worth rejecting the whole request over.
function parseCurrentSelections(raw: unknown): Selections {
  if (typeof raw !== "object" || raw === null) return EMPTY_SELECTIONS;
  return { ...EMPTY_SELECTIONS, ...(raw as Partial<Selections>) };
}

// Extracts every real dollar figure a tool call actually computed this turn
// -- the model's reply is allowed to state exactly these numbers and nothing
// else (see verifyReplyText.ts). Only evaluateBudget ever produces dollar
// amounts; every other tool contributes an empty list, meaning their replies
// may not contain a dollar figure at all.
function extractVerifiedDollarAmounts(toolName: string | null, result: unknown): number[] {
  if (toolName !== "evaluateBudget") return [];
  const budgetResult = result as EvaluateBudgetResult;
  const amounts: number[] = [];
  if (budgetResult.targetBudget !== null) amounts.push(budgetResult.targetBudget);
  for (const scenario of budgetResult.scenarios) {
    if (scenario.total !== null) amounts.push(scenario.total);
    if (scenario.netTotal !== null) amounts.push(scenario.netTotal);
  }
  return amounts;
}

// A safe, deterministic sentence built directly from real tool output --
// used only when the model's own reply fails the dollar-amount check above,
// so the student still gets a correct answer even though the model's more
// natural phrasing had to be discarded.
function buildFallbackReply(toolName: string | null, result: unknown): string {
  if (toolName === "evaluateBudget") {
    const budgetResult = result as EvaluateBudgetResult;
    const parts = budgetResult.scenarios.map((scenario) => {
      if (!scenario.valid) return `${scenario.label}: still needs ${scenario.validationErrors.join(" ")}`;

      const budgetNote = (underBudget: boolean | null) =>
        budgetResult.targetBudget === null
          ? ""
          : underBudget
            ? ` (under your $${budgetResult.targetBudget.toLocaleString()} budget)`
            : ` (over your $${budgetResult.targetBudget.toLocaleString()} budget)`;

      // Explain both figures when aid applies -- matching the "before this,
      // after that" behavior explicitly requested (2026-09-16) -- not just
      // the gross total silently ignoring aid the student already entered.
      if (scenario.aid > 0) {
        return `${scenario.label}: $${scenario.total?.toLocaleString()} before aid${budgetNote(scenario.underBudgetGross)}, $${scenario.netTotal?.toLocaleString()} after aid${budgetNote(scenario.underBudgetNet)}`;
      }
      return `${scenario.label}: $${scenario.total?.toLocaleString()}${budgetNote(scenario.underBudgetGross)}`;
    });
    return parts.join(" · ");
  }
  return "I can only state a dollar amount when it comes from a real cost check -- want me to check your plan against a budget?";
}

// The only Route Handler in this app -- everything else reads via Server
// Components or writes via Server Actions. A Route Handler is needed here
// specifically because this needs a server-only AI provider API key and
// isn't a simple form-style mutation (see BUILD-REFERENCE.md's API routes
// section, decided before this feature existed).
//
// Orchestration, in order: parse + validate input -> resolve who's calling
// -> rate-limit check (BEFORE the paid model call -- this is the actual
// cost protection) -> call the model -> execute at most one requested tool
// call (verifying its arguments against real rate data) -> let the model
// compose a natural reply around the real result -> verify that reply is
// safe to show (no unverified dollar amounts, no raw links/images) -> log ->
// respond. Never trusts anything the model outputs beyond the narrow tool
// schema; see verifyAiPatch.ts for why that specifically matters.
export async function POST(request: Request) {
  const startedAt = Date.now();

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const rawMessage = typeof body.message === "string" ? body.message : "";
  const history = trimChatHistory(parseHistory(body.history));
  const currentSelections = parseCurrentSelections(body.selections);

  const messageCheck = validateChatMessage(rawMessage);
  if (!messageCheck.valid) {
    return NextResponse.json({ error: messageCheck.error }, { status: 400 });
  }
  const message = rawMessage.trim();

  const { identifier, userId, isSignedIn } = await resolveCallerIdentity();

  const rateLimitResult = await checkRateLimit(identifier, isSignedIn);
  if (!rateLimitResult.allowed) {
    const error =
      rateLimitResult.scope === "minute"
        ? "You've hit the message limit for right now -- try again in a minute."
        : "You've reached today's limit for the assistant.";
    return NextResponse.json({ error, scope: rateLimitResult.scope, signInHint: !isSignedIn }, { status: 429 });
  }

  const rates = await getRatesBundle();
  const tools = AI_TOOLS.map((tool) => tool.buildDefinition(rates));
  const provider = getAiProvider();

  let toolCallOutputForLog: Json | null = null;
  let validationErrorsForLog: string[] | null = null;
  let replyText = "";
  let toolResultForClient: ChatToolResult | null = null;
  let success = true;
  let errorMessage: string | null = null;

  // Appended per-request, not baked into the frozen SYSTEM_PROMPT constant --
  // this is the one piece of real per-student context the model needs that
  // conversation history alone can't guarantee (a student may have set
  // things by clicking dashboard panels directly, with nothing about it in
  // this chat's own history). Reused for BOTH calls below so the model's
  // view of "what's already known" stays consistent within one exchange.
  const systemPrompt = `${SYSTEM_PROMPT}\n\n${describeKnownSelections(currentSelections)}\n\n${describeCheapestDefaults(rates)}`;

  try {
    const firstTurn = await provider.generate({ systemPrompt, history, message, tools });

    // v1 scope: at most one tool call per turn, even though a model could in
    // principle request several at once -- handling that correctly (several
    // functionResponse parts, several confirmation chips) is a deliberate
    // fast-follow, not something to guess at now.
    const requestedCall = firstTurn.toolCalls[0];

    if (!requestedCall) {
      replyText = firstTurn.text ?? "";
    } else {
      const tool = findAiTool(requestedCall.name);

      if (!tool) {
        success = false;
        errorMessage = `Model requested unknown tool "${requestedCall.name}".`;
        replyText = "Something went wrong on my end -- try rephrasing your message.";
      } else {
        const executeResult = await tool.execute(requestedCall.args, { rates, currentSelections });

        if (!executeResult.ok) {
          // Fed back to the model as the tool's OWN result, not thrown --
          // lets it react in its next reply (apologize, ask a clarifying
          // question) instead of the whole request just failing outright.
          validationErrorsForLog = executeResult.errors;
          const secondTurn = await provider.continueWithToolResult({
            systemPrompt,
            tools,
            providerState: firstTurn.providerState,
            toolCall: requestedCall,
            toolResult: { error: executeResult.errors.join(" ") },
          });
          replyText = secondTurn.text ?? "I couldn't quite match that to a real option -- could you rephrase?";
        } else {
          toolCallOutputForLog = executeResult.result as Json;
          const secondTurn = await provider.continueWithToolResult({
            systemPrompt,
            tools,
            providerState: firstTurn.providerState,
            toolCall: requestedCall,
            toolResult: executeResult.result,
          });
          replyText = secondTurn.text ?? "Done.";
          toolResultForClient = { name: tool.name, result: executeResult.result };
        }
      }
    }

    // Applied to EVERY reply, regardless of which tool ran (or none) --
    // photos/scenario data are always rendered separately via toolResult,
    // never as raw text, and a dollar figure may only ever be one a tool
    // just computed. Order matters: strip links first, then verify what's
    // left is a safe amount of dollar signs to show.
    replyText = stripLinksAndImages(replyText);
    const verifiedAmounts = [
      ...extractVerifiedDollarAmounts(toolResultForClient?.name ?? null, toolResultForClient?.result),
      // The student's own stated figures (e.g. "$8,000 budget") are safe to
      // restate -- transcription, not computation, same as grant amounts.
      ...extractDollarAmounts(message),
    ];
    if (!replyDollarAmountsAreVerified(replyText, verifiedAmounts)) {
      replyText = buildFallbackReply(toolResultForClient?.name ?? null, toolResultForClient?.result);
    }
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : "Unknown error.";
    replyText = "Something went wrong -- please try again.";
  }

  await logAiParse({
    userId,
    provider: AI_PROVIDER_NAME,
    userMessage: message,
    toolCallOutput: toolCallOutputForLog,
    validationErrors: validationErrorsForLog,
    latencyMs: Date.now() - startedAt,
    success,
    errorMessage,
  });

  if (!success) {
    return NextResponse.json({ error: replyText }, { status: 500 });
  }
  return NextResponse.json({ reply: replyText, toolResult: toolResultForClient });
}
