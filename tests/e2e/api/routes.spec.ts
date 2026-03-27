import { expect, test } from "@playwright/test";

test.describe("api routes", () => {
  test("returns stripe publishable key for embedded checkout", async ({ request }) => {
    const response = await request.get("/api/billing/config", {
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toBeTruthy();
    expect(response.headers().vary).toContain("x-forwarded-for");
    const payload = await response.json();
    expect(payload).toHaveProperty("publishableKey");
    expect(String(payload.publishableKey)).toMatch(/^pk_/);
  });

  test("redirects download endpoint to the latest windows artifact", async ({ request }) => {
    const response = await request.get("/api/download/windows", {
      failOnStatusCode: false,
      maxRedirects: 0,
    });

    expect([307, 308]).toContain(response.status());
    expect(response.headers().location).toBeTruthy();
    expect(response.headers()["x-codetrail-download-source"]).toBeTruthy();
  });
});
