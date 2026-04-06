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

vi.mock("@/app/workspace/_components/workspace-provider", () => ({
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/app/workspace/_components/workspace-shell", () => ({
  WorkspaceShell: ({ children }: { children: React.ReactNode }) => children,
}));

describe("Workspace layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    findExistingAccountConflict.mockResolvedValue(null);
  });

  it("redirects to /auth when there is no authenticated user", async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: null,
          },
        }),
      },
    });

    const { default: WorkspaceLayout } = await import("../app/workspace/layout");

    await expect(
      WorkspaceLayout({
        children: null,
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/auth");
  });

  it("resets the session when the authenticated user has no profile but another profile exists with the same email", async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "oauth_user_999",
              email: "tester@codetrail.site",
              user_metadata: {
                full_name: "Tester",
              },
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

    const { default: WorkspaceLayout } = await import("../app/workspace/layout");

    await expect(
      WorkspaceLayout({
        children: null,
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith(
      "/auth/reset-session?reason=existing_account_conflict",
    );
  });
});
