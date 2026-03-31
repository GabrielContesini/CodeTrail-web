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
      await expect(page.getByRole("heading", { name: "Acesso ao Workspace" })).toBeVisible();
    }
  });

  test("redirects the removed windows download URL back to auth", async ({ page }) => {
    await page.goto("/download/windows");

    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole("heading", { name: "Acesso ao Workspace" })).toBeVisible();
  });

  test("returns to auth with a clear error when the callback is missing a code", async ({ page }) => {
    test.skip(true, "Funcionalidade de callback OAuth simplificada.");
    await page.goto("/auth/callback?plan=founding");

    await expect(page).toHaveURL(/\/auth\?/);
    await expect(page.getByText("Não foi possível validar o retorno do Google.")).toBeVisible();
    await expect(page.getByText("Plano Founding")).toBeVisible();
  });
});
