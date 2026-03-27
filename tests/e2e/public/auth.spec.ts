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

    await expect(page.getByRole("heading", { name: "Acesse sua conta" })).toBeVisible();
    await expect(page.getByTestId("google-auth-button")).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(page.getByTestId("google-auth-button")).toBeFocused();

    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();
    await expect(page.getByTestId("google-auth-button")).toContainText("Criar conta com Google");

    await page.getByRole("button", { name: "Voltar para login" }).click();
    await expect(page.getByRole("heading", { name: "Acesse sua conta" })).toBeVisible();

    clientErrors.expectNoCriticalErrors();
  });

  test("shows selected plan context for paid flows", async ({ page }) => {
    await page.goto("/auth?plan=founding");

    await expect(page.getByText("Plano Founding").first()).toBeVisible();
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
    await page.getByRole("button", { name: "Entrar no sistema" }).click();

    await expect(page.getByText("Falha na autenticação")).toBeVisible();
    await expect(
      page.getByText(
        /Credenciais incorretas \(E-mail ou senha\)\.|Falha de comunicação com os servidores\. Verifique sua conexão e tente novamente\./,
      ),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar no sistema" })).toBeEnabled();
  });

  test("handles Google OAuth cancellation gracefully through the callback", async ({ page }) => {
    await page.goto(
      "/auth/callback?error=access_denied&error_description=access%20denied&plan=pro&target=workspace",
    );

    await expect(page).toHaveURL(/\/auth\?/);
    await expect(page.getByText("Falha na autenticação")).toBeVisible();
    await expect(page.getByText("A autenticação com Google foi cancelada antes da conclusão.")).toBeVisible();
    await expect(page.getByText("Plano Pro").first()).toBeVisible();
  });

  test("renders correctly with reduced motion enabled", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/auth?plan=pro&target=download");

    await expect(page.getByRole("heading", { name: "Acesse sua conta" })).toBeVisible();
    await expect(page.getByTestId("google-auth-button")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar no sistema" })).toBeVisible();
  });
});
