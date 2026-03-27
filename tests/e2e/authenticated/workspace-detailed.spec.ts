import { expect, test, type TestInfo } from "@playwright/test";
import { hasAuthCredentials } from "../helpers/constants";
import { gotoWorkspaceRoute } from "../helpers/workspace";

test.skip(!hasAuthCredentials(), "E2E_USER_EMAIL e E2E_USER_PASSWORD nao configurados.");

test.describe("detailed workspace audit", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || Boolean(isMobile),
    "A auditoria detalhada roda apenas no Chromium desktop para evitar corrida de dados.",
  );
  test.describe.configure({ mode: "serial" });

  test("audits shell controls, dashboard actions and locked/public sections", async ({ page }) => {
    await gotoWorkspaceRoute(page, "/workspace/dashboard", "Dashboard");

    await page.getByRole("button", { name: "Recolher sidebar" }).click();
    await expect(page.getByRole("button", { name: "Expandir sidebar" })).toBeVisible();
    await page.getByRole("button", { name: "Expandir sidebar" }).click();
    await expect(page.getByRole("button", { name: "Recolher sidebar" })).toBeVisible();

    await page.getByRole("button", { name: /^Sincronizar$/ }).click();
    await expect(page.getByText("Sincronizando workspace")).toBeVisible();
    await expect(page.getByText("Sincronizando workspace")).toBeHidden({ timeout: 30_000 });

    await Promise.all([
      page.waitForURL(/\/workspace\/analytics$/),
      page.getByRole("link", { name: "Análises" }).click(),
    ]);
    await expect(page.locator("h1, h2").filter({ hasText: /Analytics|Análises/ }).first()).toBeVisible();
    if (await page.getByText("Análises premium bloqueadas").isVisible().catch(() => false)) {
      await expect(page.getByRole("button", { name: /Fazer upgrade/i })).toBeVisible();
    }

    await gotoWorkspaceRoute(page, "/workspace/dashboard", "Dashboard");
    await Promise.all([
      page.waitForURL(/\/workspace\/sessions$/),
      page.getByRole("link", { name: /Iniciar foco/i }).click(),
    ]);
    await expect(page.locator("h1, h2").filter({ hasText: "Sessões" }).first()).toBeVisible();

    await gotoWorkspaceRoute(page, "/workspace/dashboard", "Dashboard");
    await Promise.all([
      page.waitForURL(/\/workspace\/notes$/),
      page.getByRole("link", { name: /Abrir notas/i }).click(),
    ]);
    await expect(page.locator("h1, h2").filter({ hasText: "Notas" }).first()).toBeVisible();

    await gotoWorkspaceRoute(page, "/workspace/dashboard", "Dashboard");
    await Promise.all([
      page.waitForURL(/\/workspace\/settings\/billing$/),
      page.getByRole("link", { name: "Gerenciar plano" }).click(),
    ]);
    await expect(page.locator("h1, h2").filter({ hasText: "Plano e cobrança" }).first()).toBeVisible();
  });

  test("audits settings modals and account maintenance actions", async ({ page }, testInfo) => {
    const token = uniqueToken(testInfo, "goal");

    await page.goto("/workspace/settings");
    await expect(page.locator("h1, h2").filter({ hasText: "Configurações" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Editar conta" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Editar conta" })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByRole("button", { name: "Ajustar meta" }).click();
    await expect(page.getByRole("heading", { name: "Ajustar meta" })).toBeVisible();
    await page.locator('textarea[name="primary_goal"]').fill(`Meta validada ${token}`);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText(`Meta validada ${token}`)).toBeVisible();

    await page.getByRole("button", { name: "Editar preferências" }).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Preferências" })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByRole("button", { name: "Atualizar billing" }).click();
    await expect(page.getByText("Atualizando billing")).toBeVisible();
    await expect(page.getByText("Atualizando billing")).toBeHidden({ timeout: 30_000 });

    await page.getByRole("button", { name: "Área avançada" }).click();
    await expect(page).toHaveURL(/\/workspace\/settings\/billing$/);
  });

  test("audits sessions CRUD flow", async ({ page }, testInfo) => {
    const token = uniqueToken(testInfo, "session");
    const initialNote = `Sessao ${token}`;
    const updatedNote = `Sessao atualizada ${token}`;

    await page.goto("/workspace/sessions");
    await page.getByRole("main").getByRole("button", { name: "Nova sessão" }).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Nova sessão" })).toBeVisible();
    await page.locator('select[name="type"]').selectOption("project");
    await page.locator('input[name="duration_minutes"]').fill("35");
    await page.locator('input[name="productivity_score"]').fill("5");
    await page.locator('textarea[name="notes"]').fill(initialNote);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    const row = page.getByTestId("session-row").filter({ hasText: initialNote }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Editar" }).click();
    await page.locator('textarea[name="notes"]').fill(updatedNote);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    const updatedRow = page.getByTestId("session-row").filter({ hasText: updatedNote }).first();
    await expect(updatedRow).toBeVisible();
    await updatedRow.getByRole("button", { name: /Excluir sessão/i }).click();
    await expect(updatedRow).toBeHidden({ timeout: 20_000 });
  });

  test("audits tasks and reviews CRUD flows", async ({ page }, testInfo) => {
    const taskToken = uniqueToken(testInfo, "task");
    const taskTitle = `Tarefa ${taskToken}`;
    const reviewToken = uniqueToken(testInfo, "review");
    const reviewTitle = `Revisao ${reviewToken}`;

    await page.goto("/workspace/tasks");
    await page.getByRole("button", { name: "Nova tarefa" }).click();
    await page.locator('input[name="title"]').fill(taskTitle);
    await page.locator('textarea[name="description"]').fill(`Descricao ${taskToken}`);
    await page.locator('select[name="priority"]').selectOption("critical");
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    const taskRow = page.getByTestId("task-row").filter({ hasText: taskTitle }).first();
    await expect(taskRow).toBeVisible();
    await taskRow.getByRole("button", { name: "Concluir" }).click();
    await expect(taskRow.getByRole("button", { name: "Concluir" })).toHaveCount(0);
    await taskRow.getByRole("button", { name: "Editar" }).click();
    await page.locator('input[name="title"]').fill(`${taskTitle} editada`);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    const updatedTaskRow = page.getByTestId("task-row").filter({ hasText: `${taskTitle} editada` }).first();
    await expect(updatedTaskRow).toBeVisible();
    await updatedTaskRow.getByRole("button", { name: /Excluir tarefa/i }).click();
    await expect(updatedTaskRow).toBeHidden({ timeout: 20_000 });

    await page.goto("/workspace/reviews");
    await page.getByRole("button", { name: "Nova revisão" }).click();
    await page.locator('input[name="title"]').fill(reviewTitle);
    await page.locator('input[name="interval_label"]').fill("D+3");
    await page.locator('textarea[name="notes"]').fill(`Notas ${reviewToken}`);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    const reviewRow = page.getByTestId("review-row").filter({ hasText: reviewTitle }).first();
    await expect(reviewRow).toBeVisible();
    await reviewRow.getByRole("button", { name: "Concluir" }).click();
    await expect(reviewRow.getByRole("button", { name: "Concluir" })).toHaveCount(0);
    await reviewRow.getByRole("button", { name: "Editar" }).click();
    await page.locator('input[name="title"]').fill(`${reviewTitle} editada`);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    const updatedReviewRow = page.getByTestId("review-row").filter({ hasText: `${reviewTitle} editada` }).first();
    await expect(updatedReviewRow).toBeVisible();
    await updatedReviewRow.getByRole("button", { name: /Excluir revisão/i }).click();
    await expect(updatedReviewRow).toBeHidden({ timeout: 20_000 });
  });

  test("audits notes and projects CRUD flows", async ({ page }, testInfo) => {
    const noteToken = uniqueToken(testInfo, "note");
    const noteTitle = `Nota ${noteToken}`;
    const noteBody = `Conteudo ${noteToken}`;
    const projectToken = uniqueToken(testInfo, "project");
    const projectTitle = `Projeto ${projectToken}`;
    const stepTitle = `Etapa ${projectToken}`;

    await page.goto("/workspace/notes");
    await page.getByRole("button", { name: "Nova nota" }).click();
    await page.locator('input[name="folder_name"]').fill("QA");
    await page.locator('input[name="title"]').fill(noteTitle);
    await page.locator('textarea[name="content"]').fill(noteBody);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    const noteLibraryItem = page.getByTestId("note-item").filter({ hasText: noteTitle }).first();
    await noteLibraryItem.click();
    await expect(page.getByText(noteBody)).toBeVisible();
    await page.getByRole("button", { name: "Editar" }).click();
    await page.locator('textarea[name="content"]').fill(`${noteBody} atualizado`);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByText(`${noteBody} atualizado`)).toBeVisible();
    await page.getByRole("button", { name: /Excluir nota/i }).click();
    await expect(page.getByTestId("note-item").filter({ hasText: noteTitle })).toHaveCount(0);

    await page.goto("/workspace/projects");
    await page.getByRole("button", { name: "Novo projeto" }).click();
    await page.locator('input[name="title"]').fill(projectTitle);
    await page.locator('input[name="scope"]').fill("Escopo QA");
    await page.locator('textarea[name="description"]').fill(`Descricao ${projectToken}`);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    const projectLibraryItem = page.getByTestId("project-item").filter({ hasText: projectTitle }).first();
    await projectLibraryItem.click();
    await expect(page.getByText(`Descricao ${projectToken}`)).toBeVisible();
    await page.getByPlaceholder("Adicionar etapa").fill(stepTitle);
    await page.getByRole("button", { name: "Adicionar etapa" }).click();
    const stepRow = page.getByTestId("project-step-row").filter({ hasText: stepTitle }).first();
    await expect(stepRow).toBeVisible();
    await stepRow.getByRole("button", { name: new RegExp(`Concluir etapa ${stepTitle}`) }).click();
    await stepRow.getByRole("button", { name: new RegExp(`Excluir etapa ${stepTitle}`) }).click();
    await expect(stepRow).toBeHidden({ timeout: 20_000 });

    await page.getByRole("button", { name: "Editar" }).first().click();
    await page.locator('input[name="title"]').fill(`${projectTitle} editado`);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByTestId("project-item").filter({ hasText: `${projectTitle} editado` }).first()).toBeVisible();
    await page.getByRole("button", { name: /Excluir projeto/i }).click();
    await expect(page.getByTestId("project-item").filter({ hasText: `${projectTitle} editado` })).toHaveCount(0);
  });

  test("audits flashcards gating or CRUD and the embedded upgrade CTA", async ({ page }, testInfo) => {
    const token = uniqueToken(testInfo, "flashcard");
    const question = `Pergunta ${token}`;

    await page.goto("/workspace/flashcards");
    await expect(page.locator("h1, h2").filter({ hasText: "Flashcards" }).first()).toBeVisible();

    if (await page.getByText("Flashcards premium bloqueados").isVisible().catch(() => false)) {
      await expect(page.getByRole("button", { name: /Fazer upgrade/i })).toBeVisible();
      return;
    }

    await page.getByRole("button", { name: "Novo card" }).click();
    await page.locator('input[name="deck_name"]').fill("QA Deck");
    await page.locator('textarea[name="question"]').fill(question);
    await page.locator('textarea[name="answer"]').fill(`Resposta ${token}`);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    const flashcardLibraryItem = page.getByTestId("flashcard-item").filter({ hasText: question }).first();
    await flashcardLibraryItem.click();
    await expect(page.getByText(`Resposta ${token}`)).toBeVisible();
    await page.getByRole("button", { name: "Bom" }).click();
    await page.getByRole("button", { name: "Editar" }).click();
    await page.locator('textarea[name="question"]').fill(`${question} editada`);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar Dados" }).click();
    await expect(page.getByTestId("flashcard-item").filter({ hasText: `${question} editada` }).first()).toBeVisible();
    await page.getByRole("button", { name: /Excluir flashcard/i }).click();
    await expect(page.getByTestId("flashcard-item").filter({ hasText: `${question} editada` })).toHaveCount(0);
  });

  test("audits mind maps library and dedicated editor workflow", async ({ page }, testInfo) => {
    const mapToken = uniqueToken(testInfo, "mindmap");
    const mapTitle = `Mapa ${mapToken}`;
    const nodeTitle = `No ${mapToken}`;

    await page.goto("/workspace/mind-maps");
    await expect(page.locator("h1, h2").filter({ hasText: "Mind Maps" }).first()).toBeVisible();

    if (await page.getByText("Mind maps premium bloqueados").isVisible().catch(() => false)) {
      await expect(page.getByRole("button", { name: /Fazer upgrade/i })).toBeVisible();
      return;
    }

    await page.getByRole("button", { name: "Novo mapa" }).click();
    await expect(page.getByRole("heading", { name: "Novo mapa" })).toBeVisible();
    await page.getByRole("dialog").getByLabel("Titulo").fill(mapTitle);
    await page.getByRole("dialog").getByRole("button", { name: "Criar mapa" }).click();
    await page.waitForURL(/\/workspace\/mind-maps\/editor\//);
    await expect(page.locator("h1, h2").filter({ hasText: mapTitle }).first()).toBeVisible();

    await page.getByRole("button", { name: "Novo nó" }).click();
    await expect(page.getByRole("heading", { name: "Configurar nó" })).toBeVisible();
    await page.getByRole("dialog").getByLabel("Rótulo do nó").fill(nodeTitle);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar nó" }).click();
    await expect(page.getByText(nodeTitle).first()).toBeVisible();

    await page.getByRole("button", { name: "Editar nó" }).first().click();
    await page.getByRole("dialog").getByLabel("Rótulo do nó").fill(`${nodeTitle} editado`);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar nó" }).click();
    await expect(page.getByText(`${nodeTitle} editado`).first()).toBeVisible();

    await page.getByRole("button", { name: "Excluir nó" }).click();
    await expect(page.getByText(`${nodeTitle} editado`).first()).toHaveCount(0);

    await Promise.all([
      page.waitForURL(/\/workspace\/mind-maps$/),
      page.getByRole("button", { name: /Voltar para biblioteca/i }).first().click(),
    ]);
    await page.getByTestId("mindmap-item").filter({ hasText: mapTitle }).first().click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByTestId("mindmap-item").filter({ hasText: mapTitle })).toHaveCount(0);
  });
});

function uniqueToken(testInfo: TestInfo, prefix: string) {
  return `${prefix}-${Date.now()}-${testInfo.project.name}`.replace(/[^a-zA-Z0-9-]+/g, "-");
}
