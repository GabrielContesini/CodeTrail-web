import { expect, test } from "@playwright/test";
import { hasAuthCredentials } from "../helpers/constants";
import { gotoWorkspaceRoute } from "../helpers/workspace";

test.skip(!hasAuthCredentials(), "E2E_USER_EMAIL e E2E_USER_PASSWORD nao configurados.");

test.describe("authenticated onboarding flows", () => {
  test("reopens onboarding from settings and navigates through the tour", async ({ page }) => {
    await gotoWorkspaceRoute(page, "/workspace/settings", "Configurações");

    await page.getByRole("button", { name: "Rever onboarding" }).click();

    const onboarding = page.getByTestId("workspace-onboarding");
    const title = onboarding.locator("#workspace-onboarding-title");

    await expect(onboarding).toBeVisible();

    const firstStepTitle = await title.textContent();
    await page.getByRole("button", { name: "Avançar" }).click();
    await expect(title).not.toHaveText(firstStepTitle ?? "");

    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(title).toHaveText(firstStepTitle ?? "");

    for (let step = 0; step < 4; step += 1) {
      await page.getByRole("button", { name: "Avançar" }).click();
    }

    await expect(page.getByRole("button", { name: "Entrar no workspace" })).toBeVisible();
    await page.getByRole("button", { name: "Entrar no workspace" }).click();
    await expect(onboarding).toBeHidden();
  });

  test("allows closing the onboarding without breaking the current route", async ({ page }) => {
    await gotoWorkspaceRoute(page, "/workspace/settings", "Configurações");

    await page.getByRole("button", { name: "Rever onboarding" }).click();
    await expect(page.getByTestId("workspace-onboarding")).toBeVisible();

    await page.getByRole("button", { name: /Pular onboarding|Fechar tour/i }).click();
    await expect(page.getByTestId("workspace-onboarding")).toBeHidden();
    await expect(page).toHaveURL(/\/workspace\/settings$/);
  });
});
