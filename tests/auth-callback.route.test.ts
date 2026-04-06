import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const exchangeCodeForSession = vi.fn();
const getUser = vi.fn();
const signOut = vi.fn();
const persistPlanIntent = vi.fn();
const logServerEvent = vi.fn();
const createRequestId = vi.fn(() => "req_test_google_oauth");
const findExistingAccountConflict = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession,
      getUser,
      signOut,
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

vi.mock("@/utils/server/auth-session-conflict", () => ({
  findExistingAccountConflict,
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    createRequestId.mockReturnValue("req_test_google_oauth");
    findExistingAccountConflict.mockResolvedValue(null);
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
        "http://localhost:3001/auth/callback?plan=free&next=%2Fworkspace%2Fdashboard",
      ),
    );

    expect(response.status).toBe(303);

    const location = response.headers.get("location");
    expect(location).toBeTruthy();

    const redirectUrl = new URL(location!);
    expect(redirectUrl.pathname).toBe("/auth");
    expect(redirectUrl.searchParams.get("plan")).toBe("free");
    expect(redirectUrl.searchParams.get("target")).toBeNull();
    expect(redirectUrl.searchParams.get("next")).toBe("/workspace/dashboard");
    expect(redirectUrl.searchParams.get("auth_error")).toBe(
      "Não foi possível validar o retorno do Google.",
    );
  });

  it("signs out and redirects to auth when Google returns a duplicate session for an existing profile", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "user_google_999",
          email: "tester@codetrail.site",
        },
      },
      error: null,
    });
    findExistingAccountConflict.mockResolvedValue({
      email: "tester@codetrail.site",
      conflictingProfileId: "profile_existing_123",
      message:
        "Encontramos uma conta existente do CodeTrail com este e-mail. Entre usando o método original dessa conta para recuperar o acesso.",
    });

    const { GET } = await import("../app/auth/callback/route");
    const response = await GET(
      new NextRequest("http://localhost:3001/auth/callback?code=oauth_code&plan=free"),
    );

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(persistPlanIntent).not.toHaveBeenCalled();
    expect(response.status).toBe(303);

    const location = response.headers.get("location");
    expect(location).toBeTruthy();

    const redirectUrl = new URL(location!);
    expect(redirectUrl.pathname).toBe("/auth");
    expect(redirectUrl.searchParams.get("plan")).toBe("free");
    expect(redirectUrl.searchParams.get("auth_reason")).toBe(
      "existing_account_conflict",
    );
    expect(redirectUrl.searchParams.get("auth_error")).toBe(
      "Encontramos uma conta existente do CodeTrail com este e-mail. Entre usando o método original dessa conta para recuperar o acesso.",
    );
  });
});
