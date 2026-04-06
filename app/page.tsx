import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { findExistingAccountConflict } from "@/utils/server/auth-session-conflict";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
    return null;
  }

  const existingAccountConflict = await findExistingAccountConflict({
    currentUserId: user.id,
    email: user.email,
  });

  if (existingAccountConflict) {
    redirect("/auth/reset-session?reason=existing_account_conflict");
    return null;
  }

  redirect("/workspace/dashboard");
  return null;
}
