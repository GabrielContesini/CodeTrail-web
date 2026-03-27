import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  buildAuthErrorRedirect,
  buildPostAuthDestination,
  getOAuthErrorMessage,
  normalizeAuthNextPath,
  parseAuthFlowTarget,
  parseAuthPlan,
} from "@/utils/auth/oauth";
import { persistPlanIntent } from "@/utils/auth/plan-intent";
import { createRequestId, logServerEvent } from "@/utils/server/observability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const requestId = createRequestId();
  const plan = parseAuthPlan(request.nextUrl.searchParams.get("plan"));
  const target = parseAuthFlowTarget(request.nextUrl.searchParams.get("target"));
  const nextPath = normalizeAuthNextPath(request.nextUrl.searchParams.get("next"));
  const providerError = request.nextUrl.searchParams.get("error");
  const providerErrorDescription = request.nextUrl.searchParams.get("error_description");
  const code = request.nextUrl.searchParams.get("code");

  if (providerError) {
    const destination = buildAuthErrorRedirect({
      plan,
      target,
      nextPath,
      message: getOAuthErrorMessage(providerError, providerErrorDescription),
    });

    logServerEvent({
      area: "auth",
      event: "google_oauth_provider_error",
      level: "warn",
      requestId,
      metadata: {
        providerError,
      },
    });

    return NextResponse.redirect(new URL(destination, request.url), 303);
  }

  if (!code) {
    const destination = buildAuthErrorRedirect({
      plan,
      target,
      nextPath,
      message: "Não foi possível validar o retorno do Google.",
    });
    return NextResponse.redirect(new URL(destination, request.url), 303);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const destination = buildAuthErrorRedirect({
      plan,
      target,
      nextPath,
      message: getOAuthErrorMessage(exchangeError.message, providerErrorDescription),
    });

    logServerEvent({
      area: "auth",
      event: "google_oauth_exchange_failed",
      level: "error",
      requestId,
      metadata: {
        message: exchangeError.message,
      },
    });

    return NextResponse.redirect(new URL(destination, request.url), 303);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const destination = buildAuthErrorRedirect({
      plan,
      target,
      nextPath,
      message: "A sessão do Google não pôde ser restaurada. Tente novamente.",
    });

    logServerEvent({
      area: "auth",
      event: "google_oauth_user_missing",
      level: "error",
      requestId,
      metadata: {
        message: userError?.message ?? "missing_user_after_exchange",
      },
    });

    return NextResponse.redirect(new URL(destination, request.url), 303);
  }

  if (plan) {
    try {
      await persistPlanIntent(supabase, {
        userId: user.id,
        selectedPlan: plan,
        source: "google_oauth",
        platformInterest: target === "download" ? "windows" : "web",
      });
    } catch (error) {
      logServerEvent({
        area: "auth",
        event: "google_oauth_plan_intent_failed",
        level: "warn",
        requestId,
        userId: user.id,
        metadata: {
          message: error instanceof Error ? error.message : "unknown",
          plan,
        },
      });
    }
  }

  const destination = buildPostAuthDestination({
    plan,
    target,
    nextPath,
  });

  logServerEvent({
    area: "auth",
    event: "google_oauth_completed",
    requestId,
    userId: user.id,
    metadata: {
      destination,
      plan,
      target,
    },
  });

  return NextResponse.redirect(new URL(destination, request.url), 303);
}
