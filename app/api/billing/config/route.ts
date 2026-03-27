import {
  jsonApiResponse,
  PRIVATE_NO_STORE_CACHE_CONTROL,
  PUBLIC_CONFIG_CACHE_CONTROL,
} from "@/utils/server/api-response";
import { createRequestId, logServerEvent } from "@/utils/server/observability";
import { checkRateLimit, getClientIp } from "@/utils/server/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const requestId = createRequestId();
  const rateLimit = checkRateLimit({
    namespace: "billing-config",
    key: getClientIp(request),
    limit: 90,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    logServerEvent({
      area: "billing",
      event: "config_rate_limited",
      level: "warn",
      requestId,
      status: 429,
      metadata: {
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
    });

    return jsonApiResponse(
      { error: "Muitas requisicoes para a configuracao de billing. Tente novamente em instantes." },
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

  const publishableKey =
    process.env.STRIPE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    logServerEvent({
      area: "billing",
      event: "config_missing_publishable_key",
      level: "error",
      requestId,
      status: 500,
    });

    return jsonApiResponse(
      { error: "Missing Stripe publishable key." },
      {
        status: 500,
        requestId,
        cacheControl: PRIVATE_NO_STORE_CACHE_CONTROL,
      },
    );
  }

  return jsonApiResponse(
    {
      publishableKey,
    },
    {
      requestId,
      cacheControl: PUBLIC_CONFIG_CACHE_CONTROL,
      headers: {
        Vary: "x-forwarded-for, x-real-ip",
      },
    },
  );
}
