import { NextRequest } from "next/server";
import {
  jsonApiResponse,
  PRIVATE_NO_STORE_CACHE_CONTROL,
} from "@/utils/server/api-response";
import {
  createCheckoutOnServer,
  getBillingServiceErrorDetails,
  parseBillingPlanCode,
  parseBillingUiMode,
  parseReturnUrl,
} from "@/utils/server/billing-service";
import { createRequestId, logServerEvent } from "@/utils/server/observability";
import { checkRateLimit, getClientIp } from "@/utils/server/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const requestId = createRequestId();

  const rateLimit = checkRateLimit({
    namespace: "billing",
    key: getClientIp(request),
    limit: 5,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return jsonApiResponse(
      { error: "Too many requests" },
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

  try {
    const body = await request.json().catch(() => ({}));
    const planCode = parseBillingPlanCode(body.planCode);

    if (planCode !== "pro" && planCode !== "founding") {
      return jsonApiResponse(
        { error: "Plano de checkout invalido." },
        {
          status: 422,
          requestId,
          cacheControl: PRIVATE_NO_STORE_CACHE_CONTROL,
        },
      );
    }

    const checkout = await createCheckoutOnServer(
      request,
      {
        planCode,
        uiMode: parseBillingUiMode(body.uiMode),
        returnUrl: parseReturnUrl(body.returnUrl),
      },
      requestId,
    );

    return jsonApiResponse(checkout, {
      requestId,
      cacheControl: PRIVATE_NO_STORE_CACHE_CONTROL,
    });
  } catch (error) {
    const { message, status } = getBillingServiceErrorDetails(error);
    logServerEvent({
      area: "billing",
      event: "internal_checkout_failed",
      level: "error",
      requestId,
      metadata: {
        message,
      },
    });

    return jsonApiResponse(
      { error: message },
      {
        status,
        requestId,
        cacheControl: PRIVATE_NO_STORE_CACHE_CONTROL,
      },
    );
  }
}
