import type { Page } from "@playwright/test";

export async function dismissOnboardingIfVisible(page: Page) {
  const dismissButton = page.getByRole("button", { name: /Pular onboarding|Fechar tour/i }).first();

  if (!(await dismissButton.isVisible().catch(() => false))) {
    return;
  }

  await dismissButton.click();
  await dismissButton.waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
}
