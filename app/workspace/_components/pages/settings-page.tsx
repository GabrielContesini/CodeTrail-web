"use client";

import {
    fadeUpVariants,
    useMotionPreferences,
} from "@/app/components/ui/motion-system";
import { BillingCancelModal } from "@/app/workspace/_components/pages/billing-cancel-modal";
import {
    ModalForm,
    toDateInput,
} from "@/app/workspace/_components/pages/shared";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
    Field,
    Select,
    TextArea,
    TextInput,
    WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import {
    billingIntervalLabel,
    buildDefaultSettings,
    formatCurrencyBrl,
    formatDateTime,
    labelForSkillLevel,
    planCode,
} from "@/utils/workspace/helpers";
import type {
    BillingPlan,
    ProfileRow,
    UserGoalRow,
} from "@/utils/workspace/types";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
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
  const { reduced } = useMotionPreferences();
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
    (plan) =>
      plan.is_active &&
      plan.is_public &&
      plan.code !== "free" &&
      plan.code !== currentPlanCode,
  );
  const badges = [
    `${labelForSkillLevel(data!.profile?.current_level || "beginner")} operacional`,
    `${data!.goal?.hours_per_day || 2}h / dia`,
    onboardingCompleted ? "Tour concluído" : "Tour disponível",
  ];

  async function submitProfile(formData: FormData) {
    await saveProfile({
      full_name: formData.get("full_name")?.toString(),
      avatar_url: nullable(formData.get("avatar_url")),
      desired_area: formData.get("desired_area")?.toString(),
      current_level: formData
        .get("current_level")
        ?.toString() as ProfileRow["current_level"],
      selected_track_id: nullable(formData.get("selected_track_id")),
    });
    setProfileOpen(false);
  }

  async function submitGoal(formData: FormData) {
    await saveGoal({
      primary_goal: formData.get("primary_goal")?.toString(),
      focus_type: formData
        .get("focus_type")
        ?.toString() as UserGoalRow["focus_type"],
      hours_per_day: Number(formData.get("hours_per_day") || 2),
      days_per_week: Number(formData.get("days_per_week") || 5),
      deadline: new Date(
        formData.get("deadline")?.toString() || new Date(),
      ).toISOString(),
    });
    setGoalOpen(false);
  }

  async function submitSettings(formData: FormData) {
    await saveSettings({
      theme_preference: "dark", // Forçando dark mode permanentemente
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
      <motion.main
        initial="hidden"
        animate="visible"
        variants={fadeUpVariants(reduced, 18)}
        className="w-full max-w-7xl mx-auto space-y-8"
      >
        {/* Page Header */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-8 bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                Configuração do Sistema
              </span>
            </div>
            <h1 className="mb-2 text-5xl font-black tracking-tighter text-on-surface">
              Configurações
            </h1>
            <p className="max-w-md text-on-surface-variant text-sm">
              Gerencie seu perfil, metas, integrações e plano de assinatura.
            </p>
          </div>
          <div className="flex gap-3">
            {error ? (
              <div className="rounded-lg border border-error/50 bg-error/10 px-4 py-2 text-sm text-error">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        {/* Bento Grid Settings */}
        <div className="grid grid-cols-12 gap-6">
          {/* Profile Management (Large Focus) */}
          <section className="col-span-12 rounded-xl border border-white/5 bg-surface-container p-8 lg:col-span-8">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span
                  className="material-symbols-outlined text-3xl text-primary"
                  style={{
                    fontVariationSettings:
                      "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                  }}
                >
                  badge
                </span>
                <h3 className="text-xl font-bold">Gestão de Perfil</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setGoalOpen(true)}
                  className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs font-bold text-on-surface-variant transition-colors hover:text-white"
                >
                  META
                </button>
                <button
                  onClick={() => setProfileOpen(true)}
                  className="rounded bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                >
                  EDITAR
                </button>
              </div>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  {data!.profile?.avatar_url ? (
                    <img 
                      src={data!.profile.avatar_url} 
                      alt="Avatar" 
                      className="w-32 h-32 rounded-xl object-cover border-2 border-primary/20 shadow-[0_0_24px_rgba(129,236,255,0.16)]"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-xl border-2 border-primary/20 bg-surface-container-highest p-1 text-5xl font-black text-primary shadow-[0_0_24px_rgba(129,236,255,0.16)]">
                      {initials(
                        data!.profile?.full_name || user.fullName || user.email,
                      )}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-on-surface">
                    {data!.profile?.full_name ||
                      user.fullName ||
                      "Operador_Neon"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant">
                    {labelForSkillLevel(
                      data!.profile?.current_level || "beginner",
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-6 md:col-span-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Área de Foco
                  </label>
                  <div className="w-full border-b border-outline-variant/30 bg-transparent py-2 text-on-surface">
                    {data!.profile?.desired_area || "Tecnologia"}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Objetivo Principal
                  </label>
                  <div className="w-full border-b border-outline-variant/30 bg-transparent py-2 text-sm text-on-surface">
                    {data!.goal?.primary_goal ||
                      "Defina uma meta principal para mapear o seu workspace."}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-on-surface-variant"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* System Integration (Asymmetric Side) */}
          <section className="col-span-12 flex flex-col rounded-xl border border-white/5 bg-surface-container p-8 lg:col-span-4">
            <div className="mb-8 flex items-center gap-4">
              <span
                className="material-symbols-outlined text-3xl text-primary"
                style={{
                  fontVariationSettings:
                    "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
              >
                dynamic_feed
              </span>
              <h3 className="text-xl font-bold">Integrações</h3>
            </div>
            <div className="flex flex-1 flex-col space-y-4">
              <IntegrationTile
                name="Sincronização"
                status="Online"
                helper="Base de dados ativa"
                tone="success"
                icon="database"
              />
              <IntegrationTile
                name="Plano"
                status={currentPlanCode === "free" ? "Gratuito" : "Premium"}
                helper={
                  currentPlanCode === "free"
                    ? "Acesso limitado"
                    : "Acesso total"
                }
                tone="primary"
                icon="payments"
              />
              <IntegrationTile
                name="Onboarding"
                status={onboardingCompleted ? "Concluído" : "Pendente"}
                helper="Tour inicial"
                tone="warning"
                icon="explore"
              />
            </div>
          </section>

          {/* Theme Customization */}
          <section className="col-span-12 rounded-xl border border-white/5 bg-surface-container p-8 md:col-span-7">
            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span
                  className="material-symbols-outlined text-3xl text-primary"
                  style={{
                    fontVariationSettings:
                      "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                  }}
                >
                  tune
                </span>
                <h3 className="text-xl font-bold">Preferências do Sistema</h3>
              </div>
              <button
                onClick={() => setPrefsOpen(true)}
                disabled={refreshing}
                className="rounded border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
              >
                EDITAR
              </button>
            </div>
            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Lembrete Diário
                  </label>
                  <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-surface-container-high p-3">
                    <span className="font-mono text-sm">
                      {String(settings.daily_reminder_hour ?? 20).padStart(
                        2,
                        "0",
                      )}
                      :00
                    </span>
                    <span
                      className="material-symbols-outlined text-lg text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Notificações Push
                  </label>
                  <div className="flex gap-2">
                    <div
                      className={`flex flex-1 items-center justify-center rounded-lg border py-2 text-xs font-bold ${settings.notifications_enabled ? "bg-primary/10 border-primary/40 text-primary" : "bg-surface-container-highest border-white/5 text-on-surface-variant"}`}
                    >
                      {settings.notifications_enabled ? "ATIVAS" : "PAUSADAS"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Billing & Plan */}
          <section className="col-span-12 rounded-xl border border-white/5 bg-surface-container p-8 md:col-span-5">
            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span
                  className="material-symbols-outlined text-3xl text-primary"
                  style={{
                    fontVariationSettings:
                      "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                  }}
                >
                  credit_score
                </span>
                <h3 className="text-xl font-bold">Assinatura</h3>
              </div>
              <button
                onClick={() => void refreshBilling()}
                disabled={refreshing}
                className="text-xs font-bold text-on-surface-variant hover:text-primary uppercase"
              >
                {isRefreshingBilling ? "SINCRONIZANDO..." : "ATUALIZAR"}
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                <div className="flex items-center gap-4">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{
                      fontVariationSettings:
                        "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    }}
                  >
                    star
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {currentPlan ? currentPlan.name : "Plano Gratuito"}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {currentPlan
                        ? `${formatCurrencyBrl(currentPlan.price_cents)}${billingIntervalLabel(currentPlan.interval)}`
                        : "Sem custo"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                    ATIVA
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <button
                  onClick={() => router.push("/workspace/settings/billing")}
                  disabled={refreshing}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-bold transition-all hover:bg-white/10"
                >
                  PORTAL DE FATURAMENTO
                </button>
                <button
                  onClick={() => void openPortal()}
                  disabled={
                    !billing.subscription ||
                    currentPlanCode === "free" ||
                    refreshing
                  }
                  className="w-full rounded-lg border border-primary/20 bg-primary/10 py-2.5 text-xs font-bold text-primary transition-all hover:bg-primary/20 disabled:opacity-50"
                >
                  {isOpeningPortal ? "CARREGANDO..." : "GERENCIAR ASSINATURA"}
                </button>
              </div>
            </div>
          </section>

          {/* Available Plans */}
          {switchablePlans.length > 0 && (
            <section className="col-span-12 rounded-xl border border-white/5 bg-surface-container p-8">
              <div className="mb-8 flex items-center gap-4">
                <span
                  className="material-symbols-outlined text-3xl text-tertiary"
                  style={{
                    fontVariationSettings:
                      "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                  }}
                >
                  upgrade
                </span>
                <h3 className="text-xl font-bold">Planos de Atualização</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {switchablePlans.map((plan) => (
                  <PlanSwitchCard
                    key={plan.id}
                    plan={plan}
                    currentPlanCode={currentPlanCode}
                    onChoose={() =>
                      router.push(
                        `/workspace/settings/billing?checkout=${plan.code}`,
                      )
                    }
                    disabled={refreshing}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Danger Zone */}
          <section className="col-span-12 flex flex-col justify-between gap-6 rounded-xl border border-error/20 bg-error/5 p-8 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/20 text-error">
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings:
                      "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                  }}
                >
                  dangerous
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-error">
                  Operações Críticas
                </h3>
                <p className="text-sm text-on-surface-variant">
                  {cancelScheduled
                    ? `O cancelamento está agendado para ${formatDateTime(billing.subscription?.current_period_end)}`
                    : "Cancela a assinatura e revoga acesso ao conteúdo premium no fim do ciclo atual."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setCancelModalOpen(true)}
              disabled={
                !billing.subscription ||
                currentPlanCode === "free" ||
                refreshing ||
                cancelScheduled
              }
              className="rounded-full border border-error/40 px-8 py-3 text-sm font-bold text-error transition-all hover:bg-error/10 disabled:opacity-50"
            >
              {cancelScheduled
                ? "AGENDADO"
                : isCancellingPlan
                  ? "PROCESSANDO..."
                  : "CANCELAR PLANO"}
            </button>
          </section>
        </div>

        <footer className="mt-16 flex items-center justify-between border-t border-white/5 pt-8 opacity-40">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tracking-tighter">
              NEON_LAB // VERSÃO_4.0.2_BETA
            </span>
          </div>
          <div className="font-mono text-[10px]">OPERADOR(A): {user.email}</div>
        </footer>
      </motion.main>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSubmit={submitProfile}
      />
      <GoalModal
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        onSubmit={submitGoal}
      />
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

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-outline-variant/20 bg-surface-container px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold text-on-surface">{value}</p>
    </div>
  );
}

function InfoPanel({
  title,
  subtitle,
  helper,
}: {
  title: string;
  subtitle: string;
  helper: string;
}) {
  return (
    <div className="rounded-[22px] border border-outline-variant/20 bg-surface-container p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <h3 className="mt-3 text-lg font-bold text-on-surface">{subtitle}</h3>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
        {helper}
      </p>
    </div>
  );
}

function PreferenceRow({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[22px] border border-outline-variant/20 bg-surface-container px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
        {label}
      </p>
      <strong className="mt-2 block text-lg font-bold text-on-surface">
        {value}
      </strong>
      <p className="mt-2 text-sm text-on-surface-variant">{helper}</p>
    </div>
  );
}

function IntegrationTile({
  name,
  status,
  helper,
  tone,
  icon,
}: {
  name: string;
  status: string;
  helper: string;
  tone: "success" | "primary" | "warning";
  icon?: string;
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-primary";

  return (
    <div className="group flex items-center justify-between rounded-lg border border-white/5 bg-surface-container-high p-4 transition-all hover:border-primary/20">
      <div className="flex items-center gap-3 w-3/4">
        <span
          className="material-symbols-outlined text-on-surface-variant"
          style={{
            fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
          }}
        >
          {icon || "hub"}
        </span>
        <div className="min-w-0 pr-2">
          <p className="text-sm font-bold truncate text-white">{name}</p>
          <p className={`text-[10px] truncate ${toneClass}`}>
            {status}: {helper}
          </p>
        </div>
      </div>
      <div className="text-xs font-bold text-on-surface-variant transition-colors group-hover:text-primary">
        SINCR
      </div>
    </div>
  );
}

function PlanSwitchCard({
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
  const actionLabel = currentPlanCode === "free" ? `ASSINAR` : `MUDAR PLANO`;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-white/5 bg-surface-container-high p-6 transition-all hover:border-primary/20">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <strong className="text-lg text-white">{plan.name}</strong>
          <span className="rounded bg-primary/10 px-2 py-1 font-mono text-[10px] font-bold text-primary">
            {formatCurrencyBrl(plan.price_cents)}
            {billingIntervalLabel(plan.interval)}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-on-surface-variant">
          {plan.description}
        </p>
      </div>
      <button
        onClick={onChoose}
        disabled={disabled}
        className="w-full rounded-lg border border-primary/40 bg-primary/10 py-2.5 text-xs font-bold text-primary transition-all hover:bg-primary/20"
      >
        {actionLabel}
      </button>
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(data?.profile?.avatar_url || null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <WorkspaceModal
      title="Editar conta"
      subtitle="Nome, área, nível, foto e trilha ativa."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <div className="flex flex-col items-center mb-6">
          <div className="relative group mb-3">
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Avatar" 
                className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/20 bg-surface-container-highest text-3xl font-black text-primary">
                {initials(data!.profile?.full_name || user.fullName || user.email)}
              </div>
            )}
            <label className="absolute bottom-0 right-0 p-2 rounded-full bg-primary cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange}
                className="hidden"
                name="avatar_file"
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-on-primary-fixed">
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                <line x1="21" x2="9" y1="4" y2="20"/>
                <line x1="9" x2="15" y1="20" y2="4"/>
              </svg>
            </label>
          </div>
          <input type="hidden" name="avatar_url" value={avatarPreview || ""} />
          <span className="text-xs text-on-surface-variant">Clique no ícone para alterar a foto</span>
        </div>
        <Field label="Nome">
          <TextInput
            name="full_name"
            defaultValue={data?.profile?.full_name || user.fullName}
          />
        </Field>
        <Field label="Área desejada">
          <TextInput
            name="desired_area"
            defaultValue={data?.profile?.desired_area || "Tecnologia"}
          />
        </Field>
        <Field label="Nível">
          <Select
            name="current_level"
            defaultValue={data?.profile?.current_level || "beginner"}
          >
            <option value="beginner">Iniciante</option>
            <option value="junior">Júnior</option>
            <option value="mid_level">Pleno</option>
            <option value="senior">Sênior</option>
          </Select>
        </Field>
        <Field label="Trilha ativa">
          <Select
            name="selected_track_id"
            defaultValue={data?.profile?.selected_track_id || ""}
          >
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
          <TextArea
            name="primary_goal"
            rows={4}
            defaultValue={data?.goal?.primary_goal || ""}
          />
        </Field>
        <Field label="Foco">
          <Select
            name="focus_type"
            defaultValue={data?.goal?.focus_type || "solid_foundation"}
          >
            <option value="job">Conseguir vaga</option>
            <option value="promotion">Promoção</option>
            <option value="freelance">Freelas</option>
            <option value="solid_foundation">Base sólida</option>
            <option value="career_transition">Transição de carreira</option>
          </Select>
        </Field>
        <Field label="Horas por dia">
          <TextInput
            name="hours_per_day"
            type="number"
            min={1}
            max={12}
            defaultValue={data?.goal?.hours_per_day || 2}
          />
        </Field>
        <Field label="Dias por semana">
          <TextInput
            name="days_per_week"
            type="number"
            min={1}
            max={7}
            defaultValue={data?.goal?.days_per_week || 5}
          />
        </Field>
        <Field label="Prazo">
          <TextInput
            name="deadline"
            type="date"
            defaultValue={toDateInput(data?.goal?.deadline)}
          />
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
      subtitle="Alertas e lembrete diário."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        {/* Input escondido para não quebrar a lógica de salvamento original */}
        <input type="hidden" name="theme_preference" value="dark" />

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
          <span>Habilitar notificações push</span>
        </label>
      </ModalForm>
    </WorkspaceModal>
  );
}

function nullable(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : null;
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "CT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
