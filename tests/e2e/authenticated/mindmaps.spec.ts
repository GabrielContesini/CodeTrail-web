import { expect, test } from "@playwright/test";
import { hasAuthCredentials } from "../helpers/constants";
import { gotoWorkspaceRoute } from "../helpers/workspace";

test.skip(!hasAuthCredentials(), "E2E_USER_EMAIL e E2E_USER_PASSWORD nao configurados.");

test.describe("authenticated mind maps experience", () => {
  test("loads the library and supports the dedicated editor route", async ({ page }) => {
    await gotoWorkspaceRoute(page, "/workspace/mind-maps", "Mind Maps");

    const lockedState = page.getByRole("heading", { name: "Mind maps premium bloqueados" });
    const libraryState = page.getByRole("heading", { name: "Biblioteca" }).first();

    await expect(async () => {
      const lockedVisible = await lockedState.isVisible().catch(() => false);
      const libraryVisible = await libraryState.isVisible().catch(() => false);
      expect(lockedVisible || libraryVisible).toBeTruthy();
    }).toPass({ timeout: 15_000 });

    if (await lockedState.isVisible().catch(() => false)) {
      await expect(page.getByRole("button", { name: /Fazer upgrade/i })).toBeVisible();
      return;
    }

    await expect(libraryState).toBeVisible();
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
