import { expect, test } from "@playwright/test";

test.describe("legacy download redirects", () => {
  test("redirects the removed windows download endpoint back to auth", async ({ request }) => {
    const response = await request.get("/api/download/windows", {
      failOnStatusCode: false,
      maxRedirects: 0,
    });

    expect([307, 308]).toContain(response.status());
    expect(response.headers().location).toMatch(/\/auth$/);
  });
});
