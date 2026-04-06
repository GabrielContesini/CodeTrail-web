import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuthenticatedServerContext, logServerEvent } = vi.hoisted(() => ({
  requireAuthenticatedServerContext: vi.fn(),
  logServerEvent: vi.fn(),
}));

vi.mock("@/utils/server/supabase-auth", () => ({
  requireAuthenticatedServerContext,
}));

vi.mock("@/utils/server/observability", () => ({
  logServerEvent,
}));

import {
  BillingServiceError,
  createPortalOnServer,
} from "@/utils/server/billing-service";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
const originalProductStripeSecretKey = process.env.PRODUCT_STRIPE_SECRET_KEY;

describe("billing portal service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://codetrail.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon_test_key";
    process.env.STRIPE_SECRET_KEY = "sk_test_codetrail";
    process.env.PRODUCT_STRIPE_SECRET_KEY = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnonKey;
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
    process.env.PRODUCT_STRIPE_SECRET_KEY = originalProductStripeSecretKey;
  });

  it("uses the edge function result when the portal function is available", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: "https://billing.stripe.com/p/session_live" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);
    requireAuthenticatedServerContext.mockResolvedValue({
      accessToken: "token_test",
      user: { id: "user_1" },
      supabase: {
        rpc: vi.fn(),
      },
    });

    const result = await createPortalOnServer(
      new Request("http://localhost/api/billing/portal"),
      {
        returnUrl: "http://localhost:3001/workspace/settings/billing",
      },
      "req_portal_ok",
    );

    expect(result).toEqual({
      url: "https://billing.stripe.com/p/session_live",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the Stripe API when the portal edge function is missing", async () => {
    const snapshotRpc = vi.fn().mockResolvedValue({
      data: {
        customer: {
          gateway_customer_id: "cus_test_123",
          gateway_provider: "stripe",
        },
        config: {
          billing_provider: "stripe",
        },
      },
      error: null,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Requested function was not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ url: "https://billing.stripe.com/p/session_fallback" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    vi.stubGlobal("fetch", fetchMock);
    requireAuthenticatedServerContext.mockResolvedValue({
      accessToken: "token_test",
      user: { id: "user_1" },
      supabase: {
        rpc: snapshotRpc,
      },
    });

    const returnUrl = "http://localhost:3001/workspace/settings/billing";
    const result = await createPortalOnServer(
      new Request("http://localhost/api/billing/portal"),
      {
        returnUrl,
      },
      "req_portal_fallback",
    );

    expect(result).toEqual({
      url: "https://billing.stripe.com/p/session_fallback",
    });
    expect(snapshotRpc).toHaveBeenCalledWith("get_my_billing_snapshot");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://api.stripe.com/v1/billing_portal/sessions",
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "Bearer sk_test_codetrail",
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": "2026-02-25.clover",
      }),
    });
    expect(String(fetchMock.mock.calls[1]?.[1]?.body)).toContain("customer=cus_test_123");
    expect(String(fetchMock.mock.calls[1]?.[1]?.body)).toContain(
      `return_url=${encodeURIComponent(returnUrl)}`,
    );
    expect(logServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "portal_function_missing_direct_fallback",
        level: "warn",
      }),
    );
  });

  it("returns a clear error when direct portal fallback is not configured", async () => {
    process.env.STRIPE_SECRET_KEY = "";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Requested function was not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);
    requireAuthenticatedServerContext.mockResolvedValue({
      accessToken: "token_test",
      user: { id: "user_1" },
      supabase: {
        rpc: vi.fn(),
      },
    });

    await expect(
      createPortalOnServer(
        new Request("http://localhost/api/billing/portal"),
        {
          returnUrl: "http://localhost:3001/workspace/settings/billing",
        },
        "req_portal_missing_config",
      ),
    ).rejects.toMatchObject({
      name: BillingServiceError.name,
      message: "O portal de assinatura nao esta configurado neste ambiente.",
      status: 503,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
