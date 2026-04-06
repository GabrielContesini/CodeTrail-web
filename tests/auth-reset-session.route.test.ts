import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const signOut = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signOut,
    },
  })),
}));

describe("GET /auth/reset-session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves the conflict reason when resetting a duplicate OAuth session", async () => {
    const { GET } = await import("../app/auth/reset-session/route");
    const response = await GET(
      new NextRequest(
        "http://localhost:3001/auth/reset-session?reason=existing_account_conflict",
      ),
    );

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(303);

    const location = response.headers.get("location");
    expect(location).toBeTruthy();

    const redirectUrl = new URL(location!);
    expect(redirectUrl.pathname).toBe("/auth");
    expect(redirectUrl.searchParams.get("auth_reason")).toBe(
      "existing_account_conflict",
    );
    expect(redirectUrl.searchParams.get("auth_error")).toContain(
      "Encontramos uma conta existente do CodeTrail",
    );
  });
});
