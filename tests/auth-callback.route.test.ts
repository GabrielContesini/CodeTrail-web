import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const exchangeCodeForSession = vi.fn();
const getUser = vi.fn();
const persistPlanIntent = vi.fn();
const logServerEvent = vi.fn();
const createRequestId = vi.fn(() => "req_test_google_oauth");

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession,
      getUser,
    },
  })),
}));

vi.mock("@/utils/auth/plan-intent", () => ({
  persistPlanIntent,
}));

vi.mock("@/utils/server/observability", () => ({
  createRequestId,
  logServerEvent,
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    createRequestId.mockReturnValue("req_test_google_oauth");
  });

  it("exchanges the code, persists plan intent and redirects to billing", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "user_google_123",
        },
      },
      error: null,
    });
    persistPlanIntent.mockResolvedValue({ success: true });

    const { GET } = await import("../app/auth/callback/route");
    const response = await GET(
      new NextRequest("http://localhost:3001/auth/callback?code=oauth_code&plan=pro"),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3001/workspace/settings/billing?checkout=pro",
    );
    expect(exchangeCodeForSession).toHaveBeenCalledWith("oauth_code");
    expect(persistPlanIntent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        userId: "user_google_123",
        selectedPlan: "pro",
        source: "google_oauth",
        platformInterest: "web",
      }),
    );
  });

  it("redirects back to auth with context preserved when the callback code is missing", async () => {
    const { GET } = await import("../app/auth/callback/route");
    const response = await GET(
      new NextRequest(
        "http://localhost:3001/auth/callback?plan=free&target=download&next=%2Fworkspace%2Fdashboard",
      ),
    );

    expect(response.status).toBe(303);

    const location = response.headers.get("location");
    expect(location).toBeTruthy();

    const redirectUrl = new URL(location!);
    expect(redirectUrl.pathname).toBe("/auth");
    expect(redirectUrl.searchParams.get("plan")).toBe("free");
    expect(redirectUrl.searchParams.get("target")).toBe("download");
    expect(redirectUrl.searchParams.get("next")).toBe("/workspace/dashboard");
    expect(redirectUrl.searchParams.get("auth_error")).toBe(
      "Não foi possível validar o retorno do Google.",
    );
  });
});
