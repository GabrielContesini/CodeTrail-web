import { expect, test } from "@playwright/test";
import { hasAuthCredentials } from "../helpers/constants";
import { gotoWorkspaceRoute } from "../helpers/workspace";

test.skip(!hasAuthCredentials(), "E2E_USER_EMAIL e E2E_USER_PASSWORD nao configurados.");

test.describe("authenticated billing flows", () => {
  test("refreshes and syncs billing with clear loading feedback", async ({ page }) => {
    await gotoWorkspaceRoute(page, "/workspace/settings/billing", "Plano e cobrança");

    const refreshButton = page.getByRole("button", { name: "Atualizar snapshot" });
    await refreshButton.click();
    await expect(page.getByText("Atualizando billing")).toBeVisible();
    await expect(page.getByText("Carregando o snapshot mais recente da sua assinatura.")).toBeVisible();
    await expect(page.getByText("Atualizando billing")).toBeHidden({ timeout: 30_000 });
    await expect(page.getByText("Snapshot atualizado")).toBeVisible();

    const syncButton = page.getByRole("button", { name: "Sincronizar status" });
    await syncButton.click();
    await expect(page.getByText("Sincronizando assinatura")).toBeVisible();
    await expect(page.getByText("Validando o status atual diretamente com o provedor de pagamento.")).toBeVisible();
    await expect(page.getByText("Sincronizando assinatura")).toBeHidden({ timeout: 30_000 });
    await expect(page.getByText("Status sincronizado")).toBeVisible();
  });

  test("opens and closes the cancellation modal when the plan is cancellable", async ({ page }) => {
    await gotoWorkspaceRoute(page, "/workspace/settings/billing", "Plano e cobrança");

    const cancelButton = page.getByRole("button", { name: /Cancelar no fim do ciclo|Cancelamento agendado/i });
    await expect(cancelButton).toBeVisible();

    if (await cancelButton.isDisabled()) {
      return;
    }

    await cancelButton.click();
    await expect(page.getByRole("heading", { name: "Cancelar assinatura" })).toBeVisible();
    await expect(page.getByText("O cancelamento passa a valer no fim do ciclo atual.")).toBeVisible();
    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page.getByRole("heading", { name: "Cancelar assinatura" })).toBeHidden();
  });

  test("shows return-state feedback and clears transient billing params", async ({ page }) => {
    await page.goto("/workspace/settings/billing?billing=cancel");

    await expect(page.getByText("Checkout interrompido")).toBeVisible();
    await expect(page.getByText("Nenhuma cobrança foi concluída.")).toBeVisible();
    await expect(page).toHaveURL(/\/workspace\/settings\/billing$/);
  });
});
