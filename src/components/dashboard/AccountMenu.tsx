import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/settings/actions";

// The dashboard's account entry point, shared by the desktop nav and the
// mobile header (so it lives in exactly one place instead of being copied).
// Signed in: an avatar menu (Settings / Saved Scenarios / Sign out), shown
// only if there's an avatar to show. Guest: a standing, low-key "Sign in"
// pill -- previously the only sign-in prompt was the summary bar's "Sign in
// to save your plan", which only matters once a guest is already trying to save.
//
// Plain <img>, not next/image: avatar_url is an external Google-hosted URL and
// next/image would require allow-listing that domain in next.config.ts's
// images.remotePatterns.
export function AccountMenu({ isSignedIn, avatarUrl }: { isSignedIn: boolean; avatarUrl: string | null }) {
  if (isSignedIn) {
    if (avatarUrl === null) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Open account menu" className="rounded-full">
          <img
            src={avatarUrl}
            alt="Your profile"
            referrerPolicy="no-referrer"
            className="size-8 rounded-full ring-1 ring-foreground/10 object-cover"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLinkItem href="/settings">Settings</DropdownMenuLinkItem>
          <DropdownMenuLinkItem href="/settings?tab=scenarios">Saved Scenarios</DropdownMenuLinkItem>
          <DropdownMenuItem onClick={() => signOutAction()}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 rounded-full lg:h-7"
      nativeButton={false}
      render={<Link href="/sign-in" />}
    >
      Sign in
    </Button>
  );
}
