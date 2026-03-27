import type { BillingPlanCode } from "@/utils/workspace/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const plan = parsePlan(request.nextUrl.searchParams.get("plan"));
  const returnTo = normalizeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  if (!plan) {
    return NextResponse.redirect(new URL("/auth?billing_error=Plano%20inv%C3%A1lido.", request.url), 303);
  }

  try {
    return NextResponse.redirect(
      new URL(`/workspace/settings/billing?checkout=${plan}`, request.url),
      303,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao iniciar checkout.";
    const fallback = new URL(returnTo === "/auth" ? "/auth" : returnTo, request.url);

    if (fallback.pathname === "/auth") {
      fallback.searchParams.set("plan", plan);
    }

    fallback.searchParams.set("billing_error", message);
    return NextResponse.redirect(fallback, 303);
  }
}

function parsePlan(value: string | null): BillingPlanCode | null {
  if (value === "free" || value === "pro" || value === "founding") {
    return value;
  }

  return null;
}

function normalizeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/auth";
  }

  return value;
}
