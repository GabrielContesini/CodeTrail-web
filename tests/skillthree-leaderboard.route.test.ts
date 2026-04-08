import { beforeEach, describe, expect, it, vi } from "vitest";

const loadSkillThreeLeaderboard = vi.fn();

vi.mock("@/utils/server/skillthree-leaderboard", () => ({
  loadSkillThreeLeaderboard,
}));

describe("GET /api/skillthree/leaderboard", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the live leaderboard payload with request id headers", async () => {
    loadSkillThreeLeaderboard.mockResolvedValue({
      leaderboardByScope: {
        global: {
          topThree: [],
          entries: [],
        },
        weekly: {
          topThree: [],
          entries: [],
        },
        track: {
          topThree: [],
          entries: [],
        },
      },
      source: "live",
    });

    const { GET } = await import("../app/api/skillthree/leaderboard/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(response.json()).resolves.toEqual({
      leaderboardByScope: {
        global: {
          topThree: [],
          entries: [],
        },
        weekly: {
          topThree: [],
          entries: [],
        },
        track: {
          topThree: [],
          entries: [],
        },
      },
      source: "live",
    });
  });

  it("returns 401 only for authentication errors", async () => {
    loadSkillThreeLeaderboard.mockRejectedValue(
      new Error("Faça login para consultar o ranking do SkillThree."),
    );

    const { GET } = await import("../app/api/skillthree/leaderboard/route");
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Faça login para consultar o ranking do SkillThree.",
      errorCategory: "auth",
    });
  });

  it("returns 503 for storage problems instead of masking them as 401", async () => {
    loadSkillThreeLeaderboard.mockRejectedValue(
      new Error('relation "profiles" does not exist'),
    );

    const { GET } = await import("../app/api/skillthree/leaderboard/route");
    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'relation "profiles" does not exist',
      errorCategory: "storage",
    });
  });
});
