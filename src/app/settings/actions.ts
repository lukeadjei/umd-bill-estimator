"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getServerUser, createAuthServerClient } from "@/lib/supabase/authServer";
import type { Database } from "@/lib/supabase/database.types";

export async function signOutAction() {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type DeleteAccountResult = { success: false; error: string };

// Scoped to exactly what's legally ours to delete: our own stored data, not
// the Google OAuth grant (that lives in the user's own Google account,
// already fully under their control, not something we hold on their behalf).
//
// Only one delete call is needed -- scenarios.user_id was defined back in
// the init migration as `references auth.users (id) on delete cascade`, so
// deleting the auth user automatically deletes every scenario row pointing
// at it, enforced by Postgres itself, not application code remembering to
// clean up separately.
export async function deleteAccountAction(): Promise<DeleteAccountResult | never> {
  const user = await getServerUser();
  if (!user) {
    redirect("/sign-in");
  }

  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) {
    return { success: false, error: "Failed to delete account. Try again." };
  }

  // Their session cookie now points at a user that no longer exists --
  // explicitly sign out rather than leaving a dead cookie behind.
  const authClient = await createAuthServerClient();
  await authClient.auth.signOut();

  redirect("/");
}

export type DeleteScenarioResult = { success: true } | { success: false; error: string };

// scenarios has no write RLS policies at all (see the init migration's own
// comment) -- every mutation goes through server code like this instead, so
// this has to run with the service_role key, same as saveScenario. That key
// bypasses RLS entirely, which means the `.eq("user_id", user.id)` below
// isn't defense-in-depth the way it is in getUserScenarios (RLS + an
// explicit filter) -- for this one query it's the ONLY thing stopping a
// signed-in user from deleting a scenario that isn't theirs by editing the
// id client-side (an IDOR). scenarioId itself is fully attacker-controlled;
// user.id is not -- it comes from getServerUser()'s verified session, never
// from anything the client claims.
//
// .select("id") after the delete, checked for an actual row: never assume
// the delete matched anything just because Supabase didn't error -- a
// nonexistent id and someone else's id both silently match zero rows, and
// both should fail the exact same way (same generic error either way, so a
// user probing ids by trial and error can't tell "wrong id" from "not
// yours" from the response).
export async function deleteScenarioAction(scenarioId: string): Promise<DeleteScenarioResult> {
  const user = await getServerUser();
  if (!user) {
    return { success: false, error: "You must be signed in to delete a scenario." };
  }

  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data, error } = await supabase
    .from("scenarios")
    .delete()
    .eq("id", scenarioId)
    .eq("user_id", user.id)
    .select("id");

  if (error || !data || data.length === 0) {
    return { success: false, error: "Couldn't delete that scenario. Try again." };
  }

  return { success: true };
}
