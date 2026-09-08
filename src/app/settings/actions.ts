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
