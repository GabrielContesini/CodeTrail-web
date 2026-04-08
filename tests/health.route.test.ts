import { beforeEach, describe, expect, it, vi } from "vitest";

const collectApiHealthReport = vi.fn();

vi.mock("@/utils/server/health", () => ({
  collectApiHealthReport,
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 200 when the consolidated health is ok", async () => {
    collectApiHealthReport.mockResolvedValue({
      status: "ok",
      timestamp: "2026-04-08T12:00:00.000Z",
      summary: {
        ok: 5,
        degraded: 0,
        error: 0,
      },
      checks: {
        app: {
          status: "ok",
          critical: true,
          summary: "App Router operacional.",
        },
        auth: {
          status: "ok",
          critical: true,
          summary: "Camada de auth/session do Supabase acessível.",
        },
        supabase: {
          status: "ok",
          critical: true,
          summary: "Banco principal e storage persistente do suporte estão acessíveis.",
        },
        billing: {
          status: "ok",
          critical: true,
          summary: "Billing pronto com Stripe acessível e dependências essenciais configuradas.",
        },
        integrations: {
          status: "ok",
          critical: false,
          summary: "Integrações auxiliares críticas estão configuradas.",
        },
      },
    });

    const { GET } = await import("../app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-request-id")).toBeTruthy();

    const payload = await response.json();
    expect(payload).toMatchObject({
      status: "ok",
      summary: {
        ok: 5,
        degraded: 0,
        error: 0,
      },
    });
    expect(payload.requestId).toBeTruthy();
    expect(typeof payload.durationMs).toBe("number");
  });

  it("returns 503 when a critical health check reports error", async () => {
    collectApiHealthReport.mockResolvedValue({
      status: "error",
      timestamp: "2026-04-08T12:00:00.000Z",
      summary: {
        ok: 2,
        degraded: 1,
        error: 2,
      },
      checks: {
        app: {
          status: "ok",
          critical: true,
          summary: "App Router operacional.",
        },
        auth: {
          status: "error",
          critical: true,
          summary: "Supabase auth respondeu com erro.",
          errorCategory: "upstream",
        },
        supabase: {
          status: "ok",
          critical: true,
          summary: "Banco principal e storage persistente do suporte estão acessíveis.",
        },
        billing: {
          status: "error",
          critical: true,
          summary: "Stripe respondeu com erro no probe de billing.",
          errorCategory: "upstream",
        },
        integrations: {
          status: "degraded",
          critical: false,
          summary: "Uma ou mais integrações auxiliares não estão configuradas.",
          errorCategory: "config",
        },
      },
    });

    const { GET } = await import("../app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(503);

    const payload = await response.json();
    expect(payload).toMatchObject({
      status: "error",
      summary: {
        ok: 2,
        degraded: 1,
        error: 2,
      },
    });
  });
});
