import { expect, type Page } from "@playwright/test";
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "./constants";
import { dismissOnboardingIfVisible } from "./dismiss-onboarding";

export async function loginThroughUi(page: Page) {
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: "Acesse sua conta" })).toBeVisible();
  await page.locator('input[name="email"]').fill(E2E_USER_EMAIL);
  await page.locator('input[name="password"]').fill(E2E_USER_PASSWORD);

  await Promise.all([
    page.waitForURL(/\/workspace\/dashboard$/),
    page.getByRole("button", { name: /Entrar no sistema/i }).click(),
  ]);

  await expect(page).toHaveURL(/\/workspace\/dashboard$/);
  await dismissOnboardingIfVisible(page);
  await expect(page.getByText("Dashboard").first()).toBeVisible();
}
