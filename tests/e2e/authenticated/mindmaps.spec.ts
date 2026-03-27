import { expect, test } from "@playwright/test";
import { hasAuthCredentials } from "../helpers/constants";
import { gotoWorkspaceRoute } from "../helpers/workspace";

test.skip(!hasAuthCredentials(), "E2E_USER_EMAIL e E2E_USER_PASSWORD nao configurados.");

test.describe("authenticated mind maps experience", () => {
  test("loads the library and supports the dedicated editor route", async ({ page }) => {
    await gotoWorkspaceRoute(page, "/workspace/mind-maps", "Mind Maps");

    const lockedState = page.getByText("Mind maps premium bloqueados");
    if (await lockedState.isVisible().catch(() => false)) {
      await expect(page.getByRole("button", { name: /Fazer upgrade/i })).toBeVisible();
      return;
    }

    await expect(page.getByText("Biblioteca").first()).toBeVisible();
    if (!(await page.getByText("Nenhum mapa encontrado").isVisible().catch(() => false))) {
      await expect(page.getByTestId("mindmap-item").first()).toBeVisible();
    }

    const openCanvasButton = page.getByRole("button", { name: "Abrir canvas" });
    if (await openCanvasButton.first().isVisible().catch(() => false)) {
      await openCanvasButton.first().click();
      await expect(page).toHaveURL(/\/workspace\/mind-maps\/editor\//);
      await expect(page.getByRole("button", { name: "Voltar para biblioteca" })).toBeVisible();
      return;
    }

    await expect(page.getByText("Nenhum mapa selecionado").first()).toBeVisible();
  });
});
