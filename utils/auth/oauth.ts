import type { BillingPlanCode } from "@/utils/workspace/types";

export type AuthFlowTarget = "workspace" | "download";

export function parseAuthFlowTarget(value: string | null | undefined): AuthFlowTarget {
  return value === "download" ? "download" : "workspace";
}

export function parseAuthPlan(value: string | null | undefined): BillingPlanCode | null {
  return value === "free" || value === "pro" || value === "founding" ? value : null;
}

export function normalizeAuthNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/")) {
    return null;
  }

  if (value.startsWith("//")) {
    return null;
  }

  return value;
}

export function normalizeCheckoutReturnUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const configuredLandingOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_CODETRAIL_LANDING_URL);
    const isConfiguredLanding = configuredLandingOrigin ? url.origin === configuredLandingOrigin : false;
    const isDefaultLanding =
      url.origin === "https://www.codetrail.site" ||
      url.origin === "https://www.codetrail.site/" ||
      url.origin === "https://codetrail.site";
    const isLocalLanding = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (isConfiguredLanding || isDefaultLanding || isLocalLanding) {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export function buildPostAuthDestination(options: {
  plan: BillingPlanCode | null;
  target: AuthFlowTarget;
  nextPath?: string | null;
}) {
  if (options.plan === "pro" || options.plan === "founding") {
    return `/workspace/settings/billing?checkout=${options.plan}`;
  }

  if (options.nextPath) {
    return options.nextPath;
  }

  return options.target === "download" ? "/download/windows" : "/workspace/dashboard";
}

export function buildGoogleCallbackUrl(options: {
  origin: string;
  plan: BillingPlanCode | null;
  target: AuthFlowTarget;
  nextPath?: string | null;
  checkoutReturnTo?: string | null;
  source?: "page" | "modal";
}) {
  const url = new URL("/auth/callback", options.origin);

  if (options.plan) {
    url.searchParams.set("plan", options.plan);
  }

  if (options.target !== "workspace") {
    url.searchParams.set("target", options.target);
  }

  if (options.nextPath) {
    url.searchParams.set("next", options.nextPath);
  }

  if (options.checkoutReturnTo) {
    url.searchParams.set("returnTo", options.checkoutReturnTo);
  }

  if (options.source) {
    url.searchParams.set("source", options.source);
  }

  return url.toString();
}

export function buildAuthErrorRedirect(options: {
  plan: BillingPlanCode | null;
  target: AuthFlowTarget;
  nextPath?: string | null;
  checkoutReturnTo?: string | null;
  message: string;
}) {
  const params = new URLSearchParams();

  if (options.plan) {
    params.set("plan", options.plan);
  }

  if (options.target !== "workspace") {
    params.set("target", options.target);
  }

  if (options.nextPath) {
    params.set("next", options.nextPath);
  }

  if (options.checkoutReturnTo) {
    params.set("returnTo", options.checkoutReturnTo);
  }

  params.set("auth_error", options.message);

  return `/auth?${params.toString()}`;
}

export function getOAuthErrorMessage(
  errorCode: string | null | undefined,
  errorDescription: string | null | undefined,
) {
  const normalizedCode = (errorCode ?? "").toLowerCase();
  const normalizedDescription = decodeURIComponent(errorDescription ?? "").toLowerCase();

  if (normalizedCode.includes("access_denied") || normalizedDescription.includes("access denied")) {
    return "A autenticação com Google foi cancelada antes da conclusão.";
  }

  if (normalizedDescription.includes("email") && normalizedDescription.includes("registered")) {
    return "Esta conta já existe com outro método de acesso. Entre primeiro e conecte o Google depois.";
  }

  if (
    normalizedDescription.includes("unsupported provider") ||
    normalizedDescription.includes("provider is not enabled")
  ) {
    return "O login com Google ainda não está habilitado neste ambiente do CodeTrail.";
  }

  return "Não foi possível concluir a autenticação com Google. Tente novamente.";
}

export function getAuthErrorMessage(error: Error | { message?: string } | unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "";

  if (message.includes("Invalid login credentials")) return "Credenciais incorretas (E-mail ou senha).";
  if (message.includes("User already registered")) return "Este e-mail já está sendo utilizado.";
  if (message.includes("Password should be at least")) return "A senha deve ter no mínimo 6 caracteres.";
  if (message.includes("rate limit")) return "Muitas tentativas em pouco tempo. Aguarde um momento.";
  if (message.includes("Email not confirmed")) return "Verifique sua caixa de e-mail para validar a conta antes de entrar.";
  if (message.includes("popup_closed_by_user")) return "A autenticação com Google foi cancelada antes da conclusão.";
  if (message.includes("Unsupported provider") || message.includes("provider is not enabled")) {
    return "O login com Google ainda não está habilitado neste ambiente do CodeTrail.";
  }
  return "Falha de comunicação com os servidores. Verifique sua conexão e tente novamente.";
}

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
