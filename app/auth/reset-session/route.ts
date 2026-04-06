import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { EXISTING_ACCOUNT_CONFLICT_MESSAGE } from "@/utils/server/auth-session-conflict";

const SESSION_RESET_MESSAGE = "Sua sessão foi redefinida. Faça login novamente.";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const reason = request.nextUrl.searchParams.get("reason");
  const redirectUrl = new URL("/auth", request.url);
  redirectUrl.searchParams.set(
    "auth_reason",
    reason === "existing_account_conflict"
      ? "existing_account_conflict"
      : "session_reset",
  );
  redirectUrl.searchParams.set(
    "auth_error",
    reason === "existing_account_conflict"
      ? EXISTING_ACCOUNT_CONFLICT_MESSAGE
      : SESSION_RESET_MESSAGE,
  );

  return NextResponse.redirect(redirectUrl, 303);
}
