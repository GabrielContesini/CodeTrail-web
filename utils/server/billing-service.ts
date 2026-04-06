import type { BillingCheckoutSession, BillingPlanCode, BillingSnapshot } from "@/utils/workspace/types";
import { requireAuthenticatedServerContext } from "@/utils/server/supabase-auth";
import { logServerEvent } from "@/utils/server/observability";

const BILLING_FUNCTIONS = {
  checkout: "billing-create-checkout",
  portal: "billing-create-portal-session",
  cancel: "billing-cancel-subscription",
  sync: "billing-sync-subscription",
} as const;

const STRIPE_API_BASE_URL = "https://api.stripe.com/v1";
const STRIPE_API_VERSION = "2026-02-25.clover";
const EDGE_FUNCTION_NOT_FOUND_MESSAGE = "requested function was not found";

export class BillingServiceError extends Error {
  constructor(message: string, readonly status = 500) {
    super(message);
    this.name = "BillingServiceError";
  }
}

export async function createCheckoutOnServer(
  request: Request,
  payload: {
    planCode: BillingPlanCode;
    returnUrl?: string | null;
    uiMode?: "hosted" | "embedded";
  },
  requestId?: string,
) {
  return await invokeBillingFunctionOnServer<BillingCheckoutSession>(
    request,
    BILLING_FUNCTIONS.checkout,
    {
      planCode: payload.planCode,
      returnUrl: payload.returnUrl,
      uiMode: payload.uiMode ?? "hosted",
    },
    requestId,
  );
}

export async function createPortalOnServer(
  request: Request,
  payload: {
    returnUrl?: string | null;
  },
  requestId?: string,
) {
  try {
    return await invokeBillingFunctionOnServer<{ url: string }>(
      request,
      BILLING_FUNCTIONS.portal,
      payload.returnUrl ? { returnUrl: payload.returnUrl } : {},
      requestId,
    );
  } catch (error) {
    if (!shouldUseDirectStripePortalFallback(error)) {
      throw error;
    }

    logServerEvent({
      area: "billing",
      event: "portal_function_missing_direct_fallback",
      level: "warn",
      requestId,
      metadata: {
        functionName: BILLING_FUNCTIONS.portal,
        message: error instanceof Error ? error.message : "Unknown portal error.",
      },
    });

    return await createPortalSessionDirectlyOnServer(
      request,
      payload.returnUrl ?? null,
      requestId,
    );
  }
}

export async function cancelSubscriptionOnServer(request: Request, requestId?: string) {
  return await invokeBillingFunctionOnServer<{ snapshot?: BillingSnapshot }>(
    request,
    BILLING_FUNCTIONS.cancel,
    {},
    requestId,
  );
}

export async function syncBillingOnServer(request: Request, requestId?: string) {
  try {
    return await invokeBillingFunctionOnServer<{ snapshot?: BillingSnapshot; status?: string }>(
      request,
      BILLING_FUNCTIONS.sync,
      {},
      requestId,
    );
  } catch (error) {
    if (error instanceof BillingServiceError && error.status === 404) {
      const snapshot = await getBillingSnapshotOnServer(request, requestId);

      logServerEvent({
        area: "billing",
        event: "sync_function_missing_snapshot_fallback",
        level: "warn",
        requestId,
        metadata: {
          message: error.message,
          functionName: BILLING_FUNCTIONS.sync,
        },
      });

      return {
        snapshot,
        status: "snapshot_only",
      };
    }

    throw error;
  }
}

export async function getBillingSnapshotOnServer(request: Request, requestId?: string) {
  const context = await requireAuthenticatedServerContext(request);
  const supabase = context.supabase;
  if (!supabase) {
    throw new BillingServiceError("Billing snapshot requires a cookie-backed session.", 401);
  }

  const { data, error } = await supabase.rpc("get_my_billing_snapshot");
  if (error) {
    logServerEvent({
      area: "billing",
      event: "snapshot_rpc_failed",
      level: "error",
      requestId,
      userId: context.user.id,
      metadata: {
        message: error.message,
      },
    });
    throw new BillingServiceError(error.message, 500);
  }

  return data as BillingSnapshot;
}

export function parseBillingPlanCode(value: unknown): BillingPlanCode | null {
  return value === "free" || value === "pro" || value === "founding" ? value : null;
}

export function parseBillingUiMode(value: unknown): "hosted" | "embedded" {
  return value === "embedded" ? "embedded" : "hosted";
}

const ALLOWED_ORIGINS = new Set([
  "https://codetrail.com",
  "https://app.codetrail.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
]);

if (process.env.NEXT_PUBLIC_CODETRAIL_LANDING_URL) {
  try {
    ALLOWED_ORIGINS.add(new URL(process.env.NEXT_PUBLIC_CODETRAIL_LANDING_URL).origin);
  } catch {}
}

if (process.env.APP_DASHBOARD_URL) {
  try {
    ALLOWED_ORIGINS.add(new URL(process.env.APP_DASHBOARD_URL).origin);
  } catch {}
}

export function parseReturnUrl(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    const url = new URL(value);
    if (!ALLOWED_ORIGINS.has(url.origin)) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function getBillingServiceErrorDetails(error: unknown) {
  if (error instanceof BillingServiceError) {
    return {
      message: error.message,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    if (
      error.message === "Unauthorized request." ||
      error.message === "Sessao expirada. Faca login novamente."
    ) {
      return {
        message: error.message,
        status: 401,
      };
    }

    return {
      message: error.message,
      status: 500,
    };
  }

  return {
    message: "Falha no billing.",
    status: 500,
  };
}

function readBillingErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  if ("error" in payload && payload.error) {
    return String(payload.error);
  }

  if ("message" in payload && payload.message) {
    return String(payload.message);
  }

  return "";
}

function readStripeErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  if (
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    payload.error.message
  ) {
    return String(payload.error.message);
  }

  return readBillingErrorPayload(payload);
}

function shouldUseDirectStripePortalFallback(error: unknown) {
  if (!(error instanceof BillingServiceError)) {
    return false;
  }

  const normalizedMessage = error.message.toLowerCase();
  return (
    error.status === 404 ||
    normalizedMessage.includes(EDGE_FUNCTION_NOT_FOUND_MESSAGE)
  );
}

function resolveStripeSecretKey() {
  return (
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.PRODUCT_STRIPE_SECRET_KEY?.trim() ||
    null
  );
}

async function createPortalSessionDirectlyOnServer(
  request: Request,
  returnUrl: string | null,
  requestId?: string,
) {
  const secretKey = resolveStripeSecretKey();
  if (!secretKey) {
    throw new BillingServiceError(
      "O portal de assinatura nao esta configurado neste ambiente.",
      503,
    );
  }

  const snapshot = await getBillingSnapshotOnServer(request, requestId);
  const provider = snapshot.customer?.gateway_provider ?? snapshot.config.billing_provider;
  const customerId = snapshot.customer?.gateway_customer_id?.trim() ?? "";

  if (provider !== "stripe") {
    throw new BillingServiceError(
      "O portal de assinatura nao esta disponivel para o provedor configurado.",
      503,
    );
  }

  if (!customerId) {
    throw new BillingServiceError(
      "Nao foi possivel localizar o cliente de billing desta conta.",
      409,
    );
  }

  const body = new URLSearchParams();
  body.set("customer", customerId);

  if (returnUrl) {
    body.set("return_url", returnUrl);
  }

  const response = await fetch(`${STRIPE_API_BASE_URL}/billing_portal/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body: body.toString(),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const providerMessage = readStripeErrorPayload(payload);

    logServerEvent({
      area: "billing",
      event: "direct_portal_failed",
      level: response.status >= 500 ? "error" : "warn",
      requestId,
      status: response.status,
      metadata: {
        message: providerMessage || "Stripe portal request failed.",
      },
    });

    if (response.status === 404) {
      throw new BillingServiceError(
        "Nao foi possivel localizar o cliente de billing desta conta.",
        409,
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new BillingServiceError(
        "O portal de assinatura nao esta configurado corretamente neste ambiente.",
        503,
      );
    }

    throw new BillingServiceError(
      "Nao foi possivel abrir o portal de assinatura agora.",
      response.status >= 500 ? 502 : response.status,
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("url" in payload) ||
    typeof payload.url !== "string"
  ) {
    throw new BillingServiceError(
      "Resposta invalida ao criar sessao do portal.",
      502,
    );
  }

  return {
    url: payload.url,
  };
}

async function invokeBillingFunctionOnServer<T>(
  request: Request,
  functionName: (typeof BILLING_FUNCTIONS)[keyof typeof BILLING_FUNCTIONS],
  body: Record<string, unknown>,
  requestId?: string,
) {
  const context = await requireAuthenticatedServerContext(request);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new BillingServiceError("Supabase environment variables are not configured.", 500);
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      "x-supabase-auth": `Bearer ${context.accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      readBillingErrorPayload(payload) ||
      `Billing function ${functionName} failed with status ${response.status}.`;

    logServerEvent({
      area: "billing",
      event: "edge_function_failed",
      level: response.status >= 500 ? "error" : "warn",
      requestId,
      userId: context.user.id,
      status: response.status,
      metadata: {
        functionName,
        message,
      },
    });

    throw new BillingServiceError(message, response.status);
  }

  return payload as T;
}
