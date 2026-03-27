"use client";

import { EmbeddedCheckoutDialog } from "@/app/components/embedded-checkout-dialog";
import { WorkspaceOnboarding } from "@/app/workspace/_components/onboarding/workspace-onboarding";
import { usePlanIntent } from "@/store/plan-intent-store";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  cancelSubscription,
  createCheckout,
  createPortalSession,
  deleteFlashcardRow,
  deleteMindMapRow,
  deleteNoteRow,
  deleteProjectRow,
  deleteProjectStepWithProgress,
  deleteReviewRow,
  deleteSessionRow,
  deleteTaskRow,
  fetchBillingSnapshot,
  loadWorkspaceData,
  saveFlashcardRow,
  saveGoalRow,
  saveMindMapRow,
  saveNoteRow,
  saveProfileRow,
  saveProjectRow,
  saveProjectStepWithProgress,
  saveReviewRow,
  saveSessionRow,
  saveSettingsRow,
  saveTaskRow,
  syncBillingSubscription,
  waitForBillingActivation,
} from "@/utils/workspace/api";
import {
  applyFlashcardReview,
  buildDefaultSettings,
  featureAccess,
} from "@/utils/workspace/helpers";
import type {
  AppSettingsRow,
  BillingPlanCode,
  BillingSnapshot,
  FlashcardRow,
  MindMapRow,
  ProfileRow,
  ProjectRow,
  ProjectStepRow,
  ReviewRow,
  StudyNoteRow,
  StudySessionRow,
  TaskRow,
  UserGoalRow,
  WorkspaceContextValue,
  WorkspaceData,
  WorkspaceOperationState,
  WorkspaceUser,
} from "@/utils/workspace/types";

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const MIN_OPERATION_MODAL_MS = 450;

export function WorkspaceProvider({
  initialUser,
  children,
}: {
  initialUser: WorkspaceUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const clearPlanIntent = usePlanIntent((state) => state.clearIntent);
  const [supabase] = useState(() => createClient());
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [operation, setOperation] = useState<WorkspaceOperationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [embeddedCheckout, setEmbeddedCheckout] = useState<{
    clientSecret: string;
    planCode: BillingPlanCode;
    planName: string;
  } | null>(null);
  const pendingOperationsRef = useRef(0);
  const onboardingAutoOpenedRef = useRef(false);
  const onboardingCompleted = data?.profile?.onboarding_completed ?? false;

  useEffect(() => {
    clearPlanIntent();
  }, [clearPlanIntent]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        const result = await loadWorkspaceData(supabase, initialUser.id);
        if (!active) return;
        applyWorkspaceResult(result);
      } catch (nextError) {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : "Falha ao carregar.");
        setData(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [initialUser.id, supabase]);

  useEffect(() => {
    if (
      loading ||
      onboardingAutoOpenedRef.current ||
      onboardingOpen ||
      modalOpen ||
      embeddedCheckout ||
      !data
    ) {
      return;
    }

    if (!shouldAutoOpenOnboarding(pathname, data)) {
      return;
    }

    onboardingAutoOpenedRef.current = true;
    setOnboardingOpen(true);
  }, [data, embeddedCheckout, loading, modalOpen, onboardingOpen, pathname]);

  function applyWorkspaceResult(result: WorkspaceData & { errors: string[] }) {
    setData(result);
    setError(result.errors.length ? result.errors.join(" | ") : null);
  }

  function applyBillingState(snapshot: BillingSnapshot) {
    setData((current) =>
      current
        ? {
            ...current,
            billing: snapshot,
            featureAccess: featureAccess(snapshot),
          }
        : current,
    );
  }

  async function fetchWorkspaceSnapshot() {
    const result = await loadWorkspaceData(supabase, initialUser.id);
    applyWorkspaceResult(result);
    return result;
  }

  function beginOperation(nextOperation: WorkspaceOperationState) {
    pendingOperationsRef.current += 1;
    setRefreshing(true);
    setOperation(nextOperation);
  }

  function finishOperation() {
    pendingOperationsRef.current = Math.max(0, pendingOperationsRef.current - 1);

    if (pendingOperationsRef.current === 0) {
      setRefreshing(false);
      setOperation(null);
    }
  }

  async function withOperation<T>(
    nextOperation: WorkspaceOperationState,
    action: () => Promise<T>,
  ) {
    const startedAt = Date.now();
    beginOperation(nextOperation);
    setError(null);

    try {
      return await action();
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_OPERATION_MODAL_MS) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, MIN_OPERATION_MODAL_MS - elapsed);
        });
      }
      finishOperation();
    }
  }

  async function reload() {
    try {
      await withOperation(workspaceReloadOperation(), async () => {
        await fetchWorkspaceSnapshot();
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao atualizar.");
    }
  }

  async function runMutation(
    action: () => Promise<void>,
    nextOperation: WorkspaceOperationState = genericMutationOperation(),
  ) {
    try {
      await withOperation(nextOperation, async () => {
        await action();
        await fetchWorkspaceSnapshot();
      });
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Nao foi possivel salvar.";
      setError(message);
      throw nextError;
    }
  }

  async function saveProfile(payload: Partial<ProfileRow>) {
    const base = data?.profile ?? defaultProfile(initialUser);
    const now = nowIso();
    const row: ProfileRow = {
      ...base,
      ...payload,
      id: initialUser.id,
      email: payload.email ?? base.email ?? initialUser.email,
      created_at: base.created_at || now,
      updated_at: now,
    };
    await runMutation(() => saveProfileRow(supabase, row), saveOperation("perfil"));
  }

  async function saveGoal(payload: Partial<UserGoalRow>) {
    const base = data?.goal ?? defaultGoal(initialUser.id, data?.profile?.desired_area);
    const now = nowIso();
    const row: UserGoalRow = {
      ...base,
      ...payload,
      id: payload.id ?? base.id,
      user_id: initialUser.id,
      created_at: base.created_at || now,
      updated_at: now,
    };
    await runMutation(() => saveGoalRow(supabase, row), saveOperation("meta"));
  }

  async function saveSettings(payload: Partial<AppSettingsRow>) {
    const base = data?.settings ?? buildDefaultSettings(initialUser.id);
    const now = nowIso();
    const row: AppSettingsRow = {
      ...base,
      ...payload,
      id: base.id || initialUser.id,
      user_id: initialUser.id,
      created_at: base.created_at || now,
      updated_at: now,
    };
    await runMutation(() => saveSettingsRow(supabase, row), saveOperation("preferencias"));
  }

  async function saveSession(payload: Partial<StudySessionRow>) {
    const existing = data?.sessions.find((item) => item.id === payload.id);
    const now = nowIso();
    const startTime = payload.start_time ?? existing?.start_time ?? now;
    const duration =
      payload.duration_minutes ?? existing?.duration_minutes ?? 50;
    const row: StudySessionRow = {
      id: payload.id ?? existing?.id ?? randomId(),
      user_id: initialUser.id,
      track_id: payload.track_id ?? existing?.track_id ?? null,
      skill_id: payload.skill_id ?? existing?.skill_id ?? null,
      module_id: payload.module_id ?? existing?.module_id ?? null,
      type: payload.type ?? existing?.type ?? "practice",
      start_time: startTime,
      end_time:
        payload.end_time ??
        existing?.end_time ??
        new Date(new Date(startTime).getTime() + duration * 60000).toISOString(),
      duration_minutes: duration,
      notes: payload.notes ?? existing?.notes ?? "",
      productivity_score:
        payload.productivity_score ?? existing?.productivity_score ?? 4,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    await runMutation(() => saveSessionRow(supabase, row), saveOperation("sessao"));
  }

  async function deleteSession(id: string) {
    await runMutation(() => deleteSessionRow(supabase, id), deleteOperation("sessao"));
  }

  async function saveTask(payload: Partial<TaskRow>) {
    const existing = data?.tasks.find((item) => item.id === payload.id);
    const now = nowIso();
    const status = payload.status ?? existing?.status ?? "pending";
    const row: TaskRow = {
      id: payload.id ?? existing?.id ?? randomId(),
      user_id: initialUser.id,
      track_id: payload.track_id ?? existing?.track_id ?? null,
      module_id: payload.module_id ?? existing?.module_id ?? null,
      title: payload.title ?? existing?.title ?? "Nova tarefa",
      description: payload.description ?? existing?.description ?? "",
      priority: payload.priority ?? existing?.priority ?? "medium",
      status,
      due_date: payload.due_date ?? existing?.due_date ?? null,
      completed_at:
        status === "completed"
          ? payload.completed_at ?? existing?.completed_at ?? now
          : null,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    await runMutation(() => saveTaskRow(supabase, row), saveOperation("tarefa"));
  }

  async function deleteTask(id: string) {
    await runMutation(() => deleteTaskRow(supabase, id), deleteOperation("tarefa"));
  }

  async function saveReview(payload: Partial<ReviewRow>) {
    const existing = data?.reviews.find((item) => item.id === payload.id);
    const now = nowIso();
    const status = payload.status ?? existing?.status ?? "pending";
    const row: ReviewRow = {
      id: payload.id ?? existing?.id ?? randomId(),
      user_id: initialUser.id,
      session_id: payload.session_id ?? existing?.session_id ?? null,
      track_id: payload.track_id ?? existing?.track_id ?? null,
      skill_id: payload.skill_id ?? existing?.skill_id ?? null,
      title: payload.title ?? existing?.title ?? "Nova revisão",
      scheduled_for:
        payload.scheduled_for ??
        existing?.scheduled_for ??
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status,
      interval_label: payload.interval_label ?? existing?.interval_label ?? "D+1",
      notes: payload.notes ?? existing?.notes ?? null,
      completed_at:
        status === "completed"
          ? payload.completed_at ?? existing?.completed_at ?? now
          : null,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    await runMutation(() => saveReviewRow(supabase, row), saveOperation("revisao"));
  }

  async function deleteReview(id: string) {
    await runMutation(() => deleteReviewRow(supabase, id), deleteOperation("revisao"));
  }

  async function saveProject(payload: Partial<ProjectRow>) {
    const existing = data?.projects.find((item) => item.id === payload.id);
    const now = nowIso();
    const row: ProjectRow = {
      id: payload.id ?? existing?.id ?? randomId(),
      user_id: initialUser.id,
      track_id: payload.track_id ?? existing?.track_id ?? null,
      title: payload.title ?? existing?.title ?? "Novo projeto",
      scope: payload.scope ?? existing?.scope ?? "Entrega prática",
      description: payload.description ?? existing?.description ?? "",
      repository_url: payload.repository_url ?? existing?.repository_url ?? null,
      documentation_url:
        payload.documentation_url ?? existing?.documentation_url ?? null,
      video_url: payload.video_url ?? existing?.video_url ?? null,
      status: payload.status ?? existing?.status ?? "planned",
      progress_percent:
        payload.progress_percent ?? existing?.progress_percent ?? 0,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    await runMutation(() => saveProjectRow(supabase, row), saveOperation("projeto"));
  }

  async function deleteProject(id: string) {
    await runMutation(() => deleteProjectRow(supabase, id), deleteOperation("projeto"));
  }

  async function saveProjectStep(payload: Partial<ProjectStepRow>) {
    const existing = data?.projectSteps.find((item) => item.id === payload.id);
    const projectId = payload.project_id ?? existing?.project_id;
    if (!projectId) {
      throw new Error("Etapa sem projeto associado.");
    }

    const now = nowIso();
    const row: ProjectStepRow = {
      id: payload.id ?? existing?.id ?? randomId(),
      project_id: projectId,
      title: payload.title ?? existing?.title ?? "Nova etapa",
      description: payload.description ?? existing?.description ?? "",
      is_done: payload.is_done ?? existing?.is_done ?? false,
      sort_order:
        payload.sort_order ??
        existing?.sort_order ??
        (data?.projectSteps.filter((item) => item.project_id === projectId).length ?? 0) + 1,
      completed_at:
        payload.is_done ?? existing?.is_done
          ? payload.completed_at ?? existing?.completed_at ?? now
          : null,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };

    await runMutation(async () => {
      await saveProjectStepWithProgress(supabase, row);
    }, saveOperation("etapa do projeto"));
  }

  async function deleteProjectStep(id: string) {
    await runMutation(async () => {
      await deleteProjectStepWithProgress(supabase, id);
    }, deleteOperation("etapa do projeto"));
  }

  async function saveNote(payload: Partial<StudyNoteRow>) {
    const existing = data?.notes.find((item) => item.id === payload.id);
    const now = nowIso();
    const row: StudyNoteRow = {
      id: payload.id ?? existing?.id ?? randomId(),
      user_id: initialUser.id,
      folder_name: payload.folder_name ?? existing?.folder_name ?? "Geral",
      title: payload.title ?? existing?.title ?? "Nova nota",
      content: payload.content ?? existing?.content ?? "",
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    await runMutation(() => saveNoteRow(supabase, row), saveOperation("nota"));
  }

  async function deleteNote(id: string) {
    await runMutation(() => deleteNoteRow(supabase, id), deleteOperation("nota"));
  }

  async function saveFlashcard(payload: Partial<FlashcardRow>) {
    const existing = data?.flashcards.find((item) => item.id === payload.id);
    const now = nowIso();
    const row: FlashcardRow = {
      id: payload.id ?? existing?.id ?? randomId(),
      user_id: initialUser.id,
      deck_name: payload.deck_name ?? existing?.deck_name ?? "Geral",
      question: payload.question ?? existing?.question ?? "Nova pergunta",
      answer: payload.answer ?? existing?.answer ?? "",
      track_id: payload.track_id ?? existing?.track_id ?? null,
      module_id: payload.module_id ?? existing?.module_id ?? null,
      project_id: payload.project_id ?? existing?.project_id ?? null,
      due_at: payload.due_at ?? existing?.due_at ?? now,
      last_reviewed_at: payload.last_reviewed_at ?? existing?.last_reviewed_at ?? null,
      review_count: payload.review_count ?? existing?.review_count ?? 0,
      correct_streak: payload.correct_streak ?? existing?.correct_streak ?? 0,
      ease_factor: payload.ease_factor ?? existing?.ease_factor ?? 2.3,
      interval_days: payload.interval_days ?? existing?.interval_days ?? 0,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    await runMutation(() => saveFlashcardRow(supabase, row), saveOperation("flashcard"));
  }

  async function deleteFlashcard(id: string) {
    await runMutation(() => deleteFlashcardRow(supabase, id), deleteOperation("flashcard"));
  }

  async function saveMindMap(payload: Partial<MindMapRow>) {
    const existing = data?.mindMaps.find((item) => item.id === payload.id);
    const now = nowIso();
    const row: MindMapRow = {
      id: payload.id ?? existing?.id ?? randomId(),
      user_id: initialUser.id,
      folder_name: payload.folder_name ?? existing?.folder_name ?? "Geral",
      title: payload.title ?? existing?.title ?? "Novo mapa",
      content_json: payload.content_json ?? existing?.content_json ?? "{}",
      track_id: payload.track_id ?? existing?.track_id ?? null,
      module_id: payload.module_id ?? existing?.module_id ?? null,
      project_id: payload.project_id ?? existing?.project_id ?? null,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    await runMutation(() => saveMindMapRow(supabase, row), saveOperation("mind map"));
  }

  async function deleteMindMap(id: string) {
    await runMutation(() => deleteMindMapRow(supabase, id), deleteOperation("mind map"));
  }

  async function reviewFlashcard(
    flashcard: FlashcardRow,
    grade: "again" | "hard" | "good" | "easy",
  ) {
    const updated = applyFlashcardReview(flashcard, grade);
    await runMutation(() => saveFlashcardRow(supabase, updated), reviewOperation());
  }

  async function refreshBilling() {
    try {
      await withOperation(billingRefreshOperation(), async () => {
        const billing = await fetchBillingSnapshot(supabase);
        applyBillingState(billing);
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha no billing.");
    }
  }

  async function handleCheckout(planCode: BillingPlanCode) {
    try {
      await withOperation(billingCheckoutOperation(planCode), async () => {
        const response = await createCheckout(
          supabase,
          planCode,
          undefined,
          `${window.location.origin}/workspace/settings/billing`,
          "embedded",
        );

        if (response.clientSecret) {
          const planName =
            data?.billing.available_plans.find((plan) => plan.code === planCode)?.name ??
            planCode.toUpperCase();

          setEmbeddedCheckout({
            clientSecret: response.clientSecret,
            planCode,
            planName,
          });
          return;
        }

        throw new Error("Nao foi possivel abrir o checkout interno agora.");
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha no checkout.");
      throw nextError;
    }
  }

  async function openPortal() {
    try {
      await withOperation(billingPortalOperation(), async () => {
        const url = await createPortalSession(
          supabase,
          `${window.location.origin}/workspace/settings/billing`,
        );
        window.location.assign(url);
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha no portal.");
      throw nextError;
    }
  }

  async function handleCancelSubscription() {
    try {
      await withOperation(billingCancelOperation(), async () => {
        const snapshot = await cancelSubscription(supabase);
        applyBillingState(snapshot);
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao cancelar.");
      throw nextError;
    }
  }

  async function syncBilling() {
    try {
      await withOperation(billingSyncOperation(), async () => {
        const snapshot = await syncBillingSubscription(supabase);
        applyBillingState(snapshot);
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao sincronizar.");
      throw nextError;
    }
  }

  async function signOut() {
    await withOperation(signOutOperation(), async () => {
      await supabase.auth.signOut();
      router.push("/auth");
      router.refresh();
    });
  }

  async function confirmEmbeddedCheckout() {
    if (!embeddedCheckout) {
      throw new Error("Nao foi possivel localizar a sessao de pagamento.");
    }

    await withOperation(billingConfirmationOperation(), async () => {
      const snapshot = await waitForBillingActivation(supabase, embeddedCheckout.planCode);
      applyBillingState(snapshot);
    });
  }

  function openOnboarding() {
    onboardingAutoOpenedRef.current = true;
    setOnboardingOpen(true);
  }

  function closeOnboarding() {
    setOnboardingOpen(false);
  }

  async function completeOnboarding() {
    if (onboardingCompleted) {
      setOnboardingOpen(false);
      return;
    }

    const base = data?.profile ?? defaultProfile(initialUser);
    const now = nowIso();
    const row: ProfileRow = {
      ...base,
      id: initialUser.id,
      full_name: base.full_name || initialUser.fullName || "Seu workspace",
      email: base.email ?? initialUser.email,
      desired_area: base.desired_area || "Tecnologia",
      current_level: base.current_level || "beginner",
      onboarding_completed: true,
      selected_track_id: base.selected_track_id ?? null,
      created_at: base.created_at || now,
      updated_at: now,
    };

    try {
      await saveProfileRow(supabase, row);
      setData((current) =>
        current
          ? {
              ...current,
              profile: row,
            }
          : current,
      );
      setOnboardingOpen(false);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Nao foi possivel concluir o onboarding.",
      );
      throw nextError;
    }
  }

  const value: WorkspaceContextValue = {
    user: initialUser,
    data,
    loading,
    refreshing,
    operation,
    error,
    onboardingOpen,
    onboardingCompleted,
    modalOpen,
    setModalOpen,
    openOnboarding,
    closeOnboarding,
    completeOnboarding,
    reload,
    saveProfile,
    saveGoal,
    saveSettings,
    saveSession,
    deleteSession,
    saveTask,
    deleteTask,
    saveReview,
    deleteReview,
    saveProject,
    deleteProject,
    saveProjectStep,
    deleteProjectStep,
    saveNote,
    deleteNote,
    saveFlashcard,
    deleteFlashcard,
    saveMindMap,
    deleteMindMap,
    reviewFlashcard,
    refreshBilling,
    createCheckout: handleCheckout,
    openPortal,
    cancelSubscription: handleCancelSubscription,
    syncBilling,
    signOut,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      <WorkspaceOnboarding
        open={onboardingOpen}
        userName={data?.profile?.full_name || initialUser.fullName || initialUser.email}
        data={data}
        isFirstRun={!onboardingCompleted}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />
      <EmbeddedCheckoutDialog
        open={Boolean(embeddedCheckout)}
        clientSecret={embeddedCheckout?.clientSecret ?? null}
        planLabel={embeddedCheckout?.planName ?? "Plano premium"}
        subtitle="Checkout seguro dentro do workspace do CodeTrail."
        processingMessage="Confirmando o pagamento com o Stripe e sincronizando o acesso premium no seu workspace."
        successTitle="Upgrade concluido"
        successMessage="Obrigado por assinar. Seu workspace premium esta sendo liberado agora."
        onClose={() => setEmbeddedCheckout(null)}
        onCheckoutComplete={confirmEmbeddedCheckout}
      />
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("WorkspaceProvider não encontrado.");
  }
  return context;
}

function randomId() {
  return crypto.randomUUID();
}

function genericMutationOperation(): WorkspaceOperationState {
  return {
    key: "workspace-mutation",
    title: "Salvando alteracoes",
    message: "Atualizando os dados do workspace para refletir sua ultima acao.",
  };
}

function saveOperation(subject: string): WorkspaceOperationState {
  return {
    key: "workspace-mutation",
    title: `Salvando ${subject}`,
    message: `Aplicando as alteracoes de ${subject} e recarregando os dados do workspace.`,
  };
}

function deleteOperation(subject: string): WorkspaceOperationState {
  return {
    key: "workspace-mutation",
    title: `Removendo ${subject}`,
    message: `Excluindo ${subject} e sincronizando o workspace logo em seguida.`,
  };
}

function reviewOperation(): WorkspaceOperationState {
  return {
    key: "workspace-mutation",
    title: "Atualizando revisao",
    message: "Registrando o resultado do flashcard e recalculando sua fila de estudo.",
  };
}

function workspaceReloadOperation(): WorkspaceOperationState {
  return {
    key: "workspace-reload",
    title: "Sincronizando workspace",
    message: "Buscando as informacoes mais recentes do seu ambiente.",
  };
}

function billingRefreshOperation(): WorkspaceOperationState {
  return {
    key: "billing-refresh",
    title: "Atualizando billing",
    message: "Carregando o snapshot mais recente da sua assinatura.",
  };
}

function billingSyncOperation(): WorkspaceOperationState {
  return {
    key: "billing-sync",
    title: "Sincronizando assinatura",
    message: "Validando o status atual diretamente com o provedor de pagamento.",
  };
}

function billingPortalOperation(): WorkspaceOperationState {
  return {
    key: "billing-portal",
    title: "Abrindo portal",
    message: "Preparando o gerenciamento seguro da sua assinatura.",
  };
}

function billingCancelOperation(): WorkspaceOperationState {
  return {
    key: "billing-cancel",
    title: "Cancelando no fim do ciclo",
    message: "Agendando o encerramento da assinatura mantendo o acesso ate o fim do periodo atual.",
  };
}

function billingCheckoutOperation(planCode: BillingPlanCode): WorkspaceOperationState {
  return {
    key: `billing-checkout:${planCode}`,
    title: `Abrindo checkout ${planCode.toUpperCase()}`,
    message: "Preparando o checkout interno com o plano selecionado.",
  };
}

function billingConfirmationOperation(): WorkspaceOperationState {
  return {
    key: "billing-confirmation",
    title: "Confirmando assinatura",
    message: "Aguardando a ativacao do plano e liberando o acesso premium.",
  };
}

function signOutOperation(): WorkspaceOperationState {
  return {
    key: "sign-out",
    title: "Saindo da conta",
    message: "Encerrando a sessao atual com seguranca.",
  };
}

function shouldAutoOpenOnboarding(pathname: string, data: WorkspaceData) {
  if (pathname !== "/workspace/dashboard" && pathname !== "/workspace") {
    return false;
  }

  if (data.profile?.onboarding_completed) {
    return false;
  }

  const hasMeaningfulActivity =
    data.dashboardSummary.totalSessions > 0 ||
    data.tasks.length > 0 ||
    data.reviews.length > 0 ||
    data.projects.length > 0 ||
    data.notes.length > 0 ||
    data.flashcards.length > 0 ||
    data.mindMaps.length > 0;

  return !hasMeaningfulActivity;
}

function nowIso() {
  return new Date().toISOString();
}

function defaultProfile(user: WorkspaceUser): ProfileRow {
  const now = nowIso();
  return {
    id: user.id,
    full_name: user.fullName || "Seu workspace",
    email: user.email,
    desired_area: "Tecnologia",
    current_level: "beginner",
    onboarding_completed: false,
    selected_track_id: null,
    created_at: now,
    updated_at: now,
  };
}

function defaultGoal(userId: string, desiredArea = "Tecnologia"): UserGoalRow {
  const now = nowIso();
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 90);
  return {
    id: userId,
    user_id: userId,
    primary_goal: "Construir consistência semanal",
    desired_area: desiredArea,
    focus_type: "solid_foundation",
    hours_per_day: 2,
    days_per_week: 5,
    deadline: deadline.toISOString(),
    current_level: "beginner",
    generated_plan:
      "Plano semanal ajustado para ganhar ritmo, constância e prática real.",
    created_at: now,
    updated_at: now,
  };
}
