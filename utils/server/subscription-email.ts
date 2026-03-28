import type { SupabaseClient, User } from "@supabase/supabase-js";

const RESEND_API_BASE = "https://api.resend.com/emails";
const SUBSCRIPTION_TEMPLATE_ID =
  process.env.RESEND_SUBSCRIPTION_TEMPLATE_ID || "subscription-confirmed";
const DEFAULT_FROM = "CodeTrail Suporte <onboarding@resend.dev>";
const WELCOME_SUBJECT = "Bem-vindo(a) ao CodeTrail 🚀";

export async function sendWelcomeEmailIfNeeded(options: {
  supabase: SupabaseClient;
  user: User;
  originHint?: string | null;
  planName?: string | null;
}) {
  const { data: profile, error: profileError } = await options.supabase
    .from("profiles")
    .select("full_name, email, welcome_email_sent_at")
    .eq("id", options.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile) {
    return { skipped: true, reason: "missing_profile" } as const;
  }

  if (typeof profile.welcome_email_sent_at === "string" && profile.welcome_email_sent_at.length > 0) {
    return { skipped: true, reason: "already_sent" } as const;
  }

  const recipientEmail = profile.email?.trim() || options.user.email?.trim() || "";
  if (!recipientEmail) {
    return { skipped: true, reason: "missing_email" } as const;
  }

  const resolvedUserName =
    profile.full_name?.trim() ||
    (typeof options.user.user_metadata.full_name === "string"
      ? options.user.user_metadata.full_name.trim()
      : "") ||
    recipientEmail.split("@")[0] ||
    "Explorer";

  const dashboardUrl = resolveDashboardUrl(options.originHint);
  const planName =
    normalizePlanName(options.planName) ??
    (await readCurrentPlanName(options.supabase)) ??
    "Plano Free";

  await sendSubscriptionTemplateEmail({
    to: recipientEmail,
    userName: resolvedUserName,
    planName,
    dashboardUrl,
    idempotencyKey: `welcome-signup:${options.user.id}`,
  });

  const { error: updateError } = await options.supabase
    .from("profiles")
    .update({
      welcome_email_sent_at: new Date().toISOString(),
    })
    .eq("id", options.user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    skipped: false,
    sent: true,
    planName,
  } as const;
}

async function readCurrentPlanName(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("get_my_billing_snapshot");

  if (error) {
    return null;
  }

  const snapshot =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as { current_plan?: { name?: string | null } | null })
      : null;

  return normalizePlanName(snapshot?.current_plan?.name ?? null);
}

async function sendSubscriptionTemplateEmail(options: {
  to: string;
  userName: string;
  planName: string;
  dashboardUrl: string;
  idempotencyKey: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { skipped: true, reason: "missing_resend_api_key" } as const;
  }

  const response = await fetch(RESEND_API_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": options.idempotencyKey,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
      to: [options.to],
      subject: WELCOME_SUBJECT,
      template: {
        id: SUBSCRIPTION_TEMPLATE_ID,
        variables: {
          user_name: options.userName,
          plan_name: options.planName,
          dashboard_url: options.dashboardUrl,
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(payload || `Resend request failed with status ${response.status}.`);
  }

  return await response.json().catch(() => ({ ok: true }));
}

function resolveDashboardUrl(originHint?: string | null) {
  const envDashboardUrl = process.env.APP_DASHBOARD_URL?.trim();
  if (envDashboardUrl) {
    return envDashboardUrl;
  }

  const normalizedOrigin = normalizeOrigin(originHint) ?? "https://www.codetrail.online";
  return new URL("/workspace/dashboard", normalizedOrigin).toString();
}

function normalizeOrigin(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function normalizePlanName(value?: string | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
