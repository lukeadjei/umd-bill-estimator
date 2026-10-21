import { SparklesIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ASSISTANT_EXAMPLE_PROMPTS } from "@/components/dashboard/assistantIntro";

// Phones only (the desktop chat panel is already always visible beside the form,
// with its own example text). A dismissible first-visit card that says what the
// assistant does -- v1 visitors weren't finding it -- with example messages that
// open the chat and send themselves, so the first use is one tap.
export function AssistantIntroCard({
  onPickExample,
  onDismiss,
}: {
  onPickExample: (prompt: string) => void;
  onDismiss: () => void;
}) {
  return (
    <div className="animate-fade-in-up relative rounded-none bg-card/85 p-4 ring-1 ring-foreground/10 shadow-[-5px_8px_16px_-3px_rgba(0,0,0,0.28)] md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2 rounded-full"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <XIcon />
      </Button>

      <p className="flex items-center gap-2 pr-8 text-base font-semibold text-foreground">
        <SparklesIcon className="size-5 shrink-0 text-primary" />
        Skip the forms
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Describe yourself in one sentence and the assistant fills this out for you. Tap an example to try it:
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {ASSISTANT_EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-primary/20"
            onClick={() => onPickExample(prompt)}
          >
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}
