import { createClient } from "@/utils/supabase/server";
import { jsonApiResponse } from "@/utils/server/api-response";
import { createRequestId, logServerEvent } from "@/utils/server/observability";
import { checkRateLimit, getClientIp } from "@/utils/server/rate-limit";
import { sendWelcomeEmailIfNeeded } from "@/utils/server/subscription-email";
import type { BillingPlanCode } from "@/utils/workspace/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const requestId = createRequestId();
  const rateLimit = checkRateLimit({
    namespace: "auth-welcome-email",
    key: getClientIp(request),
    limit: 4,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return jsonApiResponse(
      { error: "Muitas solicitações em pouco tempo." },
      {
        status: 429,
        requestId,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonApiResponse(
      { error: "Sessão inválida para enviar o e-mail de boas-vindas." },
      {
        status: 401,
        requestId,
      },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    planCode?: BillingPlanCode | null;
  };
  const planName = resolvePlanName(body.planCode ?? null);

  try {
    const result = await sendWelcomeEmailIfNeeded({
      supabase,
      user,
      originHint: request.url,
      planName,
    });

    logServerEvent({
      area: "auth",
      event: result.skipped ? "welcome_email_skipped" : "welcome_email_sent",
      requestId,
      userId: user.id,
      metadata: {
        reason: "reason" in result ? result.reason : null,
        planName: "planName" in result ? result.planName : planName,
      },
    });

    return jsonApiResponse(
      {
        success: true,
        skipped: result.skipped,
      },
      {
        requestId,
      },
    );
  } catch (error) {
    logServerEvent({
      area: "auth",
      event: "welcome_email_failed",
      level: "error",
      requestId,
      userId: user.id,
      metadata: {
        message: error instanceof Error ? error.message : "unknown",
      },
    });

    return jsonApiResponse(
      {
        error: "Não foi possível enviar o e-mail de boas-vindas agora.",
      },
      {
        status: 500,
        requestId,
      },
    );
  }
}

function resolvePlanName(planCode: BillingPlanCode | null) {
  if (planCode === "pro") return "Plano Pro";
  if (planCode === "founding") return "Plano Founding";
  if (planCode === "free") return "Plano Free";
  return null;
}
