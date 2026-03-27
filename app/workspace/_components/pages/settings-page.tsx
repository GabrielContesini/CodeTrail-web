"use client";

import { useRouter } from "next/navigation";
import { BillingCancelModal } from "@/app/workspace/_components/pages/billing-cancel-modal";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
  DataCard,
  Field,
  PageFrame,
  Pill,
  PrimaryButton,
  SecondaryButton,
  Select,
  TextArea,
  TextInput,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import { FeedbackMessage } from "@/app/components/ui/system-primitives";
import {
  billingIntervalLabel,
  buildDefaultSettings,
  formatCurrencyBrl,
  formatDateTime,
  labelForFocusType,
  labelForSkillLevel,
  planCode,
} from "@/utils/workspace/helpers";
import { ModalForm, toDateInput } from "@/app/workspace/_components/pages/shared";
import type { AppSettingsRow, BillingPlan, ProfileRow, UserGoalRow } from "@/utils/workspace/types";
import { useState } from "react";

export function SettingsPage() {
  const {
    data,
    user,
    error,
    onboardingCompleted,
    refreshing,
    operation,
    openOnboarding,
    saveProfile,
    saveGoal,
    saveSettings,
    openPortal,
    cancelSubscription,
    refreshBilling,
  } = useWorkspace();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const settings = data!.settings ?? buildDefaultSettings(user.id);
  const billing = data!.billing;
  const currentPlanCode = planCode(billing);
  const currentPlan = billing.current_plan;
  const cancelScheduled = billing.subscription?.cancel_at_period_end ?? false;
  const isRefreshingBilling = operation?.key === "billing-refresh";
  const isOpeningPortal = operation?.key === "billing-portal";
  const isCancellingPlan = operation?.key === "billing-cancel";
  const switchablePlans = billing.available_plans.filter(
    (plan) => plan.is_active && plan.is_public && plan.code !== "free" && plan.code !== currentPlanCode,
  );

  async function submitProfile(formData: FormData) {
    await saveProfile({
      full_name: formData.get("full_name")?.toString(),
      desired_area: formData.get("desired_area")?.toString(),
      current_level: formData.get("current_level")?.toString() as ProfileRow["current_level"],
      selected_track_id: nullable(formData.get("selected_track_id")),
    });
    setProfileOpen(false);
  }

  async function submitGoal(formData: FormData) {
    await saveGoal({
      primary_goal: formData.get("primary_goal")?.toString(),
      focus_type: formData.get("focus_type")?.toString() as UserGoalRow["focus_type"],
      hours_per_day: Number(formData.get("hours_per_day") || 2),
      days_per_week: Number(formData.get("days_per_week") || 5),
      deadline: new Date(formData.get("deadline")?.toString() || new Date()).toISOString(),
    });
    setGoalOpen(false);
  }

  async function submitSettings(formData: FormData) {
    await saveSettings({
      theme_preference:
        formData.get("theme_preference")?.toString() as AppSettingsRow["theme_preference"],
      notifications_enabled: Boolean(formData.get("notifications_enabled")),
      daily_reminder_hour: Number(formData.get("daily_reminder_hour") || 20),
    });
    setPrefsOpen(false);
  }

  async function handleCancelPlan() {
    if (!billing.subscription || currentPlanCode === "free") return;
    await cancelSubscription();
    setCancelModalOpen(false);
  }

  return (
    <>
      <PageFrame
        title="Configurações"
        subtitle="Conta, metas, notificações e manutenção do workspace web."
      >
        <div className="workspace-split">
          <div className="workspace-stack">
            {error ? (
              <FeedbackMessage
                tone="error"
                title="Ação de billing interrompida"
                message={error}
                className="sm:px-5"
              />
            ) : null}

            <DataCard title="Perfil" subtitle="Identidade do usuário atual.">
              <div className="workspace-stack">
                <div className="workspace-inline-banner">
                  <div>
                    <strong>{data!.profile?.full_name || user.fullName}</strong>
                    <p>{user.email}</p>
                  </div>
                  <Pill tone="primary">
                    {labelForSkillLevel(data!.profile?.current_level || "beginner")}
                  </Pill>
                </div>
                <div className="workspace-inline-banner">
                  <div>
                    <strong>{data!.goal?.primary_goal || "Meta não definida"}</strong>
                    <p>{labelForFocusType(data!.goal?.focus_type || "solid_foundation")}</p>
                  </div>
                  <Pill tone="warning">{`${data!.goal?.hours_per_day || 2}h / dia`}</Pill>
                </div>
                <div className="workspace-inline-actions">
                  <SecondaryButton onClick={() => setProfileOpen(true)}>
                    Editar conta
                  </SecondaryButton>
                  <SecondaryButton onClick={() => setGoalOpen(true)}>
                    Ajustar meta
                  </SecondaryButton>
                </div>
              </div>
            </DataCard>
            <DataCard title="Sincronização" subtitle="Estado desta versão web do sistema.">
              <div className="workspace-inline-banner">
                <div>
                  <strong>Supabase conectado</strong>
                  <p>As alterações da web escrevem nas mesmas tabelas usadas pelo Windows.</p>
                </div>
                <Pill tone="success">Online</Pill>
              </div>
            </DataCard>
            <DataCard
              title="Guia inicial"
              subtitle="Reabra o onboarding sempre que quiser revisar a estrutura do workspace."
            >
              <div className="workspace-inline-banner">
                <div>
                  <strong>{onboardingCompleted ? "Tour já concluído" : "Onboarding disponível"}</strong>
                  <p>
                    {onboardingCompleted
                      ? "Use o tour para revisar o fluxo, as áreas principais e os pontos de ativação do sistema."
                      : "Faça o tour novamente para revisar o fluxo inicial e os primeiros passos recomendados."}
                  </p>
                </div>
                <Pill tone="primary">Ajuda contextual</Pill>
              </div>
              <div className="workspace-inline-actions">
                <PrimaryButton onClick={openOnboarding} disabled={refreshing}>
                  Rever onboarding
                </PrimaryButton>
              </div>
            </DataCard>
          </div>

          <div className="workspace-stack">
            <DataCard title="Preferências" subtitle="Tema, lembretes e rotina diária.">
              <div className="workspace-inline-banner">
                <div>
                  <strong>Tema {settings.theme_preference}</strong>
                  <p>Preferência visual do workspace</p>
                </div>
                <Pill tone={settings.notifications_enabled ? "primary" : "neutral"}>
                  {settings.notifications_enabled ? "Alertas ativos" : "Alertas pausados"}
                </Pill>
              </div>
              <div className="workspace-inline-banner">
                <div>
                  <strong>Lembrete diário</strong>
                  <p>Horário-base para revisão da rotina</p>
                </div>
                <Pill tone="warning">
                  {`${String(settings.daily_reminder_hour ?? 20).padStart(2, "0")}:00`}
                </Pill>
              </div>
              <div className="workspace-inline-actions">
                <PrimaryButton onClick={() => setPrefsOpen(true)} disabled={refreshing}>
                  Editar preferências
                </PrimaryButton>
                <SecondaryButton onClick={() => router.push("/workspace/settings/billing")} disabled={refreshing}>
                  Plano e cobrança
                </SecondaryButton>
              </div>
            </DataCard>
            <DataCard
              title="Plano e cobrança"
              subtitle="Troca de plano, portal do Stripe e cancelamento direto nas opções da conta."
            >
              <div className="workspace-stack">
                <div className="workspace-inline-banner">
                  <div>
                    <strong>
                      {currentPlan
                        ? `${currentPlan.name} • ${formatCurrencyBrl(currentPlan.price_cents)}${billingIntervalLabel(currentPlan.interval)}`
                        : "Plano Free"}
                    </strong>
                    <p>
                      {billing.subscription?.cancel_at_period_end
                        ? `Cancelamento agendado para ${formatDateTime(billing.subscription.current_period_end)}`
                        : billing.subscription?.current_period_end
                          ? `Ciclo atual até ${formatDateTime(billing.subscription.current_period_end)}`
                          : billing.subscription?.is_trialing
                            ? "Trial em andamento"
                            : "Sem assinatura premium ativa no momento."}
                    </p>
                  </div>
                  <Pill tone={currentPlanCode === "free" ? "neutral" : "primary"}>
                    {currentPlanCode.toUpperCase()}
                  </Pill>
                </div>

                <div className="workspace-inline-actions">
                  <SecondaryButton onClick={() => void refreshBilling()} disabled={refreshing}>
                    {isRefreshingBilling ? "Atualizando..." : "Atualizar billing"}
                  </SecondaryButton>
                  <SecondaryButton onClick={() => router.push("/workspace/settings/billing")} disabled={refreshing}>
                    Área avançada
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={() => void openPortal()}
                    disabled={!billing.subscription || currentPlanCode === "free" || refreshing}
                  >
                    {isOpeningPortal ? "Abrindo..." : "Gerenciar assinatura"}
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={() => setCancelModalOpen(true)}
                    disabled={!billing.subscription || currentPlanCode === "free" || refreshing || cancelScheduled}
                  >
                    {cancelScheduled
                      ? "Cancelamento agendado"
                      : isCancellingPlan
                        ? "Cancelando..."
                        : "Cancelar plano"}
                  </SecondaryButton>
                </div>

                {switchablePlans.length ? (
                  <div className="workspace-stack">
                    {switchablePlans.map((plan) => (
                      <PlanSwitchRow
                        key={plan.id}
                        plan={plan}
                        currentPlanCode={currentPlanCode}
                        onChoose={() => router.push(`/workspace/settings/billing?checkout=${plan.code}`)}
                        disabled={refreshing}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="workspace-inline-banner">
                    <div>
                      <strong>Nenhum outro plano disponível agora</strong>
                      <p>Assim que novos planos públicos forem liberados, eles aparecem aqui.</p>
                    </div>
                    <Pill tone="neutral">Catálogo estável</Pill>
                  </div>
                )}
              </div>
            </DataCard>
          </div>
        </div>
      </PageFrame>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} onSubmit={submitProfile} />
      <GoalModal open={goalOpen} onClose={() => setGoalOpen(false)} onSubmit={submitGoal} />
      <PreferencesModal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        onSubmit={submitSettings}
        settings={settings}
      />
      <BillingCancelModal
        open={cancelModalOpen}
        planName={currentPlan?.name ?? "Plano premium"}
        periodEnd={billing.subscription?.current_period_end}
        submitting={isCancellingPlan}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelPlan}
      />
    </>
  );
}

function PlanSwitchRow({
  plan,
  currentPlanCode,
  onChoose,
  disabled,
}: {
  plan: BillingPlan;
  currentPlanCode: string;
  onChoose: () => void;
  disabled?: boolean;
}) {
  const actionLabel =
    currentPlanCode === "free" ? `Assinar ${plan.name}` : `Trocar para ${plan.name}`;

  return (
    <div className="workspace-row-card">
      <div className="flex min-w-0 flex-col gap-1.5">
        <strong>{plan.name}</strong>
        <p>{plan.description}</p>
      </div>
      <div className="workspace-inline-actions">
        <Pill tone="primary">
          {formatCurrencyBrl(plan.price_cents)}
          {billingIntervalLabel(plan.interval)}
        </Pill>
        <PrimaryButton onClick={onChoose} disabled={disabled}>{actionLabel}</PrimaryButton>
      </div>
    </div>
  );
}

function ProfileModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const { data, user } = useWorkspace();
  return (
    <WorkspaceModal
      title="Editar conta"
      subtitle="Nome, área, nível e trilha ativa."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <Field label="Nome">
          <TextInput name="full_name" defaultValue={data?.profile?.full_name || user.fullName} />
        </Field>
        <Field label="Área desejada">
          <TextInput name="desired_area" defaultValue={data?.profile?.desired_area || "Tecnologia"} />
        </Field>
        <Field label="Nível">
          <Select name="current_level" defaultValue={data?.profile?.current_level || "beginner"}>
            <option value="beginner">Iniciante</option>
            <option value="junior">Júnior</option>
            <option value="mid_level">Pleno</option>
            <option value="senior">Sênior</option>
          </Select>
        </Field>
        <Field label="Trilha ativa">
          <Select name="selected_track_id" defaultValue={data?.profile?.selected_track_id || ""}>
            <option value="">Sem trilha</option>
            {data?.trackBlueprints.map((item) => (
              <option key={item.track.id} value={item.track.id}>
                {item.track.name}
              </option>
            ))}
          </Select>
        </Field>
      </ModalForm>
    </WorkspaceModal>
  );
}

function GoalModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const { data } = useWorkspace();
  return (
    <WorkspaceModal
      title="Ajustar meta"
      subtitle="Objetivo principal e ritmo semanal do plano."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <Field label="Objetivo principal">
          <TextArea name="primary_goal" rows={4} defaultValue={data?.goal?.primary_goal || ""} />
        </Field>
        <Field label="Foco">
          <Select name="focus_type" defaultValue={data?.goal?.focus_type || "solid_foundation"}>
            <option value="job">Conseguir vaga</option>
            <option value="promotion">Promoção</option>
            <option value="freelance">Freelas</option>
            <option value="solid_foundation">Base sólida</option>
            <option value="career_transition">Transição de carreira</option>
          </Select>
        </Field>
        <Field label="Horas por dia">
          <TextInput name="hours_per_day" type="number" min={1} max={12} defaultValue={data?.goal?.hours_per_day || 2} />
        </Field>
        <Field label="Dias por semana">
          <TextInput name="days_per_week" type="number" min={1} max={7} defaultValue={data?.goal?.days_per_week || 5} />
        </Field>
        <Field label="Prazo">
          <TextInput name="deadline" type="date" defaultValue={toDateInput(data?.goal?.deadline)} />
        </Field>
      </ModalForm>
    </WorkspaceModal>
  );
}

function PreferencesModal({
  open,
  onClose,
  onSubmit,
  settings,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  settings: ReturnType<typeof buildDefaultSettings>;
}) {
  return (
    <WorkspaceModal
      title="Preferências"
      subtitle="Tema, alertas e lembrete diário."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <Field label="Tema">
          <Select name="theme_preference" defaultValue={settings.theme_preference}>
            <option value="system">Sistema</option>
            <option value="dark">Escuro</option>
            <option value="light">Claro</option>
          </Select>
        </Field>
        <Field label="Lembrete diário">
          <TextInput
            name="daily_reminder_hour"
            type="number"
            min={0}
            max={23}
            defaultValue={settings.daily_reminder_hour || 20}
          />
        </Field>
        <label className="workspace-checkbox">
          <input
            name="notifications_enabled"
            type="checkbox"
            defaultChecked={settings.notifications_enabled}
          />
          <span>Notificações habilitadas</span>
        </label>
      </ModalForm>
    </WorkspaceModal>
  );
}

function nullable(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : null;
}
