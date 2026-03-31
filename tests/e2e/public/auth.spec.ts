import { expect, test } from "@playwright/test";
import { attachClientErrorCollector } from "../helpers/console";

const hasRealSupabaseAuth =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  !String(process.env.NEXT_PUBLIC_SUPABASE_URL).includes("example.supabase.co") &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "test-anon-key";

test.describe("public auth experience", () => {
  test("renders login, Google CTA and allows switching to signup", async ({ page }) => {
    const clientErrors = attachClientErrorCollector(page, {
      ignorePatterns: [
        /Failed to load resource: the server responded with a status of 404/i,
        /Could not resolve hostname/i,
        /ERR_NAME_NOT_RESOLVED/i,
        /Cross-Origin Request Blocked/i,
        /m\.stripe\.com/i,
      ],
    });

    await page.goto("/auth");

    await expect(page.getByRole("heading", { name: "Acesso ao Workspace" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continuar com Google/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    await page.getByRole("button", { name: "Cadastre-se" }).click();
    await expect(page.getByRole("heading", { name: "Cadastro de Operador" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cadastrar com Google/i })).toBeVisible();

    const backToLoginButton = page.getByRole("button", { name: "Fazer Login" });
    await backToLoginButton.scrollIntoViewIfNeeded();
    await backToLoginButton.click({ force: true });
    await expect(page.getByRole("button", { name: /Continuar com Google/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Acesso ao Workspace" })).toBeVisible();

    clientErrors.expectNoCriticalErrors();
  });

  test("shows selected plan context for paid flows", async ({ page }) => {
    test.skip(true, "Funcionalidade de contexto de plano na página de auth foi removida.");
    await page.goto("/auth?plan=founding");

    await expect(page.getByText("Plano Founding")).toBeVisible();
    await expect(
      page.getByText(
        "Plano anual para usuários iniciais que querem acompanhar a evolução do produto com acesso premium completo.",
      ),
    ).toBeVisible();
    await expect(page.getByText("Checkout interno preservado")).toBeVisible();
  });

  test("shows an inline error for invalid credentials", async ({ page, browserName, isMobile }) => {
    test.skip(browserName !== "chromium" || Boolean(isMobile), "Evita rate limit desnecessário no provider.");
    test.skip(!hasRealSupabaseAuth, "Exige Supabase Auth real no ambiente de CI.");

    await page.goto("/auth");
    await page.locator('input[name="email"]').fill("qa-invalido@codetrail.site");
    await page.locator('input[name="password"]').fill("senha-incorreta-123");
    await page.getByRole("button", { name: "Autorizar Acesso" }).click();

    await expect(page.getByText(/Credenciais incorretas|Erro ao autenticar/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Autorizar Acesso" })).toBeEnabled();
  });

  test("handles Google OAuth cancellation gracefully through the callback", async ({ page }) => {
    test.skip(true, "Funcionalidade de OAuth callback simplificada.");
    await page.goto(
      "/auth/callback?error=access_denied&error_description=access%20denied&plan=pro&target=workspace",
    );

    await expect(page).toHaveURL(/\/auth\?/);
    await expect(page.getByText(/Falha na autenticação|erro/i)).toBeVisible();
  });

  test("renders correctly with reduced motion enabled", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/auth?plan=pro");

    await expect(page.getByRole("heading", { name: "Acesso ao Workspace" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continuar com Google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Autorizar Acesso" })).toBeVisible();
  });
});
