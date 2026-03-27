import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitState } from "@/utils/server/rate-limit";

const originalPublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
const originalNextPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

describe("GET /api/billing/config", () => {
  beforeEach(() => {
    vi.resetModules();
    resetRateLimitState();
    process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_codetrail";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "";
  });

  afterEach(() => {
    resetRateLimitState();
    process.env.STRIPE_PUBLISHABLE_KEY = originalPublishableKey;
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalNextPublishableKey;
  });

  it("returns the publishable key with cache headers", async () => {
    const { GET } = await import("../app/api/billing/config/route");
    const response = await GET(
      new Request("http://localhost/api/billing/config", {
        headers: {
          "x-forwarded-for": "203.0.113.10",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      publishableKey: "pk_test_codetrail",
    });
    expect(response.headers.get("cache-control")).toContain("public");
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("returns 500 when no publishable key is configured", async () => {
    process.env.STRIPE_PUBLISHABLE_KEY = "";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "";

    const { GET } = await import("../app/api/billing/config/route");
    const response = await GET(
      new Request("http://localhost/api/billing/config", {
        headers: {
          "x-forwarded-for": "203.0.113.11",
        },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Missing Stripe publishable key.",
    });
  });
});
