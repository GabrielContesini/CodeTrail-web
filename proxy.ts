import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  if (user) {
    return response;
  }

  const redirectUrl = new URL("/auth", request.nextUrl.origin);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  redirectUrl.searchParams.set("next", nextPath);

  const redirectResponse = NextResponse.redirect(redirectUrl);

  for (const cookie of response.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }

  return redirectResponse;
}

export const config = {
  matcher: ["/workspace/:path*"],
};
