import { expect, type Page } from "@playwright/test";
import { dismissOnboardingIfVisible } from "./dismiss-onboarding";

export async function gotoWorkspaceRoute(
  page: Page,
  path: string,
  heading: string | RegExp,
) {
  await page.goto(path);
  await dismissOnboardingIfVisible(page);
  await expect(page).toHaveURL(new RegExp(`${escapeForRegex(path)}(?:\\?.*)?$`));
  await expect(page.locator("h1, h2").filter({ hasText: heading }).first()).toBeVisible();
}

export async function expectOperationModalToClose(
  page: Page,
  title: string | RegExp,
  timeout = 30_000,
) {
  const modal = page.getByTestId("workspace-operation-modal");
  await expect(modal).toBeVisible();
  await expect(modal.getByText(title)).toBeVisible();
  await expect(modal).toBeHidden({ timeout });
}

export function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
