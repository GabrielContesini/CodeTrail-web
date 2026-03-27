import { expect, test } from "@playwright/test";
import { hasAuthCredentials } from "../helpers/constants";
import { gotoWorkspaceRoute } from "../helpers/workspace";

test.skip(!hasAuthCredentials(), "E2E_USER_EMAIL e E2E_USER_PASSWORD nao configurados.");

const routes = [
  { path: "/workspace/dashboard", title: "Dashboard", section: "dashboard" },
  { path: "/workspace/tracks", title: "Trilhas", section: "tracks" },
  { path: "/workspace/sessions", title: "Sessões", section: "sessions" },
  { path: "/workspace/tasks", title: "Tarefas", section: "tasks" },
  { path: "/workspace/reviews", title: "Revisões", section: "reviews" },
  { path: "/workspace/projects", title: "Projetos", section: "projects" },
  { path: "/workspace/notes", title: "Notas", section: "notes" },
  { path: "/workspace/flashcards", title: "Flashcards", section: "flashcards" },
  { path: "/workspace/mind-maps", title: "Mind Maps", section: "mind-maps" },
  { path: "/workspace/analytics", title: /Analytics|Análises/, section: "analytics" },
  { path: "/workspace/settings", title: "Configurações", section: "settings" },
  { path: "/workspace/settings/billing", title: "Plano e cobrança", section: "settings" },
] as const;

test.describe("authenticated workspace navigation", () => {
  for (const route of routes) {
    test(`opens ${route.path}`, async ({ page }) => {
      await gotoWorkspaceRoute(page, route.path, route.title);
      await expect(page.getByTestId("workspace-sidebar")).toBeVisible();
      await expect(page.getByText("CodeTrail").first()).toBeVisible();

      if (!(await page.getByRole("button", { name: "Abrir sidebar" }).isVisible().catch(() => false))) {
        await expect(page.getByTestId(`workspace-nav-${route.section}`)).toHaveAttribute("aria-current", "page");
      }
    });
  }

  test("supports sidebar controls in desktop and mobile layouts", async ({ page, isMobile }) => {
    await gotoWorkspaceRoute(page, "/workspace/dashboard", "Dashboard");

    const sidebar = page.getByTestId("workspace-sidebar");

    if (Boolean(isMobile)) {
      await page.getByRole("button", { name: "Abrir sidebar" }).click();
      await expect(sidebar).toBeVisible();
      await page.getByRole("button", { name: "Fechar sidebar" }).click();
      await expect(page.getByRole("button", { name: "Fechar sidebar" })).toBeHidden();
      return;
    }

    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    await page.getByRole("button", { name: "Recolher sidebar" }).click();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await page.getByRole("button", { name: "Expandir sidebar" }).click();
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
  });
});
