import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getBillingSnapshotOnServer = vi.fn();
const syncBillingOnServer = vi.fn();
const parseBillingPlanCode = vi.fn((value: unknown) =>
  value === "free" || value === "pro" || value === "founding" ? value : null,
);

vi.mock("@/utils/server/billing-service", () => ({
  getBillingSnapshotOnServer,
  parseBillingPlanCode,
  syncBillingOnServer,
}));

describe("GET /api/billing/status", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the current snapshot without forcing sync", async () => {
    getBillingSnapshotOnServer.mockResolvedValue({
      current_plan: { code: "pro" },
      subscription: { status: "active" },
    });

    const { GET } = await import("../app/api/billing/status/route");
    const response = await GET(
      new NextRequest("http://localhost/api/billing/status?plan=pro"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      snapshot: {
        current_plan: { code: "pro" },
        subscription: { status: "active" },
      },
      requestedPlan: "pro",
    });
    expect(syncBillingOnServer).not.toHaveBeenCalled();
  });

  it("delegates to the sync flow when requested", async () => {
    syncBillingOnServer.mockResolvedValue({
      snapshot: {
        current_plan: { code: "founding" },
        subscription: { status: "active" },
      },
      status: "active",
    });

    const { GET } = await import("../app/api/billing/status/route");
    const response = await GET(
      new NextRequest("http://localhost/api/billing/status?plan=founding&sync=1"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      snapshot: {
        current_plan: { code: "founding" },
        subscription: { status: "active" },
      },
      status: "active",
      requestedPlan: "founding",
    });
    expect(syncBillingOnServer).toHaveBeenCalledOnce();
  });
});
