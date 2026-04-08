type LogLevel = "info" | "warn" | "error";

export type RouteErrorCategory =
  | "auth"
  | "validation"
  | "rate_limit"
  | "storage"
  | "upstream"
  | "config"
  | "internal";

type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | LogValue[]
  | { [key: string]: LogValue };

const REDACTED_KEYS = [
  "authorization",
  "cookie",
  "secret",
  "token",
  "password",
  "apikey",
  "api_key",
  "clientsecret",
  "client_secret",
];

export interface ServerLogEntry {
  area: string;
  event: string;
  level?: LogLevel;
  requestId?: string;
  userId?: string | null;
  status?: number;
  metadata?: Record<string, LogValue>;
}

export interface RouteLogContext {
  area: string;
  route: string;
  method: string;
  requestId: string;
  startedAt: number;
}

interface RouteLogCompletionOptions {
  status: number;
  event?: string;
  level?: LogLevel;
  userId?: string | null;
  errorCategory?: RouteErrorCategory;
  metadata?: Record<string, LogValue>;
}

export function createRequestId() {
  return crypto.randomUUID();
}

export function createRouteLogContext(options: {
  area: string;
  route: string;
  method: string;
  requestId?: string;
}): RouteLogContext {
  return {
    area: options.area,
    route: options.route,
    method: options.method.toUpperCase(),
    requestId: options.requestId ?? createRequestId(),
    startedAt: Date.now(),
  };
}

export function getRouteDurationMs(context: RouteLogContext) {
  return Date.now() - context.startedAt;
}

export function logRouteStart(
  context: RouteLogContext,
  metadata?: Record<string, LogValue>,
) {
  logServerEvent({
    area: context.area,
    event: "request_started",
    requestId: context.requestId,
    metadata: {
      route: context.route,
      method: context.method,
      ...metadata,
    },
  });
}

export function logRouteCompletion(
  context: RouteLogContext,
  options: RouteLogCompletionOptions,
) {
  const durationMs = getRouteDurationMs(context);

  logServerEvent({
    area: context.area,
    event:
      options.event ??
      (
        options.status >= 500
          ? "request_failed"
          : options.status >= 400
            ? "request_rejected"
            : "request_completed"
      ),
    level:
      options.level ??
      (options.status >= 500 ? "error" : options.status >= 400 ? "warn" : "info"),
    requestId: context.requestId,
    userId: options.userId,
    status: options.status,
    metadata: {
      route: context.route,
      method: context.method,
      durationMs,
      errorCategory: options.errorCategory,
      ...options.metadata,
    },
  });
}

export function logServerEvent({
  area,
  event,
  level = "info",
  requestId,
  userId,
  status,
  metadata,
}: ServerLogEntry) {
  const payload = sanitizeValue({
    timestamp: new Date().toISOString(),
    scope: "codetrail-web",
    area,
    event,
    requestId,
    userId,
    status,
    metadata,
  });

  console[level](JSON.stringify(payload));
}

export function getRouteErrorDetails(
  error: unknown,
  fallbackMessage = "Falha interna na rota.",
) {
  const message = getErrorMessage(error, fallbackMessage);
  const category = inferRouteErrorCategory(error);

  return {
    message,
    category,
    status: getStatusForRouteErrorCategory(category),
  };
}

function sanitizeValue(value: unknown, depth = 0): LogValue {
  if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (depth >= 4) {
    return "[truncated]";
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((entry) => sanitizeValue(entry, depth + 1));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 50);
    return Object.fromEntries(
      entries.map(([key, entryValue]) => {
        if (shouldRedact(key)) {
          return [key, "[redacted]"];
        }
        return [key, sanitizeValue(entryValue, depth + 1)];
      }),
    );
  }

  return String(value);
}

function shouldRedact(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
  return REDACTED_KEYS.some((candidate) => normalized.includes(candidate));
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}

function inferRouteErrorCategory(error: unknown): RouteErrorCategory {
  const message = normalizeMessage(
    error instanceof Error ? error.message : typeof error === "string" ? error : "",
  );

  if (!message) {
    return "internal";
  }

  if (
    message.includes("unauthorized") ||
    message.includes("sessao expirada") ||
    message.includes("sessao invalida") ||
    message.includes("faca login") ||
    message.includes("faça login")
  ) {
    return "auth";
  }

  if (
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    message.includes("muitas requisicoes") ||
    message.includes("muitas solicitacoes")
  ) {
    return "rate_limit";
  }

  if (
    message.includes("invalid") ||
    message.includes("invalido") ||
    message.includes("obrigatorio") ||
    message.includes("required")
  ) {
    return "validation";
  }

  if (
    message.includes("environment variables") ||
    message.includes("not configured") ||
    message.includes("missing ") ||
    message.includes("nao esta configurado") ||
    message.includes("não está configurado")
  ) {
    return "config";
  }

  if (
    message.includes("could not find the table") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("storage")
  ) {
    return "storage";
  }

  if (
    message.includes("stripe") ||
    message.includes("resend") ||
    message.includes("clickup") ||
    message.includes("fetch failed") ||
    message.includes("failed with status") ||
    message.includes("timed out") ||
    message.includes("timeout")
  ) {
    return "upstream";
  }

  return "internal";
}

function getStatusForRouteErrorCategory(category: RouteErrorCategory) {
  switch (category) {
    case "auth":
      return 401;
    case "validation":
      return 400;
    case "rate_limit":
      return 429;
    case "storage":
    case "config":
      return 503;
    case "upstream":
      return 502;
    case "internal":
    default:
      return 500;
  }
}

function normalizeMessage(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
