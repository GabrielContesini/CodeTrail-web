import { expect, test } from "@playwright/test";

test.describe("public download and utility routes", () => {
  test("download api redirects to a release target with cache and source headers", async ({ request }) => {
    const response = await request.get("/api/download/windows", {
      failOnStatusCode: false,
      maxRedirects: 0,
    });

    expect([307, 308]).toContain(response.status());
    expect(response.headers().location).toBeTruthy();
    expect(response.headers()["cache-control"]).toBeTruthy();
    expect(response.headers()["x-codetrail-download-source"]).toBeTruthy();
  });
});
