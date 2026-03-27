import { expect, test } from "@playwright/test";

test.describe("public route protection", () => {
  test("redirects guests away from protected workspace routes", async ({ page }) => {
    for (const path of [
      "/workspace/dashboard",
      "/workspace/settings",
      "/workspace/settings/billing",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth$/);
      await expect(page.getByRole("heading", { name: "Acesse sua conta" })).toBeVisible();
    }
  });

  test("redirects guests away from the Windows download area", async ({ page }) => {
    await page.goto("/download/windows");

    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole("heading", { name: "Acesse sua conta" })).toBeVisible();
  });

  test("returns to auth with a clear error when the callback is missing a code", async ({ page }) => {
    await page.goto("/auth/callback?plan=founding&target=download");

    await expect(page).toHaveURL(/\/auth\?/);
    await expect(page.getByText("Não foi possível validar o retorno do Google.")).toBeVisible();
    await expect(page.getByText("Plano Founding").first()).toBeVisible();
  });
});
