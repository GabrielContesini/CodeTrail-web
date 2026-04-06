import { expect, test, type TestInfo } from "@playwright/test";
import { hasAuthCredentials } from "../helpers/constants";
import {
  escapeForRegex,
  expectOperationModalToClose,
  gotoWorkspaceRoute,
} from "../helpers/workspace";

test.skip(!hasAuthCredentials(), "E2E_USER_EMAIL e E2E_USER_PASSWORD nao configurados.");

test.describe("workspace regressions", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || Boolean(isMobile),
    "A bateria de regressao roda apenas no Chromium desktop.",
  );
  test.describe.configure({ mode: "serial" });

  test("validates dashboard actions, privacy, support and SkillThree overlays", async ({
    page,
  }) => {
    await gotoWorkspaceRoute(page, "/workspace/dashboard", "Painel");
    await expect(page.getByRole("link", { name: /retomar sessão/i })).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/workspace\/sessions$/),
      page.getByRole("link", { name: /retomar sessão/i }).click(),
    ]);
    await expect(page.locator("h1, h2").filter({ hasText: "Sessões" }).first()).toBeVisible();

    await gotoWorkspaceRoute(page, "/workspace/skillthree", "SkillThree");

    await page.getByRole("button", { name: /ver missão/i }).click();
    const missionDialog = page.getByRole("dialog");
    await expect(missionDialog).toBeVisible();
    await missionDialog.getByRole("button", { name: /fechar/i }).last().click();
    await expect(missionDialog).toBeHidden();

    await page.getByRole("button", { name: /ver ranking completo/i }).click();
    const rankingDialog = page.getByRole("dialog");
    await expect(rankingDialog.getByRole("heading", { name: "Ranking" })).toBeVisible();
    await rankingDialog.getByRole("button", { name: /fechar/i }).first().click();
    await expect(rankingDialog).toBeHidden();

    await page.getByTitle("Privacidade").click();
    await expect(page.locator("#privacy-preferences-panel")).toBeVisible();
    await page
      .getByRole("button", { name: /fechar preferências de privacidade/i })
      .click();
    await expect(page.locator("#privacy-preferences-panel")).toBeHidden();

    await page.getByRole("button", { name: /abrir suporte/i }).click();
    await expect(page.getByRole("heading", { name: /system support/i })).toBeVisible();
    await page.getByRole("button", { name: /fechar chat/i }).click();
    await expect(page.getByRole("heading", { name: /system support/i })).toHaveCount(0);
  });

  test("creates, completes, edits and deletes tasks and reviews", async ({
    page,
  }, testInfo: TestInfo) => {
    const token = uniqueToken(testInfo);
    const taskTitle = `Tarefa ${token}`;
    const taskEditedTitle = `${taskTitle} editada`;
    const reviewTitle = `Revisão ${token}`;
    const reviewEditedTitle = `${reviewTitle} editada`;

    await gotoWorkspaceRoute(page, "/workspace/tasks", "Tarefas");

    await page.getByRole("button", { name: /nova tarefa/i }).click();
    await page.locator('input[name="title"]').fill(taskTitle);
    await page.locator('textarea[name="description"]').fill(`Descricao ${token}`);
    await page.locator('select[name="priority"]').selectOption("critical");
    await page.getByRole("dialog").getByRole("button", { name: /salvar dados/i }).click();
    await expectOperationModalToClose(page, /Salvando tarefa/i);

    const taskRow = page.getByTestId("task-row").filter({ hasText: taskTitle }).first();
    await expect(taskRow).toBeVisible();
    await taskRow.getByRole("button", { name: /^Concluir$/ }).click();
    await expectOperationModalToClose(page, /Salvando tarefa/i);
    await expect(taskRow).toContainText(/Concluída/i);

    await taskRow.getByRole("button", { name: /^Editar$/ }).click();
    await page.locator('input[name="title"]').fill(taskEditedTitle);
    await page.getByRole("dialog").getByRole("button", { name: /salvar dados/i }).click();
    await expectOperationModalToClose(page, /Salvando tarefa/i);

    const editedTaskRow = page
      .getByTestId("task-row")
      .filter({ hasText: taskEditedTitle })
      .first();
    await expect(editedTaskRow).toBeVisible();
    await editedTaskRow.getByRole("button", { name: /excluir tarefa/i }).click();
    await expectOperationModalToClose(page, /Removendo tarefa/i);
    await expect(
      page.getByTestId("task-row").filter({ hasText: taskEditedTitle }),
    ).toHaveCount(0);

    await page.goto("/workspace/reviews", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(new RegExp(`${escapeForRegex("/workspace/reviews")}(?:\\?.*)?$`));
    await expect(
      page.locator("h1, h2").filter({ hasText: /Revisão|Revisões/ }).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /iniciar sequência/i })).toBeVisible();
    await page.getByRole("button", { name: /iniciar sequência/i }).click();
    await page.locator('input[name="title"]').fill(reviewTitle);
    await page.locator('input[name="interval_label"]').fill("D+3");
    await page.locator('textarea[name="notes"]').fill(`Notas ${token}`);
    await page.getByRole("dialog").getByRole("button", { name: /salvar dados/i }).click();
    await expectOperationModalToClose(page, /Salvando revisao/i);

    const reviewRow = page.getByTestId("review-row").filter({ hasText: reviewTitle }).first();
    await expect(reviewRow).toBeVisible();
    await reviewRow.getByRole("button", { name: /resolver/i }).click();
    await expectOperationModalToClose(page, /Salvando revisao/i);
    await expect(reviewRow).toContainText(/Concluída/i);

    await reviewRow.getByRole("button", { name: /^Editar$/ }).click();
    await page.locator('input[name="title"]').fill(reviewEditedTitle);
    await page.getByRole("dialog").getByRole("button", { name: /salvar dados/i }).click();
    await expectOperationModalToClose(page, /Salvando revisao/i);

    const editedReviewRow = page
      .getByTestId("review-row")
      .filter({ hasText: reviewEditedTitle })
      .first();
    await expect(editedReviewRow).toBeVisible();
    await editedReviewRow.getByRole("button", { name: /excluir revisão/i }).click();
    await expectOperationModalToClose(page, /Removendo revisao/i);
    await expect(
      page.getByTestId("review-row").filter({ hasText: reviewEditedTitle }),
    ).toHaveCount(0);
  });
});

function uniqueToken(testInfo: TestInfo) {
  return `${Date.now()}-${testInfo.project.name}`.replace(/[^a-zA-Z0-9-]+/g, "-");
}
