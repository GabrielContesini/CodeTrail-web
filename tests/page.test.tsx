import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn();
const createClient = vi.fn();
const findExistingAccountConflict = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient,
}));

vi.mock("@/utils/server/auth-session-conflict", () => ({
  findExistingAccountConflict,
}));

describe("Home route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findExistingAccountConflict.mockResolvedValue(null);
  });

  it("redirects guests to /auth", async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: null,
          },
        }),
      },
    });

    const { default: Home } = await import("../app/page");
    await Home();

    expect(redirect).toHaveBeenCalledWith("/auth");
  });

  it("redirects authenticated users to /workspace/dashboard", async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "test-user",
              email: "tester@codetrail.site",
            },
          },
        }),
      },
    });

    const { default: Home } = await import("../app/page");
    await Home();

    expect(redirect).toHaveBeenCalledWith("/workspace/dashboard");
  });

  it("resets conflicting authenticated sessions before entering the workspace", async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "oauth_user_999",
              email: "tester@codetrail.site",
            },
          },
        }),
      },
    });
    findExistingAccountConflict.mockResolvedValue({
      email: "tester@codetrail.site",
      conflictingProfileId: "profile_existing_123",
      message:
        "Encontramos uma conta existente do CodeTrail com este e-mail. Entre usando o método original dessa conta para recuperar o acesso.",
    });

    const { default: Home } = await import("../app/page");
    await Home();

    expect(redirect).toHaveBeenCalledWith(
      "/auth/reset-session?reason=existing_account_conflict",
    );
  });
});
