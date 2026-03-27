type LogLevel = "info" | "warn" | "error";

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

export function createRequestId() {
  return crypto.randomUUID();
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
