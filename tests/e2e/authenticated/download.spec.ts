import { expect, test } from "@playwright/test";
import { hasAuthCredentials } from "../helpers/constants";

test.skip(!hasAuthCredentials(), "E2E_USER_EMAIL e E2E_USER_PASSWORD nao configurados.");

test.describe("authenticated Windows download area", () => {
  test("renders the download page and exposes the installer action", async ({ page }) => {
    await page.goto("/download/windows");

    await expect(page.getByRole("heading", { name: "Seu acesso ao instalador Windows já está pronto." })).toBeVisible();
    await expect(page.getByText("Autenticação concluída")).toBeVisible();

    const downloadLink = page.getByRole("link", { name: "Baixar para Windows" });
    await expect(downloadLink).toBeVisible();
    await expect(downloadLink).toHaveAttribute("href", "/api/download/windows");

    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
  });
});
