import type { SupportRequestInput } from "@/utils/support/shared";

const CLICKUP_API_BASE_URL = "https://api.clickup.com/api/v2";
const DEFAULT_CLICKUP_SUPPORT_LIST_ID = "901712375712";
const DEFAULT_CLICKUP_SUPPORT_STATUS = "nao atendidos";
const DEFAULT_CLICKUP_ASSIGNEE_ID = "290531825";

export async function createSupportClickUpTask(options: {
  input: SupportRequestInput;
  userPlan: string;
  requestId: string;
}) {
  const apiToken = process.env.CLICKUP_API_TOKEN?.trim();
  const listId = normalizeClickUpId(
    process.env.CLICKUP_SUPPORT_LIST_ID ||
      process.env.CLICKUP_LIST_ID ||
      DEFAULT_CLICKUP_SUPPORT_LIST_ID,
  );
  const defaultStatus =
    process.env.CLICKUP_DEFAULT_STATUS?.trim() || DEFAULT_CLICKUP_SUPPORT_STATUS;
  const assigneeId = normalizeClickUpId(
    process.env.CLICKUP_ASSIGNEE_ID || DEFAULT_CLICKUP_ASSIGNEE_ID,
  );

  if (!apiToken || !listId) {
    return {
      created: false as const,
      skippedReason: "missing_config",
    };
  }

  const response = await fetch(`${CLICKUP_API_BASE_URL}/list/${listId}/task`, {
    method: "POST",
    headers: {
      Authorization: apiToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: buildTaskName(options.input, options.requestId),
      description: buildTaskDescription(options),
      tags: ["support", options.input.origin === "Landing Page" ? "landing" : "web"],
      ...(defaultStatus ? { status: defaultStatus } : {}),
      ...(assigneeId ? { assignees: [Number(assigneeId)] } : {}),
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const clickUpMessage =
      payload && typeof payload === "object" && "err" in payload
        ? String(payload.err)
        : payload && typeof payload === "object" && "error" in payload
          ? String(payload.error)
          : `ClickUp failed with status ${response.status}.`;

    throw new Error(clickUpMessage);
  }

  const taskId =
    payload && typeof payload === "object" && "id" in payload ? String(payload.id) : null;
  const taskUrl =
    payload && typeof payload === "object" && "url" in payload ? String(payload.url) : null;

  return {
    created: true as const,
    taskId,
    taskUrl,
  };
}

function buildTaskName(input: SupportRequestInput, requestId: string) {
  const ticketCode = requestId.slice(0, 8).toUpperCase();
  return `[${input.origin === "Landing Page" ? "Landing" : "Web"}][${ticketCode}] ${input.subject} — ${input.name}`;
}

function buildTaskDescription(options: {
  input: SupportRequestInput;
  userPlan: string;
  requestId: string;
}) {
  return [
    "Novo contato de suporte recebido pelo CodeTrail.",
    "",
    `Ticket: ${options.requestId}`,
    `Origem: ${options.input.origin}`,
    `Autenticado: ${options.input.authenticated ? "Sim" : "Nao"}`,
    `Nome: ${options.input.name}`,
    `E-mail: ${options.input.email}`,
    `Plano: ${options.userPlan}`,
    `Pagina atual: ${options.input.pageUrl || "Nao informada"}`,
    "",
    "Descricao do problema:",
    options.input.description,
  ].join("\n");
}

function normalizeClickUpId(value: string | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/\d+/);
  return match ? match[0] : null;
}
