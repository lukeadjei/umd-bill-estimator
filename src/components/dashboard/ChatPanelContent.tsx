"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Shared between the desktop side panel and the mobile bottom-sheet overlay
// so the two surfaces can't drift out of sync. Not wired to a real AI call
// yet -- once built, this parses free text into structured selections and
// fills in the tab panels; it never computes a dollar amount itself, per
// the AI rule in CLAUDE.md (calculateTotal is the only function allowed to
// produce a price).
export function ChatPanelContent({ headerAction }: { headerAction?: React.ReactNode }) {
  const [message, setMessage] = useState("");

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
        <p className="text-base text-muted-foreground">
          Try something like &ldquo;I&apos;m an out-of-state sophomore living in a double in Denton with the
          Preferred meal plan.&rdquo;
        </p>
      </div>

      <form
        className="flex items-center gap-2 border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <Button type="submit" className="rounded-full">
          Send
        </Button>
      </form>
    </div>
  );
}
