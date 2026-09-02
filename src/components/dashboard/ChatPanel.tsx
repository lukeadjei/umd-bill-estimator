import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatPanelContent } from "@/components/dashboard/ChatPanelContent";
import { ChevronsRightIcon } from "lucide-react";

// Desktop-only persistent right column. md:sticky so it tracks scroll
// alongside the content column instead of scrolling away with it; its own
// max-h + overflow-y-auto (on ChatPanelContent's message area) keeps it from
// outgrowing the viewport on a short screen.
//
// No collapsed state lives here anymore -- collapsing is a toggle on
// DashboardShell that simply doesn't render this component at all (its
// grid track shrinks to nothing on its own). The reopen control lives in
// DashboardNav instead, since a persistent sideways rail here read as hard
// to notice and hard to read.
export function ChatPanel({ onCollapse }: { onCollapse: () => void }) {
  return (
    <Card className="hidden max-h-[calc(100vh-6rem)] w-full flex-col overflow-hidden rounded-none bg-card/85 p-0 shadow-[-6px_10px_20px_-2px_rgba(0,0,0,0.32)] md:sticky md:top-20 md:flex md:w-[26rem]">
      <CardContent className="flex h-full flex-col p-0">
        <ChatPanelContent
          headerAction={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={onCollapse}
              aria-label="Collapse assistant chat"
            >
              <ChevronsRightIcon />
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
