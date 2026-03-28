import type { SupportRequestInput } from "@/utils/support/shared";

const SUPPORT_DESTINATION = "suporte.codetrail@gmail.com";
const SUPPORT_TEMPLATE_ID =
  process.env.RESEND_SUPPORT_TEMPLATE_ID || "new-support-contact";
const DEFAULT_FROM = "CodeTrail Suporte <onboarding@resend.dev>";
const SUPPORT_TEMPLATE_SUBJECT = "Novo Suporte solicitado ⚠️";

export async function sendSupportEmail(options: {
  input: SupportRequestInput;
  request: Request;
  userPlan: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error("Missing Resend API key.");
  }

  const sentAt = new Date().toISOString();
  const userAgent = options.request.headers.get("user-agent")?.trim() || "Não informado";
  const browser = detectBrowser(userAgent);
  const operatingSystem = detectOperatingSystem(userAgent);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
      to: [SUPPORT_DESTINATION],
      reply_to: options.input.email,
      subject: SUPPORT_TEMPLATE_SUBJECT,
      template: {
        id: SUPPORT_TEMPLATE_ID,
        variables: {
          user_name: options.input.name,
          user_email: options.input.email,
          user_plan: options.userPlan,
          support_subject: options.input.subject,
          submitted_at: sentAt,
          support_message: buildSupportMessage({
            ...options.input,
            sentAt,
            browser,
            operatingSystem,
            userAgent,
          }),
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const resendMessage =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : `Resend failed with status ${response.status}.`;

    throw new Error(resendMessage);
  }

  return {
    sentAt,
    browser,
    operatingSystem,
  };
}

function buildSupportMessage(
  options: SupportRequestInput & {
    sentAt: string;
    browser: string;
    operatingSystem: string;
    userAgent: string;
  },
) {
  return [
    `Origem: ${options.origin}`,
    `Autenticado: ${options.authenticated ? "Sim" : "Não"}`,
    `Data/Hora: ${options.sentAt}`,
    `Página atual: ${options.pageUrl || "Não informada"}`,
    `Navegador: ${options.browser}`,
    `Sistema operacional: ${options.operatingSystem}`,
    `User agent: ${options.userAgent}`,
    "",
    "Descrição do problema:",
    options.description,
  ].join("\n");
}

function detectOperatingSystem(userAgent: string) {
  const normalized = userAgent.toLowerCase();

  if (normalized.includes("windows")) return "Windows";
  if (normalized.includes("android")) return "Android";
  if (normalized.includes("iphone") || normalized.includes("ipad") || normalized.includes("ios")) return "iOS";
  if (normalized.includes("mac os") || normalized.includes("macintosh")) return "macOS";
  if (normalized.includes("linux")) return "Linux";

  return "Não identificado";
}

function detectBrowser(userAgent: string) {
  const normalized = userAgent.toLowerCase();

  if (normalized.includes("edg/")) return "Microsoft Edge";
  if (normalized.includes("opr/") || normalized.includes("opera")) return "Opera";
  if (normalized.includes("chrome/") && !normalized.includes("edg/")) return "Google Chrome";
  if (normalized.includes("firefox/")) return "Mozilla Firefox";
  if (normalized.includes("safari/") && !normalized.includes("chrome/")) return "Safari";

  return "Não identificado";
}
