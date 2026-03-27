import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildDefaultSettings,
  composeWorkspaceData,
  emptyBillingSnapshot,
  featureAccess,
} from "@/utils/workspace/helpers";
import type {
  AppSettingsRow,
  BillingCheckoutSession,
  BillingPlanCode,
  BillingSnapshot,
  BillingCheckoutUiMode,
  FlashcardRow,
  MindMapRow,
  ProfileRow,
  ProjectRow,
  ProjectStepRow,
  ReviewRow,
  StudyModuleRow,
  StudyNoteRow,
  StudySessionRow,
  StudySkillRow,
  StudyTrackRow,
  TaskRow,
  UserGoalRow,
  UserSkillProgressRow,
  WorkspaceLoadResult,
} from "@/utils/workspace/types";

type DeletableWorkspaceEntity =
  | "study_sessions"
  | "tasks"
  | "reviews"
  | "projects"
  | "study_notes"
  | "flashcards"
  | "mind_maps";

interface UpsertableWorkspaceRowMap {
  profiles: ProfileRow;
  user_goals: UserGoalRow;
  app_settings: AppSettingsRow;
  study_sessions: StudySessionRow;
  tasks: TaskRow;
  reviews: ReviewRow;
  projects: ProjectRow;
  study_notes: StudyNoteRow;
  flashcards: FlashcardRow;
  mind_maps: MindMapRow;
}

export async function loadWorkspaceData(
  supabase: SupabaseClient,
  userId: string,
): Promise<WorkspaceLoadResult> {
  const errors: string[] = [];
  const billing = await fetchBillingSnapshot(supabase).catch((error: unknown) => {
    errors.push(errorMessage(error));
    return emptyBillingSnapshot();
  });
  const access = featureAccess(billing);

  const [
    profile,
    goal,
    tracks,
    skills,
    progress,
    modules,
    sessions,
    tasks,
    reviews,
    projects,
    notes,
    settings,
    flashcards,
    mindMaps,
  ] = await Promise.all([
    maybeSingle<ProfileRow>(
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      errors,
      "profiles",
    ),
    maybeSingle<UserGoalRow>(
      supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      errors,
      "user_goals",
    ),
    listRows<StudyTrackRow>(
      supabase.from("study_tracks").select("*").order("updated_at"),
      errors,
      "study_tracks",
    ),
    listRows<StudySkillRow>(
      supabase.from("study_skills").select("*").order("sort_order"),
      errors,
      "study_skills",
    ),
    listRows<UserSkillProgressRow>(
      supabase
        .from("user_skill_progress")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      errors,
      "user_skill_progress",
    ),
    listRows<StudyModuleRow>(
      supabase.from("study_modules").select("*").order("sort_order"),
      errors,
      "study_modules",
    ),
    listRows<StudySessionRow>(
      supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("start_time", { ascending: false }),
      errors,
      "study_sessions",
    ),
    listRows<TaskRow>(
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: false }),
      errors,
      "tasks",
    ),
    listRows<ReviewRow>(
      supabase
        .from("reviews")
        .select("*")
        .eq("user_id", userId)
        .order("scheduled_for", { ascending: true }),
      errors,
      "reviews",
    ),
    listRows<ProjectRow>(
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      errors,
      "projects",
    ),
    listRows<StudyNoteRow>(
      supabase
        .from("study_notes")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      errors,
      "study_notes",
    ),
    maybeSingle<AppSettingsRow>(
      supabase.from("app_settings").select("*").eq("user_id", userId).maybeSingle(),
      errors,
      "app_settings",
    ),
    access.flashcards
      ? listRows<FlashcardRow>(
          supabase
            .from("flashcards")
            .select("*")
            .eq("user_id", userId)
            .order("due_at", { ascending: true }),
          errors,
          "flashcards",
        )
      : Promise.resolve([]),
    access.mindMaps
      ? listRows<MindMapRow>(
          supabase
            .from("mind_maps")
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false }),
          errors,
          "mind_maps",
        )
      : Promise.resolve([]),
  ]);
  const projectIds = projects.map((project) => project.id);
  const projectSteps = projectIds.length
    ? await listRows<ProjectStepRow>(
        supabase
          .from("project_steps")
          .select("*")
          .in("project_id", projectIds)
          .order("sort_order"),
        errors,
        "project_steps",
      )
    : [];

  return {
    ...composeWorkspaceData({
      profile,
      goal,
      tracks,
      skills,
      progress,
      modules,
      sessions,
      tasks,
      reviews,
      projects,
      projectSteps,
      notes,
      flashcards,
      mindMaps,
      settings: settings ?? buildDefaultSettings(userId),
      billing,
    }),
    errors,
  };
}

export async function fetchBillingSnapshot(
  supabase: SupabaseClient,
): Promise<BillingSnapshot> {
  const { data, error } = await supabase.rpc("get_my_billing_snapshot");
  if (error) {
    throw new Error(error.message);
  }

  return (data as BillingSnapshot | null) ?? emptyBillingSnapshot();
}

export async function createCheckout(
  _supabase: SupabaseClient,
  planCode: BillingPlanCode,
  accessToken?: string | null,
  returnUrl?: string | null,
  uiMode: BillingCheckoutUiMode = "hosted",
) {
  return await createCheckoutWithAccessToken(planCode, accessToken ?? null, returnUrl, uiMode);
}

export async function createPortalSession(_supabase: SupabaseClient, returnUrl?: string | null) {
  void _supabase;
  const data = await invokeInternalBillingApi<{ url?: string }>(
    "/api/billing/portal",
    {
      method: "POST",
      body: returnUrl ? { returnUrl } : {},
    },
  );
  const url = (data as { url?: string } | null)?.url;
  if (!url) {
    throw new Error("Resposta inválida ao criar sessão do portal.");
  }
  return url;
}

export async function cancelSubscription(_supabase: SupabaseClient) {
  void _supabase;
  const data = await invokeInternalBillingApi<{ snapshot?: BillingSnapshot }>(
    "/api/billing/cancel",
    {
      method: "POST",
      body: {},
    },
  );
  const snapshot = (data as { snapshot?: BillingSnapshot } | null)?.snapshot;
  if (!snapshot) {
    throw new Error("Resposta inválida ao cancelar assinatura.");
  }
  return snapshot;
}

export async function syncBillingSubscription(_supabase: SupabaseClient) {
  void _supabase;
  const data = await invokeInternalBillingApi<{ snapshot?: BillingSnapshot }>(
    "/api/billing/status?sync=1",
    {
      method: "GET",
    },
  );
  const snapshot = (data as { snapshot?: BillingSnapshot } | null)?.snapshot;
  if (!snapshot) {
    throw new Error("Resposta inválida ao sincronizar assinatura.");
  }
  return snapshot;
}

async function listRows<T>(
  query: PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
  errors: string[],
  label: string,
) {
  const { data, error } = await query;
  if (error) {
    errors.push(`${label}: ${error.message}`);
    return [];
  }
  return data ?? [];
}

async function maybeSingle<T>(
  query: PromiseLike<{
    data: T | null;
    error: { message: string } | null;
  }>,
  errors: string[],
  label: string,
) {
  const { data, error } = await query;
  if (error) {
    errors.push(`${label}: ${error.message}`);
    return null;
  }
  return data;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Erro inesperado ao carregar o workspace.";
}

async function createCheckoutWithAccessToken(
  planCode: BillingPlanCode,
  accessToken: string | null,
  returnUrl?: string | null,
  uiMode: BillingCheckoutUiMode = "hosted",
) {
  return await invokeInternalBillingApi<BillingCheckoutSession>(
    "/api/billing/checkout",
    {
      method: "POST",
      body: returnUrl ? { planCode, returnUrl, uiMode } : { planCode, uiMode },
      accessToken,
    },
  );
}

export async function fetchBillingClientConfig() {
  const response = await fetch("/api/billing/config", {
    method: "GET",
    cache: "force-cache",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || typeof payload !== "object") {
    throw new Error("Nao foi possivel carregar a configuracao de pagamento.");
  }

  if (!("publishableKey" in payload) || typeof payload.publishableKey !== "string" || payload.publishableKey.length === 0) {
    throw new Error("Stripe publishable key is missing.");
  }

  return {
    publishableKey: payload.publishableKey,
  };
}

export async function waitForBillingActivation(
  _supabase: SupabaseClient,
  planCode: BillingPlanCode,
  attempts = 8,
  delayMs = 1200,
) {
  void _supabase;
  let lastSnapshot = await fetchBillingStatus(planCode, false);
  if (isBillingPlanActive(lastSnapshot, planCode)) {
    return lastSnapshot;
  }

  for (let attempt = 1; attempt < attempts; attempt += 1) {
    await sleep(delayMs * attempt);
    lastSnapshot = await fetchBillingStatus(planCode, true);
    if (isBillingPlanActive(lastSnapshot, planCode)) {
      return lastSnapshot;
    }
  }

  throw new Error("O pagamento foi concluido, mas a assinatura ainda nao sincronizou. Abra o billing para atualizar.");
}

function readBillingErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  if ("error" in payload && payload.error) {
    return String(payload.error);
  }

  if ("message" in payload && payload.message) {
    return String(payload.message);
  }

  return "";
}

function isBillingPlanActive(snapshot: BillingSnapshot, planCode: BillingPlanCode) {
  if (snapshot.current_plan?.code !== planCode) {
    return false;
  }

  return snapshot.subscription?.status === "active" ||
    snapshot.subscription?.status === "trialing" ||
    snapshot.subscription?.status === "past_due";
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function saveProfileRow(supabase: SupabaseClient, payload: ProfileRow) {
  await upsertWorkspaceRow(supabase, "profiles", payload);
}

export async function saveGoalRow(supabase: SupabaseClient, payload: UserGoalRow) {
  await upsertWorkspaceRow(supabase, "user_goals", payload);
}

export async function saveSettingsRow(supabase: SupabaseClient, payload: AppSettingsRow) {
  await upsertWorkspaceRow(supabase, "app_settings", payload);
}

export async function saveSessionRow(supabase: SupabaseClient, payload: StudySessionRow) {
  await upsertWorkspaceRow(supabase, "study_sessions", payload);
}

export async function deleteSessionRow(supabase: SupabaseClient, id: string) {
  await deleteWorkspaceRow(supabase, "study_sessions", id);
}

export async function saveTaskRow(supabase: SupabaseClient, payload: TaskRow) {
  await upsertWorkspaceRow(supabase, "tasks", payload);
}

export async function deleteTaskRow(supabase: SupabaseClient, id: string) {
  await deleteWorkspaceRow(supabase, "tasks", id);
}

export async function saveReviewRow(supabase: SupabaseClient, payload: ReviewRow) {
  await upsertWorkspaceRow(supabase, "reviews", payload);
}

export async function deleteReviewRow(supabase: SupabaseClient, id: string) {
  await deleteWorkspaceRow(supabase, "reviews", id);
}

export async function saveProjectRow(supabase: SupabaseClient, payload: ProjectRow) {
  await upsertWorkspaceRow(supabase, "projects", payload);
}

export async function deleteProjectRow(supabase: SupabaseClient, id: string) {
  await deleteWorkspaceRow(supabase, "projects", id);
}

export async function saveProjectStepWithProgress(
  supabase: SupabaseClient,
  payload: ProjectStepRow,
) {
  const { error } = await supabase.rpc("upsert_project_step_with_progress", {
    target_step: payload,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteProjectStepWithProgress(
  supabase: SupabaseClient,
  stepId: string,
) {
  const { error } = await supabase.rpc("delete_project_step_with_progress", {
    target_step_id: stepId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveNoteRow(supabase: SupabaseClient, payload: StudyNoteRow) {
  await upsertWorkspaceRow(supabase, "study_notes", payload);
}

export async function deleteNoteRow(supabase: SupabaseClient, id: string) {
  await deleteWorkspaceRow(supabase, "study_notes", id);
}

export async function saveFlashcardRow(supabase: SupabaseClient, payload: FlashcardRow) {
  await upsertWorkspaceRow(supabase, "flashcards", payload);
}

export async function deleteFlashcardRow(supabase: SupabaseClient, id: string) {
  await deleteWorkspaceRow(supabase, "flashcards", id);
}

export async function saveMindMapRow(supabase: SupabaseClient, payload: MindMapRow) {
  await upsertWorkspaceRow(supabase, "mind_maps", payload);
}

export async function deleteMindMapRow(supabase: SupabaseClient, id: string) {
  await deleteWorkspaceRow(supabase, "mind_maps", id);
}

async function fetchBillingStatus(planCode: BillingPlanCode, sync = false) {
  const query = new URLSearchParams({ plan: planCode });
  if (sync) {
    query.set("sync", "1");
  }

  const payload = await invokeInternalBillingApi<{ snapshot?: BillingSnapshot }>(
    `/api/billing/status?${query.toString()}`,
    {
      method: "GET",
    },
  );

  const snapshot = (payload as { snapshot?: BillingSnapshot } | null)?.snapshot;
  if (!snapshot) {
    throw new Error("Resposta invalida ao consultar o billing.");
  }

  return snapshot;
}

async function invokeInternalBillingApi<T>(
  path: string,
  options: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
    accessToken?: string | null;
  },
) {
  const headers = new Headers();
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (options.accessToken) {
    headers.set("x-supabase-auth", `Bearer ${options.accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(path, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch {
    throw new Error("Nao foi possivel conectar ao servico de billing agora. Tente novamente em instantes.");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readBillingErrorPayload(payload) || `Request failed with status ${response.status}.`);
  }

  return payload as T;
}

async function upsertWorkspaceRow<TKey extends keyof UpsertableWorkspaceRowMap>(
  supabase: SupabaseClient,
  table: TKey,
  payload: UpsertableWorkspaceRowMap[TKey],
) {
  const { error } = await supabase.from(table).upsert(payload as never);
  if (error) {
    throw new Error(error.message);
  }
}

async function deleteWorkspaceRow(
  supabase: SupabaseClient,
  table: DeletableWorkspaceEntity,
  id: string,
) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}
