import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { getServerUser } from "@/lib/supabase/authServer";
import { getUserScenarios } from "@/lib/supabase/scenarios";

export const metadata: Metadata = {
  title: "Settings — UMD Bill Estimator",
  description: "Manage your account and saved scenarios.",
};

// force-dynamic: this page makes a live auth decision (redirect if not
// signed in) -- same reasoning as dashboard/page.tsx, can't be statically
// prerendered at build time. Middleware also independently redirects
// unauthenticated /settings visits (see src/middleware.ts) -- this check
// here is a second, independent enforcement of the same rule, not a
// replacement for it.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getServerUser();
  if (!user) {
    redirect("/sign-in");
  }

  const scenarios = await getUserScenarios(user.id);

  return (
    <SettingsShell
      name={(user.user_metadata?.full_name as string | undefined) ?? null}
      email={user.email ?? null}
      scenarios={scenarios}
    />
  );
}
