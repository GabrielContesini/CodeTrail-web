import { describe, expect, it } from "vitest";
import {
  buildAuthErrorRedirect,
  buildGoogleCallbackUrl,
  buildPostAuthDestination,
  getOAuthErrorMessage,
  normalizeAuthNextPath,
} from "@/utils/auth/oauth";

describe("OAuth helpers", () => {
  it("prioritizes premium billing destinations after authentication", () => {
    expect(
      buildPostAuthDestination({
        plan: "pro",
        target: "workspace",
        nextPath: "/workspace/mind-maps",
      }),
    ).toBe("/workspace/settings/billing?checkout=pro");
  });

  it("keeps relative next paths and rejects unsafe ones", () => {
    expect(normalizeAuthNextPath("/workspace/dashboard")).toBe("/workspace/dashboard");
    expect(normalizeAuthNextPath("https://example.com")).toBeNull();
    expect(normalizeAuthNextPath("//evil.example")).toBeNull();
  });

  it("builds the Google callback url with the current auth context", () => {
    expect(
      buildGoogleCallbackUrl({
        origin: "http://localhost:3001",
        plan: "founding",
        target: "download",
        nextPath: "/workspace/settings",
        source: "page",
      }),
    ).toBe(
      "http://localhost:3001/auth/callback?plan=founding&target=download&next=%2Fworkspace%2Fsettings&source=page",
    );
  });

  it("preserves context when redirecting back with an auth error", () => {
    expect(
      buildAuthErrorRedirect({
        plan: "free",
        target: "download",
        nextPath: "/workspace/dashboard",
        message: "Falha ao autenticar.",
      }),
    ).toBe(
      "/auth?plan=free&target=download&next=%2Fworkspace%2Fdashboard&auth_error=Falha+ao+autenticar.",
    );
  });

  it("maps Google cancellation to a readable PT-BR message", () => {
    expect(getOAuthErrorMessage("access_denied", "Access denied by the user")).toBe(
      "A autenticação com Google foi cancelada antes da conclusão.",
    );
  });
});
