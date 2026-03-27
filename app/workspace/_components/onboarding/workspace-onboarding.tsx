"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  Compass,
  Layers3,
  LifeBuoy,
  Lightbulb,
  Map,
  Rocket,
  Settings2,
  Sparkles,
  Target,
  TimerReset,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FeedbackMessage, Surface } from "@/app/components/ui/system-primitives";
import { useStableReducedMotion } from "@/app/components/ui/motion-system";
import { GhostButton, Pill, PrimaryButton, SecondaryButton } from "@/app/workspace/_components/workspace-ui";
import { billingIntervalLabel, planCode } from "@/utils/workspace/helpers";
import type { WorkspaceData } from "@/utils/workspace/types";

interface WorkspaceOnboardingProps {
  open: boolean;
  isFirstRun: boolean;
  userName: string;
  data: WorkspaceData | null;
  onClose: () => void;
  onComplete: () => Promise<void>;
}

const stepLabels = ["Boas-vindas", "Áreas", "Clareza", "Ativação", "Pronto"] as const;

export function WorkspaceOnboarding({
  open,
  isFirstRun,
  userName,
  data,
  onClose,
  onComplete,
}: WorkspaceOnboardingProps) {
  const router = useRouter();
  const reduceMotion = useStableReducedMotion();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const onboardingMeta = useMemo(() => buildOnboardingMeta(data, userName), [data, userName]);
  const currentStep = onboardingMeta.steps[stepIndex];
  const isLastStep = stepIndex === onboardingMeta.steps.length - 1;
  const progressPercent = ((stepIndex + 1) / onboardingMeta.steps.length) * 100;

  useEffect(() => {
    if (!open) {
      return;
    }

    setStepIndex(0);
    dialogRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (isLastStep) {
          void handlePrimaryAction();
          return;
        }
        setStepIndex((current) => Math.min(current + 1, onboardingMeta.steps.length - 1));
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setStepIndex((current) => Math.max(current - 1, 0));
      }

      if (event.key === "Escape") {
        event.preventDefault();
        void handleSkip();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLastStep, onboardingMeta.steps.length, open]);

  async function handleSkip() {
    if (submitting) {
      return;
    }

    if (isFirstRun) {
      setSubmitting(true);
      try {
        await onComplete();
      } finally {
        setSubmitting(false);
      }
      return;
    }

    onClose();
  }

  async function handlePrimaryAction() {
    if (!isLastStep) {
      setStepIndex((current) => Math.min(current + 1, onboardingMeta.steps.length - 1));
      return;
    }

    setSubmitting(true);
    try {
      if (isFirstRun) {
        await onComplete();
      } else {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleActivationRoute(href: string) {
    setSubmitting(true);
    try {
      if (isFirstRun) {
        await onComplete();
      } else {
        onClose();
      }
      router.push(href);
    } finally {
      setSubmitting(false);
    }
  }

  const overlayTransition = reduceMotion
    ? { duration: 0.16 }
    : { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const };

  const contentTransition = reduceMotion
    ? { duration: 0.12 }
    : { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[95] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayTransition}
        >
          <div className="absolute inset-0 bg-background/88 backdrop-blur-xl" />
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <motion.div
              className="absolute -left-20 top-12 h-72 w-72 rounded-full bg-primary/12 blur-[110px]"
              animate={reduceMotion ? undefined : { x: [0, 42, 0], y: [0, -18, 0] }}
              transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-[-4rem] top-[20%] h-80 w-80 rounded-full bg-accent/10 blur-[130px]"
              animate={reduceMotion ? undefined : { x: [0, -36, 0], y: [0, 30, 0] }}
              transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px] opacity-60 [mask-image:radial-gradient(circle_at_center,black_30%,transparent_88%)]" />
          </div>

          <div className="relative flex min-h-screen items-stretch justify-center p-0 md:p-6">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="workspace-onboarding-title"
              data-testid="workspace-onboarding"
              tabIndex={-1}
              className="relative z-10 flex min-h-screen w-full max-w-[1260px] flex-col overflow-hidden border border-border/70 bg-[rgba(6,11,17,0.92)] shadow-[0_32px_90px_rgba(0,0,0,0.46)] md:min-h-0 md:rounded-[32px]"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.99 }}
              transition={overlayTransition}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/55 to-transparent" />

              <div className="grid min-h-screen flex-1 lg:min-h-[760px] lg:grid-cols-[0.94fr_1.06fr]">
                <section className="relative flex flex-col border-b border-border/60 px-5 py-5 sm:px-6 sm:py-6 lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusPill />
                        <Pill tone="primary">
                          {stepIndex + 1}/{onboardingMeta.steps.length}
                        </Pill>
                      </div>
                      <div className="flex items-center gap-2">
                        {stepLabels.map((label, index) => (
                          <button
                            key={label}
                            type="button"
                            aria-label={`Ir para ${label}`}
                            onClick={() => setStepIndex(index)}
                            className="group flex items-center gap-2 rounded-full border border-transparent px-1 py-1 text-left"
                          >
                            <span
                              className={[
                                "h-1.5 rounded-full transition-[width,background-color,opacity] duration-300",
                                index === stepIndex
                                  ? "w-10 bg-primary"
                                  : index < stepIndex
                                    ? "w-6 bg-accent/70"
                                    : "w-6 bg-white/10 group-hover:bg-white/20",
                              ].join(" ")}
                            />
                            <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary xl:inline">
                              {label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <GhostButton
                      onClick={() => void handleSkip()}
                      disabled={submitting}
                      className="rounded-full px-4"
                    >
                      <X size={16} />
                      {isFirstRun ? "Pular onboarding" : "Fechar tour"}
                    </GhostButton>
                  </div>

                  <div className="mt-6 flex-1">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep.id}
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.992 }}
                        transition={contentTransition}
                        className="flex h-full flex-col gap-8"
                      >
                        <div className="flex flex-col gap-5">
                          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                            {currentStep.eyebrow}
                          </span>
                          <div className="flex flex-col gap-4">
                            <h1
                              id="workspace-onboarding-title"
                              className="m-0 max-w-2xl text-4xl font-display font-medium leading-[1.02] tracking-tight text-white sm:text-[2.8rem] lg:text-[3.3rem]"
                            >
                              {currentStep.title}
                            </h1>
                            <p className="m-0 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
                              {currentStep.description}
                            </p>
                          </div>
                        </div>

                        {currentStep.summary ? (
                          <FeedbackMessage
                            tone="neutral"
                            title={currentStep.summary.title}
                            message={currentStep.summary.message}
                          />
                        ) : null}

                        <div className="grid gap-3 sm:grid-cols-3">
                          {currentStep.bullets.map((bullet) => (
                            <Surface
                              key={bullet.title}
                              tone="soft"
                              className="flex min-h-[128px] flex-col gap-3 rounded-[28px] px-4 py-4"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/18 bg-primary/10 text-primary">
                                <bullet.icon size={18} />
                              </div>
                              <div className="flex flex-col gap-1">
                                <strong className="font-display text-base text-white">{bullet.title}</strong>
                                <p className="m-0 text-sm leading-relaxed text-text-secondary">{bullet.copy}</p>
                              </div>
                            </Surface>
                          ))}
                        </div>

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-5">
                          <div className="flex items-center gap-3 text-sm text-text-secondary">
                            <span className="inline-flex items-center gap-2">
                              <Compass size={15} className="text-primary" />
                              {currentStep.footnote}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <SecondaryButton
                              onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                              disabled={stepIndex === 0 || submitting}
                            >
                              <ArrowLeft size={16} />
                              Voltar
                            </SecondaryButton>
                            <PrimaryButton onClick={() => void handlePrimaryAction()} disabled={submitting}>
                              {isLastStep ? "Entrar no workspace" : "Avançar"}
                              <ArrowRight size={16} />
                            </PrimaryButton>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </section>

                <section className="relative flex flex-col overflow-hidden px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                  <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:hidden" />

                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
                        Visão do sistema
                      </span>
                      <strong className="font-display text-lg text-white">
                        {currentStep.previewTitle}
                      </strong>
                    </div>
                    <Pill tone="neutral">{onboardingMeta.planLabel}</Pill>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${currentStep.id}-preview`}
                      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 22, scale: 0.986 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.992 }}
                      transition={contentTransition}
                      className="flex flex-1 flex-col gap-4"
                    >
                      {renderPreview({
                        stepId: currentStep.id,
                        meta: onboardingMeta,
                        onGoToRecommended: (href) => void handleActivationRoute(href),
                      })}
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <PreviewStat label="Trilhas" value={`${onboardingMeta.trackCount}`} />
                    <PreviewStat label="Sessões" value={`${onboardingMeta.sessionCount}`} />
                    <PreviewStat label="Plano" value={onboardingMeta.planShortLabel} />
                  </div>

                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full border border-border/60 bg-white/[0.04]">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary via-[#7de7ff] to-accent"
                      animate={{ width: `${progressPercent}%` }}
                      transition={reduceMotion ? { duration: 0.12 } : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function renderPreview({
  stepId,
  meta,
  onGoToRecommended,
}: {
  stepId: string;
  meta: OnboardingMeta;
  onGoToRecommended: (href: string) => void;
}) {
  switch (stepId) {
    case "welcome":
      return <WelcomePreview meta={meta} />;
    case "areas":
      return <AreasPreview />;
    case "retention":
      return <RetentionPreview />;
    case "activation":
      return <ActivationPreview meta={meta} onGoToRecommended={onGoToRecommended} />;
    case "finish":
    default:
      return <FinishPreview meta={meta} onGoToRecommended={onGoToRecommended} />;
  }
}

function WelcomePreview({ meta }: { meta: OnboardingMeta }) {
  return (
    <>
      <Surface tone="glass" className="relative overflow-hidden rounded-[30px] border border-primary/18 px-5 py-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Cockpit inicial</span>
              <strong className="font-display text-2xl text-white">
                Um sistema para reduzir ruído e acelerar clareza.
              </strong>
              <p className="m-0 max-w-xl text-sm leading-relaxed text-text-secondary">
                O CodeTrail centraliza organização, execução e retenção com a mesma conta que sustenta billing, dados e progresso.
              </p>
            </div>
            <Pill tone="success">{meta.planLabel}</Pill>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HighlightCard
              title="Mesmo ecossistema"
              copy="Dashboard, sessões, billing e histórico vivem no mesmo fluxo."
              icon={Sparkles}
            />
            <HighlightCard
              title="Direção prática"
              copy="Cada área aponta o próximo passo, não só mais uma lista."
              icon={Rocket}
            />
            <HighlightCard
              title="Base premium"
              copy="A interface foi desenhada para uso frequente, não para chamar atenção à toa."
              icon={Target}
            />
          </div>
        </div>
      </Surface>

      <div className="grid gap-3 sm:grid-cols-3">
        <OrbitChip label="Conta" value="Unificada" />
        <OrbitChip label="Rotina" value="Organizada" />
        <OrbitChip label="Entrada" value="Primeiro ciclo" />
      </div>
    </>
  );
}

function AreasPreview() {
  const areas = [
    {
      title: "Dashboard",
      copy: "Visão geral do que merece ação agora.",
      icon: Compass,
      accent: "primary",
    },
    {
      title: "Trilhas",
      copy: "Roadmaps, módulos e direção clara de evolução.",
      icon: Layers3,
      accent: "accent",
    },
    {
      title: "Sessões",
      copy: "Início rápido de foco com histórico real.",
      icon: TimerReset,
      accent: "primary",
    },
    {
      title: "Projetos e tarefas",
      copy: "Execução prática e acompanhamento sem planilha paralela.",
      icon: CheckSquare,
      accent: "accent",
    },
  ] as const;

  return (
    <div className="grid flex-1 gap-4 md:grid-cols-2">
      {areas.map((area) => (
        <Surface
          key={area.title}
          tone="soft"
          className={[
            "flex min-h-[180px] flex-col justify-between rounded-[28px] px-5 py-5",
            area.accent === "primary" ? "border-primary/18" : "border-accent/16",
          ].join(" ")}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-white/[0.04] text-white">
            <area.icon size={18} />
          </div>
          <div className="flex flex-col gap-2">
            <strong className="font-display text-xl text-white">{area.title}</strong>
            <p className="m-0 text-sm leading-relaxed text-text-secondary">{area.copy}</p>
          </div>
        </Surface>
      ))}
    </div>
  );
}

function RetentionPreview() {
  return (
    <div className="grid flex-1 gap-4 lg:grid-cols-[1.04fr_0.96fr]">
      <Surface tone="soft" className="flex flex-col gap-4 rounded-[30px] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <strong className="font-display text-lg text-white">Camada de retenção</strong>
          <Pill tone="primary">Sempre à mão</Pill>
        </div>
        <div className="flex flex-col gap-3">
          <MockQueueRow
            title="Revisões"
            subtitle="D+1, D+7 e checkpoints de retenção."
            icon={TimerReset}
          />
          <MockQueueRow
            title="Notas"
            subtitle="Referência rápida com contexto do que você estudou."
            icon={BookOpen}
          />
          <MockQueueRow
            title="Análises"
            subtitle="Volume, consistência e sinais de progresso."
            icon={BarChart3}
          />
        </div>
      </Surface>

      <Surface tone="glass" className="flex flex-col gap-4 rounded-[30px] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <strong className="font-display text-lg text-white">Visualização viva</strong>
          <Pill tone="success">Mind Maps</Pill>
        </div>
        <div className="relative flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-[24px] border border-border/70 bg-[radial-gradient(circle_at_center,rgba(50,208,255,0.08),transparent_55%)]">
          <div className="absolute h-0.5 w-36 rotate-[18deg] bg-primary/40" />
          <div className="absolute h-0.5 w-28 -rotate-[18deg] bg-primary/30" />
          <NodeBubble className="left-[12%] top-[22%]" label="Trilha" />
          <NodeBubble className="left-[42%] top-[14%]" label="Módulo" primary />
          <NodeBubble className="right-[12%] top-[34%]" label="Projeto" />
          <NodeBubble className="left-[26%] bottom-[18%]" label="Notas" />
          <NodeBubble className="right-[18%] bottom-[16%]" label="Revisões" />
        </div>
      </Surface>
    </div>
  );
}

function ActivationPreview({
  meta,
  onGoToRecommended,
}: {
  meta: OnboardingMeta;
  onGoToRecommended: (href: string) => void;
}) {
  return (
    <div className="grid flex-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <Surface tone="soft" className="flex flex-col gap-4 rounded-[30px] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <strong className="font-display text-lg text-white">Ativação sugerida</strong>
          <Pill tone="warning">Primeiros 5 min</Pill>
        </div>
        <div className="flex flex-col gap-3">
          {meta.activationSteps.map((step) => (
            <ActivationRow
              key={step.title}
              title={step.title}
              description={step.description}
              done={step.done}
            />
          ))}
        </div>
      </Surface>

      <Surface tone="glass" className="flex flex-col justify-between gap-5 rounded-[30px] px-5 py-5">
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Próxima melhor ação
          </span>
          <strong className="font-display text-2xl text-white">{meta.recommendedAction.title}</strong>
          <p className="m-0 text-sm leading-relaxed text-text-secondary">
            {meta.recommendedAction.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <PrimaryButton onClick={() => onGoToRecommended(meta.recommendedAction.href)}>
            {meta.recommendedAction.cta}
            <ArrowRight size={16} />
          </PrimaryButton>
          <SecondaryButton onClick={() => onGoToRecommended("/workspace/settings")}>
            Ajustar configurações
          </SecondaryButton>
        </div>
      </Surface>
    </div>
  );
}

function FinishPreview({
  meta,
  onGoToRecommended,
}: {
  meta: OnboardingMeta;
  onGoToRecommended: (href: string) => void;
}) {
  return (
    <div className="grid flex-1 gap-4">
      <Surface tone="glass" className="flex flex-col gap-5 rounded-[30px] px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Tudo pronto</span>
            <strong className="font-display text-2xl text-white">O workspace já está preparado para o seu primeiro ciclo.</strong>
          </div>
          <Pill tone="success">Pronto para começar</Pill>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <RouteChoiceCard
            title="Entrar pelo dashboard"
            subtitle="Veja o resumo do sistema e navegue com visão mais ampla."
            actionLabel="Abrir dashboard"
            onClick={() => onGoToRecommended("/workspace/dashboard")}
            icon={Compass}
          />
          <RouteChoiceCard
            title={meta.recommendedAction.title}
            subtitle={meta.recommendedAction.description}
            actionLabel={meta.recommendedAction.cta}
            onClick={() => onGoToRecommended(meta.recommendedAction.href)}
            icon={Rocket}
            highlight
          />
        </div>
      </Surface>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-white/[0.03] px-4 py-4">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">{label}</span>
      <strong className="mt-2 block font-display text-xl text-white">{value}</strong>
    </div>
  );
}

function HighlightCard({
  title,
  copy,
  icon: Icon,
}: {
  title: string;
  copy: string;
  icon: typeof Sparkles;
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-white/[0.03] px-4 py-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-white/[0.04] text-primary">
        <Icon size={18} />
      </div>
      <strong className="font-display text-base text-white">{title}</strong>
      <p className="m-0 mt-2 text-sm leading-relaxed text-text-secondary">{copy}</p>
    </div>
  );
}

function OrbitChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-white/[0.03] px-4 py-4">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">{label}</span>
      <strong className="mt-2 block font-display text-lg text-white">{value}</strong>
    </div>
  );
}

function MockQueueRow({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: typeof TimerReset;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[22px] border border-border/70 bg-white/[0.03] px-4 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-white/[0.04] text-primary">
        <Icon size={18} />
      </div>
      <div className="flex flex-col gap-1">
        <strong className="font-display text-base text-white">{title}</strong>
        <p className="m-0 text-sm leading-relaxed text-text-secondary">{subtitle}</p>
      </div>
    </div>
  );
}

function NodeBubble({
  label,
  primary,
  className,
}: {
  label: string;
  primary?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "absolute flex h-16 min-w-[88px] items-center justify-center rounded-[20px] border px-4 text-sm font-medium shadow-[0_16px_42px_rgba(0,0,0,0.32)]",
        primary
          ? "border-primary/35 bg-primary/12 text-white"
          : "border-border/70 bg-[rgba(8,14,21,0.92)] text-text-secondary",
        className,
      ].join(" ")}
    >
      {label}
    </div>
  );
}

function ActivationRow({
  title,
  description,
  done,
}: {
  title: string;
  description: string;
  done: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[24px] border border-border/70 bg-white/[0.03] px-4 py-4">
      <div
        className={[
          "mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border",
          done
            ? "border-success/30 bg-success/12 text-success"
            : "border-primary/25 bg-primary/10 text-primary",
        ].join(" ")}
      >
        {done ? <CheckCircle2 size={18} /> : <Lightbulb size={18} />}
      </div>
      <div className="flex flex-col gap-1">
        <strong className="font-display text-base text-white">{title}</strong>
        <p className="m-0 text-sm leading-relaxed text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

function RouteChoiceCard({
  title,
  subtitle,
  actionLabel,
  onClick,
  icon: Icon,
  highlight,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onClick: () => void;
  icon: typeof Rocket;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "flex flex-col justify-between gap-5 rounded-[28px] border px-5 py-5",
        highlight ? "border-primary/26 bg-primary/10" : "border-border/70 bg-white/[0.03]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-white/[0.04] text-white">
          <Icon size={18} />
        </div>
        <div className="flex flex-col gap-2">
          <strong className="font-display text-xl text-white">{title}</strong>
          <p className="m-0 text-sm leading-relaxed text-text-secondary">{subtitle}</p>
        </div>
      </div>

      <PrimaryButton onClick={onClick}>
        {actionLabel}
        <ArrowRight size={16} />
      </PrimaryButton>
    </div>
  );
}

function StatusPill() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/22 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
      <Sparkles size={13} />
      Onboarding do workspace
    </div>
  );
}

interface OnboardingMeta {
  planLabel: string;
  planShortLabel: string;
  trackCount: number;
  sessionCount: number;
  steps: Array<{
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    previewTitle: string;
    footnote: string;
    bullets: Array<{
      title: string;
      copy: string;
      icon: typeof Sparkles;
    }>;
    summary?: {
      title: string;
      message: string;
    };
  }>;
  activationSteps: Array<{
    title: string;
    description: string;
    done: boolean;
  }>;
  recommendedAction: {
    title: string;
    description: string;
    cta: string;
    href: string;
  };
}

function buildOnboardingMeta(data: WorkspaceData | null, userName: string): OnboardingMeta {
  const firstName = userName.trim().split(/\s+/)[0] || "Você";
  const currentPlanCode = planCode(data?.billing ?? null);
  const currentPlan = data?.billing.current_plan;
  const planLabel = currentPlan
    ? `${currentPlan.name} • ${formatBrl(currentPlan.price_cents)}${billingIntervalLabel(currentPlan.interval)}`
    : "Plano Free";
  const planShortLabel = currentPlan ? currentPlan.name : currentPlanCode.toUpperCase();
  const hasTrackSelected = Boolean(data?.profile?.selected_track_id);
  const hasSessions = (data?.dashboardSummary.totalSessions ?? 0) > 0;
  const hasGoal = Boolean(data?.goal?.primary_goal?.trim());
  const trackCount = data?.trackBlueprints.length ?? data?.tracks.length ?? 0;
  const sessionCount = data?.dashboardSummary.totalSessions ?? 0;

  const recommendedAction = hasSessions
    ? {
        title: "Voltar para o dashboard",
        description: "Você já tem histórico. Use o dashboard para retomar o contexto certo do próximo ciclo.",
        cta: "Abrir dashboard",
        href: "/workspace/dashboard",
      }
    : hasTrackSelected
      ? {
          title: "Registrar a primeira sessão",
          description: "Sua trilha já está definida. Agora vale transformar intenção em ritmo real de estudo.",
          cta: "Abrir sessões",
          href: "/workspace/sessions",
        }
      : {
          title: "Escolher a trilha inicial",
          description: "Selecione a trilha ativa primeiro para o sistema começar a organizar melhor o seu avanço.",
          cta: "Abrir trilhas",
          href: "/workspace/tracks",
        };

  return {
    planLabel,
    planShortLabel,
    trackCount,
    sessionCount,
    recommendedAction,
    activationSteps: [
      {
        title: "Revisar sua meta principal",
        description: hasGoal
          ? "Sua meta já existe. Ajuste o texto se quiser deixar o foco mais específico."
          : "Defina a meta que vai orientar seu próximo ciclo logo nas Configurações.",
        done: hasGoal,
      },
      {
        title: "Escolher a trilha ativa",
        description: hasTrackSelected
          ? "A trilha atual já está conectada ao seu perfil."
          : "Selecione a trilha principal para o workspace orientar melhor o que vem a seguir.",
        done: hasTrackSelected,
      },
      {
        title: "Registrar a primeira sessão",
        description: hasSessions
          ? "Você já registrou pelo menos um ciclo de foco."
          : "Abra Sessões e registre o primeiro bloco real de estudo para começar a gerar histórico.",
        done: hasSessions,
      },
    ],
    steps: [
      {
        id: "welcome",
        eyebrow: "Boas-vindas",
        title: `${firstName}, este é o seu cockpit de produtividade em tecnologia.`,
        description:
          "O CodeTrail foi desenhado para organizar sua rotina com clareza operacional, menos ruído visual e um fluxo único entre conta, dados e evolução.",
        previewTitle: "Primeira impressão do sistema",
        footnote: "Uma entrada curta, clara e pensada para não interromper o seu ritmo.",
        bullets: [
          {
            title: "Cockpit único",
            copy: "Tudo começa no mesmo ambiente que segura billing, progresso e rotina.",
            icon: Sparkles,
          },
          {
            title: "Foco de produto",
            copy: "Cada área existe para orientar ação, não só exibir informação.",
            icon: Rocket,
          },
          {
            title: "Base premium",
            copy: "A interface foi desenhada para uso frequente, não para chamar atenção à toa.",
            icon: Target,
          },
        ],
        summary: {
          title: "O que muda para você",
          message:
            "A ideia não é mostrar tudo. É te colocar no fluxo certo para começar com contexto e sem improviso.",
        },
      },
      {
        id: "areas",
        eyebrow: "Mapa do sistema",
        title: "As áreas principais trabalham como um circuito, não como módulos soltos.",
        description:
          "Dashboard, Trilhas, Sessões, Tarefas e Projetos se conectam para manter direção, execução e visão operacional no mesmo lugar.",
        previewTitle: "Áreas que mais importam no começo",
        footnote: "A navegação foi pensada para te levar da visão geral para a próxima ação com poucos cliques.",
        bullets: [
          {
            title: "Dashboard",
            copy: "Lê o momento atual e aponta o que pede atenção primeiro.",
            icon: Compass,
          },
          {
            title: "Trilhas",
            copy: "Organizam estudo, skills e módulos em uma direção clara.",
            icon: Layers3,
          },
          {
            title: "Sessões e tarefas",
            copy: "Transformam planejamento em execução registrada.",
            icon: TimerReset,
          },
        ],
      },
      {
        id: "retention",
        eyebrow: "Retenção e referência",
        title: "Clareza de estudo também precisa de memória, contexto e visualização.",
        description:
          "Notas, revisões, flashcards, análises e mind maps existem para evitar que o aprendizado desapareça depois da sessão.",
        previewTitle: "Camadas de retenção",
        footnote: "Você não precisa usar tudo de uma vez. O sistema cresce com a sua rotina.",
        bullets: [
          {
            title: "Notas com contexto",
            copy: "Guarde resumo, snippet e referência no mesmo ambiente da execução.",
            icon: BookOpen,
          },
          {
            title: "Revisões e flashcards",
            copy: "Reforce retenção com ciclos ativos, não só releitura passiva.",
            icon: TimerReset,
          },
          {
            title: "Mind Maps e análises",
            copy: "Conecte conceitos e leia o próprio progresso com mais clareza.",
            icon: Map,
          },
        ],
      },
      {
        id: "activation",
        eyebrow: "Como começar",
        title: "O melhor início no CodeTrail é simples: direção, estrutura e primeira ação.",
        description:
          "Você não precisa preencher tudo antes de usar. Basta alinhar o essencial e registrar o primeiro ciclo para o sistema começar a trabalhar a seu favor.",
        previewTitle: "Roteiro curto de ativação",
        footnote: "Se quiser, você pode ir direto para a ação recomendada ao lado.",
        bullets: [
          {
            title: "Meta principal",
            copy: "Ajuda o sistema a manter coerência no próximo ciclo.",
            icon: Target,
          },
          {
            title: "Trilha ativa",
            copy: "Define onde seu progresso precisa ganhar profundidade.",
            icon: Layers3,
          },
          {
            title: "Primeira sessão",
            copy: "Cria o primeiro bloco real de histórico e consistência.",
            icon: Rocket,
          },
        ],
      },
      {
        id: "finish",
        eyebrow: "Fechamento",
        title: "Tudo pronto para entrar no workspace com mais clareza e menos fricção.",
        description:
          "Você pode começar pelo dashboard para ler o sistema ou seguir direto para a ação que mais acelera sua ativação agora.",
        previewTitle: "Escolha o primeiro passo",
        footnote: "O onboarding pode ser reaberto depois em Configurações sempre que você quiser revisitar o fluxo.",
        bullets: [
          {
            title: "Voltar quando quiser",
            copy: "O tour continua disponível dentro do próprio workspace.",
            icon: LifeBuoy,
          },
          {
            title: "Ajustar o sistema",
            copy: "Configurações, billing e preferências ficam no mesmo circuito.",
            icon: Settings2,
          },
          {
            title: "Começar agora",
            copy: "Feche o onboarding e deixe o produto assumir o protagonismo.",
            icon: Rocket,
          },
        ],
      },
    ],
  };
}

function formatBrl(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(valueInCents / 100);
}
