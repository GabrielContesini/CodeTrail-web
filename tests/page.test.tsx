import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn();
const createClient = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient,
}));

describe("Home route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
