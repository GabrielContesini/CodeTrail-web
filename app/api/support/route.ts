import {
  jsonApiResponse,
  PRIVATE_NO_STORE_CACHE_CONTROL,
} from "@/utils/server/api-response";
import { createRequestId, logServerEvent } from "@/utils/server/observability";
import { checkRateLimit, getClientIp } from "@/utils/server/rate-limit";
import { createClient } from "@/utils/supabase/server";
import { createSupportClickUpTask } from "@/utils/server/clickup-support";
import { sendSupportEmail } from "@/utils/server/support";
import { sanitizeSupportInput, validateSupportInput } from "@/utils/support/shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const requestId = createRequestId();
  const rateLimit = checkRateLimit({
    namespace: "support-submit",
    key: getClientIp(request),
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    logServerEvent({
      area: "support",
      event: "rate_limited",
      level: "warn",
      requestId,
      status: 429,
      metadata: {
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
    });

    return jsonApiResponse(
      { error: "Muitas mensagens em pouco tempo. Aguarde um pouco e tente novamente." },
      {
        status: 429,
        requestId,
        cacheControl: PRIVATE_NO_STORE_CACHE_CONTROL,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonApiResponse(
      { error: "Não foi possível ler os dados enviados." },
      {
        status: 400,
        requestId,
      },
    );
  }

  const input = sanitizeSupportInput(payload as Record<string, unknown>);
  const supportContext = await resolveSupportContext();
  const resolvedInput = {
    ...input,
    authenticated: supportContext.authenticated,
  };
  const validation = validateSupportInput(resolvedInput);

  if (!validation.valid) {
    return jsonApiResponse(
      {
        error: "Revise os campos obrigatórios antes de enviar.",
        fieldErrors: validation.fieldErrors,
      },
      {
        status: 400,
        requestId,
      },
    );
  }

  try {
    const emailMeta = await sendSupportEmail({
      input: resolvedInput,
      request,
      userPlan: supportContext.userPlan,
    });
    let clickUpMeta:
      | {
          created: true;
          taskId: string | null;
          taskUrl: string | null;
        }
      | {
          created: false;
          skippedReason: string;
        }
      | null = null;

    try {
      clickUpMeta = await createSupportClickUpTask({
        input: resolvedInput,
        userPlan: supportContext.userPlan,
        requestId,
      });
    } catch (error) {
      logServerEvent({
        area: "support",
        event: "clickup_task_failed",
        level: "warn",
        requestId,
        metadata: {
          origin: resolvedInput.origin,
          message: error instanceof Error ? error.message : "unknown",
        },
      });
    }

    logServerEvent({
      area: "support",
      event: "message_sent",
      requestId,
      metadata: {
        origin: resolvedInput.origin,
        authenticated: resolvedInput.authenticated,
        pageUrl: resolvedInput.pageUrl,
        userPlan: supportContext.userPlan,
        browser: emailMeta.browser,
        operatingSystem: emailMeta.operatingSystem,
        clickUpTaskId: clickUpMeta?.created ? clickUpMeta.taskId : null,
        clickUpSkippedReason: clickUpMeta && !clickUpMeta.created ? clickUpMeta.skippedReason : null,
      },
    });

    return jsonApiResponse(
      {
        success: true,
        message: "Sua mensagem foi enviada com sucesso. Nosso suporte retornará em breve.",
      },
      {
        requestId,
      },
    );
  } catch (error) {
    logServerEvent({
      area: "support",
      event: "message_failed",
      level: "error",
      requestId,
      status: 500,
      metadata: {
        origin: resolvedInput.origin,
        message: error instanceof Error ? error.message : "unknown",
      },
    });

    return jsonApiResponse(
      {
        error: "Não foi possível enviar sua mensagem agora. Tente novamente em instantes.",
      },
      {
        status: 500,
        requestId,
      },
    );
  }
}

async function resolveSupportContext() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        authenticated: false,
        userPlan: "Visitante / sem sessão",
      };
    }

    const { data: snapshot, error } = await supabase.rpc("get_my_billing_snapshot");
    if (error) {
      return {
        authenticated: true,
        userPlan: "Conta autenticada",
      };
    }

    const currentPlanName =
      snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
        ? (
            snapshot as {
              current_plan?: { name?: string | null } | null;
            }
          ).current_plan?.name
        : null;

    return {
      authenticated: true,
      userPlan: currentPlanName?.trim() || "Plano não identificado",
    };
  } catch {
    return {
      authenticated: false,
      userPlan: "Visitante / sem sessão",
    };
  }
}
