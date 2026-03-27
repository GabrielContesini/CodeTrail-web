import type { BillingCheckoutSession, BillingPlanCode, BillingSnapshot } from "@/utils/workspace/types";
import { requireAuthenticatedServerContext } from "@/utils/server/supabase-auth";
import { logServerEvent } from "@/utils/server/observability";

const BILLING_FUNCTIONS = {
  checkout: "billing-create-checkout",
  portal: "billing-create-portal-session",
  cancel: "billing-cancel-subscription",
  sync: "billing-sync-subscription",
} as const;

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
  return await invokeBillingFunctionOnServer<{ url: string }>(
    request,
    BILLING_FUNCTIONS.portal,
    payload.returnUrl ? { returnUrl: payload.returnUrl } : {},
    requestId,
  );
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
  return await invokeBillingFunctionOnServer<{ snapshot?: BillingSnapshot; status?: string }>(
    request,
    BILLING_FUNCTIONS.sync,
    {},
    requestId,
  );
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

export function parseReturnUrl(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
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
