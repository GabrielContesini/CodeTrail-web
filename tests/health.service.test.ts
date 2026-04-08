import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseClient } = vi.hoisted(() => ({
  createSupabaseClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createSupabaseClient,
}));

import { collectApiHealthReport } from "@/utils/server/health";

const originalEnv = {
  nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  nextPublicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  productSupabaseServiceRoleKey: process.env.PRODUCT_SUPABASE_SERVICE_ROLE_KEY,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  nextPublicStripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  productStripeSecretKey: process.env.PRODUCT_STRIPE_SECRET_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  clickupApiToken: process.env.CLICKUP_API_TOKEN,
  clickupSupportListId: process.env.CLICKUP_SUPPORT_LIST_ID,
};

describe("collectApiHealthReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://codetrail.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon_test_key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";
    process.env.PRODUCT_SUPABASE_SERVICE_ROLE_KEY = "";
    process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_codetrail";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "";
    process.env.STRIPE_SECRET_KEY = "";
    process.env.PRODUCT_STRIPE_SECRET_KEY = "";
    process.env.RESEND_API_KEY = "re_test_codetrail";
    process.env.CLICKUP_API_TOKEN = "clickup_test_token";
    process.env.CLICKUP_SUPPORT_LIST_ID = "901712375712";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv.nextPublicSupabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalEnv.nextPublicSupabaseAnonKey;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv.supabaseServiceRoleKey;
    process.env.PRODUCT_SUPABASE_SERVICE_ROLE_KEY = originalEnv.productSupabaseServiceRoleKey;
    process.env.STRIPE_PUBLISHABLE_KEY = originalEnv.stripePublishableKey;
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalEnv.nextPublicStripePublishableKey;
    process.env.STRIPE_SECRET_KEY = originalEnv.stripeSecretKey;
    process.env.PRODUCT_STRIPE_SECRET_KEY = originalEnv.productStripeSecretKey;
    process.env.RESEND_API_KEY = originalEnv.resendApiKey;
    process.env.CLICKUP_API_TOKEN = originalEnv.clickupApiToken;
    process.env.CLICKUP_SUPPORT_LIST_ID = originalEnv.clickupSupportListId;
  });

  it("keeps the overall health as ok when active probes are skipped by optional config", async () => {
    const report = await collectApiHealthReport();

    expect(report.status).toBe("ok");
    expect(report.summary).toEqual({
      ok: 3,
      skipped: 2,
      degraded: 0,
      error: 0,
    });
    expect(report.checks.supabase).toMatchObject({
      status: "skipped",
      critical: true,
      errorCategory: "config",
    });
    expect(report.checks.billing).toMatchObject({
      status: "skipped",
      critical: true,
      errorCategory: "config",
    });
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });
});
