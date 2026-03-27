import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetWindowsDownloadCache } from "@/utils/server/github-release";

describe("GET /download/windows", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    resetWindowsDownloadCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetWindowsDownloadCache();
  });

  it("redirects directly to the setup asset when the release contains it", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          assets: [
            {
              name: "CodeTrailWindows-1.1.4+7-setup.exe",
              browser_download_url: "https://downloads.example.com/setup.exe",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const { GET } = await import("../app/api/download/windows/route");
    const response = await GET();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://downloads.example.com/setup.exe",
    );
    expect(response.headers.get("x-codetrail-download-source")).toBe("github-asset");
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "https://api.github.com/repos/GabrielContesini/CodeTrailWindows/releases/latest",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
  });

  it("falls back to the GitHub release page when the asset is missing", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ assets: [] }), { status: 200 }),
    );

    const { GET } = await import("../app/api/download/windows/route");
    const response = await GET();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://github.com/GabrielContesini/CodeTrailWindows/releases/latest",
    );
    expect(response.headers.get("x-codetrail-download-source")).toBe("release-page");
  });

  it("falls back to the GitHub release page when the API fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network failed"));

    const { GET } = await import("../app/api/download/windows/route");
    const response = await GET();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://github.com/GabrielContesini/CodeTrailWindows/releases/latest",
    );
    expect(response.headers.get("x-codetrail-download-source")).toBe("release-page");
  });

  it("serves the cached asset without a second GitHub lookup while cache is fresh", async () => {
    vi.mocked(fetch)
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            assets: [
              {
                name: "CodeTrailWindows-1.1.4+7-setup.exe",
                browser_download_url: "https://downloads.example.com/setup.exe",
              },
            ],
          }),
          { status: 200 },
        ),
      );

    const { GET } = await import("../app/api/download/windows/route");
    const firstResponse = await GET();
    const secondResponse = await GET();

    expect(firstResponse.headers.get("location")).toBe(
      "https://downloads.example.com/setup.exe",
    );
    expect(secondResponse.headers.get("location")).toBe(
      "https://downloads.example.com/setup.exe",
    );
    expect(secondResponse.headers.get("x-codetrail-download-source")).toBe("github-asset");
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });
});
