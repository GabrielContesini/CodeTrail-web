import { expect, test } from "@playwright/test";
import { attachClientErrorCollector } from "../helpers/console";

test.describe("public smoke", () => {
  test("redirects the root route to auth without hydration or runtime errors", async ({ page }) => {
    const clientErrors = attachClientErrorCollector(page, {
      ignorePatterns: [
        /Failed to load resource: the server responded with a status of 404/i,
        /Could not resolve hostname/i,
      ],
    });

    await page.goto("/");

    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole("heading", { name: "Acesse sua conta" })).toBeVisible();
    await expect(page.getByText("CodeTrail").first()).toBeVisible();

    clientErrors.expectNoCriticalErrors();
  });

  test("keeps the auth hero usable in mobile viewports", async ({ page, isMobile }) => {
    test.skip(!Boolean(isMobile), "A validação é específica para os projetos mobile.");

    await page.goto("/auth?plan=pro");

    await page.getByTestId("google-auth-button").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("google-auth-button")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar no sistema" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar conta" })).toBeVisible();
  });
});
