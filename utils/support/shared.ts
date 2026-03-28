export const SUPPORT_LIMITS = {
  name: 80,
  email: 160,
  subject: 120,
  description: 1600,
  pageUrl: 600,
} as const;

export const SUPPORT_ORIGINS = ["Landing Page", "Web App"] as const;

export type SupportOrigin = (typeof SUPPORT_ORIGINS)[number];

export interface SupportRequestInput {
  name: string;
  email: string;
  subject: string;
  description: string;
  pageUrl: string;
  origin: SupportOrigin;
  authenticated: boolean;
}

export type SupportFieldErrorMap = Partial<
  Record<"name" | "email" | "subject" | "description", string>
>;

export function sanitizeSupportInput(input: Partial<SupportRequestInput> | null | undefined): SupportRequestInput {
  const origin = SUPPORT_ORIGINS.includes(input?.origin as SupportOrigin)
    ? (input?.origin as SupportOrigin)
    : "Web App";

  return {
    name: sanitizeText(input?.name, SUPPORT_LIMITS.name),
    email: sanitizeText(input?.email, SUPPORT_LIMITS.email).toLowerCase(),
    subject: sanitizeText(input?.subject, SUPPORT_LIMITS.subject),
    description: sanitizeMultilineText(input?.description, SUPPORT_LIMITS.description),
    pageUrl: sanitizeText(input?.pageUrl, SUPPORT_LIMITS.pageUrl),
    origin,
    authenticated: Boolean(input?.authenticated),
  };
}

export function validateSupportInput(input: SupportRequestInput) {
  const fieldErrors: SupportFieldErrorMap = {};

  if (!input.name) {
    fieldErrors.name = "Informe seu nome.";
  }

  if (!input.email) {
    fieldErrors.email = "Informe seu e-mail.";
  } else if (!isValidEmail(input.email)) {
    fieldErrors.email = "Informe um e-mail válido.";
  }

  if (!input.subject) {
    fieldErrors.subject = "Informe um assunto.";
  }

  if (!input.description) {
    fieldErrors.description = "Descreva o problema que está acontecendo.";
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeMultilineText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}
