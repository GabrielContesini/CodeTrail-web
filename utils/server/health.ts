import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  getRouteErrorDetails,
  type RouteErrorCategory,
} from "@/utils/server/observability";

const STRIPE_API_BASE_URL = "https://api.stripe.com/v1";
const HEALTHCHECK_TIMEOUT_MS = 4_000;
const DEFAULT_CLICKUP_SUPPORT_LIST_ID = "901712375712";

export type ApiHealthStatus = "ok" | "degraded" | "error";
export type ApiHealthCheckStatus = ApiHealthStatus | "skipped";

export interface ApiHealthCheck {
  status: ApiHealthCheckStatus;
  critical: boolean;
  summary: string;
  errorCategory?: RouteErrorCategory;
  details?: Record<string, unknown>;
}

export interface ApiHealthReport {
  status: ApiHealthStatus;
  timestamp: string;
  summary: {
    ok: number;
    skipped: number;
    degraded: number;
    error: number;
  };
  checks: {
    app: ApiHealthCheck;
    auth: ApiHealthCheck;
    supabase: ApiHealthCheck;
    billing: ApiHealthCheck;
    integrations: ApiHealthCheck;
  };
}

export async function collectApiHealthReport(): Promise<ApiHealthReport> {
  const timestamp = new Date().toISOString();

  const [app, auth, supabase, billing, integrations] = await Promise.all([
    runHealthCheck(checkAppHealth, {
      critical: true,
      fallbackSummary: "A API respondeu, mas a verificação básica da aplicação falhou.",
    }),
    runHealthCheck(checkAuthHealth, {
      critical: true,
      fallbackSummary: "Não foi possível verificar a camada de autenticação.",
    }),
    runHealthCheck(checkSupabaseHealth, {
      critical: true,
      fallbackSummary: "Não foi possível verificar o banco e o storage do Supabase.",
    }),
    runHealthCheck(checkBillingHealth, {
      critical: true,
      fallbackSummary: "Não foi possível verificar a prontidão do billing.",
    }),
    runHealthCheck(checkIntegrationHealth, {
      critical: false,
      fallbackSummary: "Não foi possível verificar as integrações auxiliares.",
    }),
  ]);

  const checks = {
    app,
    auth,
    supabase,
    billing,
    integrations,
  };

  return {
    status: computeOverallHealthStatus(checks),
    timestamp,
    summary: summarizeChecks(checks),
    checks,
  };
}

async function checkAppHealth(): Promise<ApiHealthCheck> {
  return {
    status: "ok",
    critical: true,
    summary: "App Router operacional.",
    details: {
      service: "codetrail-web",
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    },
  };
}

async function checkAuthHealth(): Promise<ApiHealthCheck> {
  const env = resolvePublicSupabaseEnv();
  if (!env.url || !env.anonKey) {
    return {
      status: "error",
      critical: true,
      summary: "Supabase auth não está configurado com URL pública e anon key.",
      errorCategory: "config",
      details: {
        supabaseUrlConfigured: Boolean(env.url),
        supabaseAnonKeyConfigured: Boolean(env.anonKey),
      },
    };
  }

  const response = await fetchWithTimeout(`${env.url}/auth/v1/settings`, {
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${env.anonKey}`,
    },
  });

  if (!response.ok) {
    return {
      status: "error",
      critical: true,
      summary: "Supabase auth respondeu com erro.",
      errorCategory: "upstream",
      details: {
        endpoint: "/auth/v1/settings",
        status: response.status,
      },
    };
  }

  return {
    status: "ok",
    critical: true,
    summary: "Camada de auth/session do Supabase acessível.",
    details: {
      provider: "supabase-auth",
      endpoint: "/auth/v1/settings",
    },
  };
}

async function checkSupabaseHealth(): Promise<ApiHealthCheck> {
  const env = resolveAdminSupabaseEnv();
  if (!env.url) {
    return {
      status: "error",
      critical: true,
      summary: "Não foi possível validar o banco porque a URL administrativa do Supabase não está configurada.",
      errorCategory: "config",
      details: {
        supabaseUrlConfigured: false,
        serviceRoleConfigured: Boolean(env.serviceRoleKey),
        databaseReady: null,
        supportStorageReady: null,
      },
    };
  }

  if (!env.serviceRoleKey) {
    return {
      status: "skipped",
      critical: true,
      summary: "O probe administrativo do Supabase foi pulado porque a service role não está disponível neste ambiente.",
      errorCategory: "config",
      details: {
        supabaseUrlConfigured: Boolean(env.url),
        serviceRoleConfigured: false,
        databaseReady: null,
        supportStorageReady: null,
        probeSkipped: true,
      },
    };
  }

  const adminClient = createSupabaseClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const [{ error: databaseError }, { error: supportStorageError }] =
    await Promise.all([
      adminClient.from("profiles").select("id").limit(1),
      adminClient.from("support_conversations").select("id").limit(1),
    ]);

  if (!databaseError && !supportStorageError) {
    return {
      status: "ok",
      critical: true,
      summary: "Banco principal e storage persistente do suporte estão acessíveis.",
      details: {
        databaseReady: true,
        supportStorageReady: true,
      },
    };
  }

  if (!databaseError && supportStorageError) {
    return {
      status: "degraded",
      critical: true,
      summary: "Banco principal está acessível, mas o storage persistente do suporte falhou.",
      errorCategory: "storage",
      details: {
        databaseReady: true,
        supportStorageReady: false,
        supportStorageMessage: supportStorageError.message,
      },
    };
  }

  return {
    status: "error",
    critical: true,
    summary: "Banco principal do Supabase não respondeu como esperado.",
    errorCategory: "storage",
    details: {
      databaseReady: false,
      databaseMessage: databaseError?.message ?? "Unknown database error.",
      supportStorageReady: supportStorageError ? false : true,
      supportStorageMessage: supportStorageError?.message ?? null,
    },
  };
}

async function checkBillingHealth(): Promise<ApiHealthCheck> {
  const publicEnv = resolvePublicSupabaseEnv();
  const publishableKey =
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    "";
  const stripeSecretKey =
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.PRODUCT_STRIPE_SECRET_KEY?.trim() ||
    "";

  const edgeFunctionsConfigured = Boolean(publicEnv.url && publicEnv.anonKey);
  const publishableKeyConfigured = publishableKey.length > 0;
  const secretKeyConfigured = stripeSecretKey.length > 0;

  if (!edgeFunctionsConfigured || !publishableKeyConfigured) {
    return {
      status: "error",
      critical: true,
      summary: "Billing não está pronto: faltam variáveis essenciais de Supabase ou Stripe.",
      errorCategory: "config",
      details: {
        edgeFunctionsConfigured,
        stripePublishableKeyConfigured: publishableKeyConfigured,
        stripeSecretKeyConfigured: secretKeyConfigured,
      },
    };
  }

  if (!secretKeyConfigured) {
    return {
      status: "skipped",
      critical: true,
      summary: "O probe ativo do Stripe foi pulado porque o secret key não está disponível neste ambiente.",
      errorCategory: "config",
      details: {
        edgeFunctionsConfigured,
        stripePublishableKeyConfigured: publishableKeyConfigured,
        stripeSecretKeyConfigured: false,
        stripeReachable: null,
        probeSkipped: true,
      },
    };
  }

  const stripeResponse = await fetchWithTimeout(
    `${STRIPE_API_BASE_URL}/customers?limit=1`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    },
  );

  if (!stripeResponse.ok) {
    return {
      status: "error",
      critical: true,
      summary: "Stripe respondeu com erro no probe de billing.",
      errorCategory: "upstream",
      details: {
        edgeFunctionsConfigured,
        stripePublishableKeyConfigured: true,
        stripeSecretKeyConfigured: true,
        stripeReachable: false,
        stripeStatus: stripeResponse.status,
      },
    };
  }

  return {
    status: "ok",
    critical: true,
    summary: "Billing pronto com Stripe acessível e dependências essenciais configuradas.",
    details: {
      edgeFunctionsConfigured,
      stripePublishableKeyConfigured: true,
      stripeSecretKeyConfigured: true,
      stripeReachable: true,
    },
  };
}

async function checkIntegrationHealth(): Promise<ApiHealthCheck> {
  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  const clickupConfigured = Boolean(
    process.env.CLICKUP_API_TOKEN?.trim() &&
      normalizeClickUpId(
        process.env.CLICKUP_SUPPORT_LIST_ID ||
          process.env.CLICKUP_LIST_ID ||
          DEFAULT_CLICKUP_SUPPORT_LIST_ID,
      ),
  );

  if (resendConfigured && clickupConfigured) {
    return {
      status: "ok",
      critical: false,
      summary: "Integrações auxiliares críticas estão configuradas.",
      details: {
        resendConfigured: true,
        clickupConfigured: true,
      },
    };
  }

  return {
    status: "degraded",
    critical: false,
    summary: "Uma ou mais integrações auxiliares não estão configuradas.",
    errorCategory: "config",
    details: {
      resendConfigured,
      clickupConfigured,
    },
  };
}

async function runHealthCheck(
  check: () => Promise<ApiHealthCheck>,
  options: { critical: boolean; fallbackSummary: string },
) {
  try {
    return await check();
  } catch (error) {
    const details = getRouteErrorDetails(error, options.fallbackSummary);

    return {
      status: "error",
      critical: options.critical,
      summary: details.message,
      errorCategory: details.category,
      details: {
        message: details.message,
      },
    } satisfies ApiHealthCheck;
  }
}

function computeOverallHealthStatus(checks: Record<string, ApiHealthCheck>): ApiHealthStatus {
  const values = Object.values(checks);

  if (values.some((check) => check.critical && check.status === "error")) {
    return "error";
  }

  if (values.some((check) => check.status === "degraded")) {
    return "degraded";
  }

  return "ok";
}

function summarizeChecks(checks: Record<string, ApiHealthCheck>) {
  return Object.values(checks).reduce(
    (accumulator, check) => {
      accumulator[check.status] += 1;
      return accumulator;
    },
    {
      ok: 0,
      skipped: 0,
      degraded: 0,
      error: 0,
    },
  );
}

function resolvePublicSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "",
  };
}

function resolveAdminSupabaseEnv() {
  return {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      process.env.PRODUCT_SUPABASE_URL?.trim() ||
      "",
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      process.env.PRODUCT_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      "",
  };
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  return await fetch(input, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(HEALTHCHECK_TIMEOUT_MS),
  });
}

function normalizeClickUpId(value: string | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/\d+/);
  return match ? match[0] : null;
}
