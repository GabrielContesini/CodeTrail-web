import { expect, test } from "@playwright/test";
import { hasAuthCredentials } from "../helpers/constants";
import { gotoWorkspaceRoute } from "../helpers/workspace";

test.skip(!hasAuthCredentials(), "E2E_USER_EMAIL e E2E_USER_PASSWORD nao configurados.");

test.describe("authenticated session continuity", () => {
  test("keeps the workspace session after a full page reload", async ({ page, isMobile }) => {
    await gotoWorkspaceRoute(page, "/workspace/dashboard", "Dashboard");

    await page.reload();

    await expect(page).toHaveURL(/\/workspace\/dashboard$/);
    await expect(page.locator("h1, h2").filter({ hasText: "Dashboard" }).first()).toBeVisible();

    if (Boolean(isMobile)) {
      await expect(page.getByRole("button", { name: "Abrir sidebar" })).toBeVisible();
      return;
    }

    await expect(page.getByTestId("workspace-sidebar")).toBeVisible();
  });

  test("supports reduced motion without breaking the workspace shell", async ({ page, isMobile }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoWorkspaceRoute(page, "/workspace/dashboard", "Dashboard");

    if (Boolean(isMobile)) {
      await expect(page.getByRole("button", { name: "Abrir sidebar" })).toBeVisible();
    } else {
      await expect(page.getByTestId("workspace-sidebar")).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /Sincronizar|Sincronizando/i })).toBeVisible();
  });
});
