"use client";

import {
  fadeUpVariants,
  listItemVariants,
  staggerContainerVariants,
  useStableReducedMotion
} from "@/app/components/ui/motion-system";
import type {
  TrackJourneyStatus,
  TrackTimelineDetail,
  TrackTimelineStep,
  TrackTimelineStepStatus,
} from "@/utils/workspace/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CirclePause,
  Flag,
  Layers3,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export function TrailHeader({
  timeline,
  areaLabel,
  isSelected,
}: {
  timeline: TrackTimelineDetail;
  areaLabel: string;
  isSelected: boolean;
}) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-8 relative overflow-hidden group">
      {/* Decorative Blur */}
      <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/workspace/tracks"
              className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest hover:bg-white/10 text-on-surface-variant hover:text-white border border-outline-variant/10 hover:border-primary/30 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              <ArrowLeft size={14} /> Voltar ao Catálogo
            </Link>
            <span className="px-3 py-1.5 bg-white/5 text-on-surface-variant border border-outline-variant/5 rounded-full text-[10px] font-bold uppercase tracking-widest">{timeline.stepCount} Etapas</span>
            <span className="px-3 py-1.5 bg-white/5 text-on-surface-variant border border-outline-variant/5 rounded-full text-[10px] font-bold uppercase tracking-widest">{timeline.blueprint.modules.length} Módulos</span>
            <span className="px-3 py-1.5 bg-white/5 text-on-surface-variant border border-outline-variant/5 rounded-full text-[10px] font-bold uppercase tracking-widest">{timeline.blueprint.skills.length} Skills</span>
          </div>

          <div className="flex items-start gap-4">
            <div
              className="h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
              style={{
                background: `linear-gradient(135deg, ${withAlpha(timeline.track.color_hex, 0.4)}, rgba(14,14,14,0.9))`
              }}
            >
              <Sparkles size={24} color={timeline.track.color_hex} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Timeline da Trilha</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white leading-none">{timeline.track.name}</h2>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-text-secondary max-w-3xl border-l-[3px] border-primary/40 pl-4 py-1 bg-gradient-to-r from-primary/5 to-transparent">
            {timeline.track.description}
          </p>
        </div>

        {/* HUD Stats */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface-container-highest/40 border border-outline-variant/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Progresso Geral</span>
              <span className="text-2xl font-black text-white italic">{Math.round(timeline.progressPercent)}%</span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${timeline.progressPercent}%`, backgroundColor: timeline.track.color_hex }} />
            </div>
            <p className="text-xs text-on-surface-variant mt-3 text-right">{timeline.completedSteps} de {timeline.stepCount} etapas concluídas</p>
          </div>

          <div className="bg-surface-container-highest/40 border border-outline-variant/10 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant block mb-1">Status Atual</span>
              <strong className="text-lg font-bold text-white leading-tight">
                {timeline.currentStepId ? `Etapa ${timeline.steps.find((item) => item.id === timeline.currentStepId)?.order ?? "-"}` : "Aguardando início"}
              </strong>
            </div>
            <TrailStatusBadge status={timeline.status} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrailStatusBadge({ status, compact = false }: { status: TrackJourneyStatus; compact?: boolean }) {
  const getStyle = () => {
    switch (status) {
      case "completed": return "bg-success/10 text-success border border-success/30 shadow-[0_0_15px_rgba(53,211,154,0.15)]";
      case "paused": return "bg-warning/10 text-warning border border-warning/30 shadow-[0_0_15px_rgba(255,191,105,0.15)]";
      case "in_progress": return "bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(129,236,255,0.2)]";
      case "not_started": return "bg-white/5 text-on-surface-variant border border-outline-variant/10";
    }
  };

  return (
    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${getStyle()} flex items-center gap-2 w-fit`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {compact ? statusLabel(status) : `Status: ${statusLabel(status)}`}
    </span>
  );
}

export function TrailActions({
  timeline,
  busy,
  isSelected,
  onSelectTrack,
  onStart,
  onPause,
  onResume,
  onCompleteTrack,
}: {
  timeline: TrackTimelineDetail;
  busy: boolean;
  isSelected: boolean;
  onSelectTrack: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onCompleteTrack: () => void;
}) {
  const canCompleteTrack =
    timeline.status !== "completed" &&
    timeline.steps.every((step) => step.status === "completed") &&
    timeline.stepCount > 0;

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-outline-variant/10">
      <div className="p-6 md:w-1/3 flex flex-col justify-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Foco Atual</span>
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
          {isSelected
            ? "Essa trilha já está marcada como foco atual do seu workspace. Suas métricas a priorizam."
            : "Defina esta trilha como foco de estudo para sinalizar ao sistema o seu objetivo ativo."}
        </p>
        <button
          onClick={onSelectTrack}
          disabled={busy || isSelected}
          className={`flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isSelected ? 'bg-success/10 text-success border border-success/20 shadow-[0_0_15px_rgba(53,211,154,0.1)]' : 'bg-surface-container-highest hover:bg-white/10 text-white border border-outline-variant/20'
            }`}
        >
          {isSelected ? <><Check size={14} /> Foco Ativo</> : <><Sparkles size={14} /> Definir como Foco</>}
        </button>
      </div>

      <div className="p-6 md:w-2/3 flex flex-col justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">Controles Executivos</span>
        <p className="text-sm text-on-surface-variant mb-6 relative z-10 leading-relaxed">
          O motor de controle da trilha dita se as suas horas contidas em sessões contarão progresso para roadmap.
        </p>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={onStart}
            disabled={busy || timeline.status !== "not_started"}
            className="flex items-center gap-2 h-10 px-6 bg-primary text-on-primary-fixed rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:bg-surface-container-highest disabled:text-on-surface-variant transition-all shadow-[0_0_15px_rgba(129,236,255,0.3)] hover:shadow-[0_0_25px_rgba(129,236,255,0.5)] active:scale-95"
          >
            <Play size={14} /> Iniciar Trilha
          </button>
          <button
            onClick={onPause}
            disabled={busy || timeline.status !== "in_progress"}
            className="flex items-center gap-2 h-10 px-6 bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:bg-surface-container-highest disabled:border-transparent disabled:text-on-surface-variant transition-all"
          >
            <Pause size={14} /> Pausar
          </button>
          <button
            onClick={onResume}
            disabled={busy || timeline.status !== "paused"}
            className="flex items-center gap-2 h-10 px-6 bg-white/5 hover:bg-white/10 text-white border border-outline-variant/20 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:bg-transparent disabled:text-on-surface-variant transition-all"
          >
            <RotateCcw size={14} /> Retomar
          </button>
          <button
            onClick={onCompleteTrack}
            disabled={busy || !canCompleteTrack}
            className="flex items-center justify-center gap-2 h-10 px-6 bg-success text-on-primary-fixed rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:bg-surface-container-highest disabled:text-on-surface-variant transition-all shadow-[0_0_15px_rgba(53,211,154,0.3)]"
          >
            <Flag size={14} /> Concluir Trilha
          </button>
        </div>
      </div>
    </div>
  );
}

export function TrailTimeline({
  timeline,
  selectedStepId,
  onSelectStep,
}: {
  timeline: TrackTimelineDetail;
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}) {
  const reducedMotion = useStableReducedMotion();

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/10">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Módulos & Etapas</h3>
        <span className="text-[10px] text-primary uppercase font-bold tracking-widest">{timeline.unlockedSteps} Livres</span>
      </div>

      {/* Sidebar layout: always vertical for the timeline */}
      <motion.ol
        className="flex flex-col gap-3 relative"
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants(reducedMotion, 0.05)}
      >
        <div className="absolute top-8 bottom-8 left-[1.15rem] w-0.5 bg-outline-variant/10 z-0" />

        {timeline.steps.map((step) => (
          <TrailTimelineStep
            key={step.id}
            step={step}
            selected={selectedStepId === step.id}
            onSelect={onSelectStep}
          />
        ))}
      </motion.ol>
    </div>
  );
}

export function TrailTimelineStep({
  step,
  selected,
  onSelect,
}: {
  step: TrackTimelineStep;
  selected: boolean;
  onSelect: (stepId: string) => void;
}) {
  const reducedMotion = useStableReducedMotion();
  const clickable = step.isAccessible;

  return (
    <motion.li
      className="relative z-10"
      variants={listItemVariants(reducedMotion)}
      layout="position"
    >
      <motion.button
        type="button"
        disabled={!clickable}
        onClick={() => clickable && onSelect(step.id)}
        className={[`
          group flex w-full gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-300 relative overflow-hidden
        `,
          selected
            ? "border-primary/40 bg-primary/[0.04] shadow-[0_5px_20px_rgba(129,236,255,0.1)]"
            : "border-transparent bg-transparent",
          clickable ? (selected ? "" : "hover:border-outline-variant/20 hover:bg-surface-container-highest") : "cursor-not-allowed opacity-50",
        ].join(" ")}
        aria-pressed={selected}
        data-testid={`trail-step-${step.order}`}
      >
        {selected && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full blur-[30px] pointer-events-none -mt-4 -mr-4" />
        )}

        <div className="flex flex-col items-center shrink-0 pt-1">
          <StepMarker step={step} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
              Etapa {String(step.order).padStart(2, "0")}
            </span>
            {step.status !== "not_started" && <TrailStepStatusPill status={step.status} small />}
          </div>
          <strong className={`block font-black text-sm tracking-tight leading-tight ${selected ? 'text-white' : 'text-on-surface-variant'}`}>{step.title}</strong>

          {selected && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="text-[9px] uppercase font-bold text-text-secondary tracking-widest bg-white/5 border border-white/5 rounded px-2 py-0.5">{step.estimatedLabel}</span>
                <span className="text-[9px] uppercase font-bold text-primary tracking-widest bg-primary/10 border border-primary/20 rounded px-2 py-0.5">{Math.round(step.progressPercent)}%</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.button>
    </motion.li>
  );
}

export function TrailStepDetails({
  timeline,
  step,
  busy,
  onCompleteStep,
}: {
  timeline: TrackTimelineDetail;
  step: TrackTimelineStep | null;
  busy: boolean;
  onCompleteStep: () => void;
}) {
  const reducedMotion = useStableReducedMotion();
  const canCompleteCurrentStep =
    step?.isCurrent === true &&
    (step.status === "in_progress" || step.status === "paused");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step?.id ?? "empty-step"}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeUpVariants(reducedMotion, 12)}
      >
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-8 relative overflow-hidden backdrop-blur-md min-h-[500px] flex flex-col">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -mt-[250px] -ml-[250px]" />

          <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/10 relative z-10">
            <h3 className="text-sm font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={16} />
              {step ? `Detalhes da Etapa ${String(step.order).padStart(2, "0")}` : "Inspeção de Módulo"}
            </h3>
            {step && (
              <div className="flex items-center gap-2">
                <TrailStepStatusPill status={step.status} />
                <span className="bg-surface-container-highest px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest">{Math.round(step.progressPercent)}% Concluído</span>
              </div>
            )}
          </div>

          {step ? (
            <div className="grid lg:grid-cols-2 gap-8 relative z-10 flex-1">
              <div className="space-y-8">
                <div>
                  <h4 className="text-2xl font-black text-white italic tracking-tighter mb-4 leading-tight">{step.title}</h4>
                  <p className="text-on-surface-variant leading-relaxed text-sm">{step.description}</p>
                </div>

                <div className="bg-surface-container-highest/20 border border-outline-variant/10 rounded-2xl p-5">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface-variant flex items-center gap-2 mb-4"><Check size={14} className="text-primary" /> Roadmap & Transição</span>
                  <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden mb-4">
                    <div className="h-full rounded-full transition-all duration-1000 bg-primary" style={{ width: `${step.progressPercent}%` }} />
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {step.status === "blocked"
                      ? "Essa etapa ainda depende da conclusão do bloco anterior."
                      : step.status === "completed"
                        ? "Etapa concluída. O próximo bloco já está liberado ou a trilha está pronta para encerramento."
                        : "A etapa atual está conectada às tasks e ao ritmo da trilha em tempo real."}
                  </p>
                </div>

                {step.observations.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface-variant flex items-center gap-2 mb-4"><CirclePause size={14} className="text-warning" /> Observações do Sistema</span>
                    <ul className="space-y-2">
                      {step.observations.map((item) => (
                        <li key={item} className="flex gap-2 items-start text-xs text-on-surface-variant">
                          <div className="w-1 h-1 rounded-full bg-warning mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-surface-container-highest/30 border border-outline-variant/10 rounded-2xl p-6 flex flex-col h-full">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface-variant flex items-center gap-2 mb-4"><Play size={14} className={step.status === "completed" ? "text-success" : "text-primary"} /> Execução da Etapa</span>

                  <p className="text-sm text-on-surface-variant mb-8 flex-1">
                    {step.status === "completed"
                      ? "Esse bloco já está fechado. Você pode revisar o material ou usar o comando principal da trilha para concluir tudo."
                      : step.status === "blocked"
                        ? "Finalize a pendência anterior para que este terminal operacional seja destravado."
                        : "Siga o material sugerido e marque as tarefas vinculadas. Quando terminar o ciclo ativo de estudos, declare controle na ação abaixo."}
                  </p>

                  <button
                    onClick={onCompleteStep}
                    disabled={busy || !canCompleteCurrentStep}
                    className={`w-full flex items-center justify-center gap-2 h-14 rounded-xl font-bold text-xs uppercase tracking-[0.18em] transition-all ${step.status === "completed" ? 'bg-success/10 text-success border border-success/20' : 'bg-primary hover:bg-primary/90 text-on-primary-fixed shadow-[0_0_20px_rgba(129,236,255,0.4)] disabled:opacity-50 disabled:bg-surface-container-highest disabled:text-on-surface-variant disabled:shadow-none'
                      }`}
                  >
                    <Check size={16} />
                    {step.status === "completed" ? "Etapa Finalizada" : "Avançar Próxima Etapa"}
                  </button>
                </div>

                {step.tasks.length > 0 && (
                  <div className="border border-outline-variant/10 rounded-2xl overflow-hidden mt-6">
                    <div className="bg-white/5 py-2 px-4 border-b border-outline-variant/10">
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface-variant">Tarefas Operacionais</span>
                    </div>
                    <div className="divide-y divide-outline-variant/5 max-h-[300px] overflow-y-auto">
                      {step.tasks.map((task) => (
                        <div key={task.id} className="p-4 hover:bg-white/5 transition-colors group">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <strong className={`block text-sm font-bold mb-1 ${task.status === "completed" ? 'line-through text-on-surface-variant' : 'text-white'}`}>{task.title}</strong>
                              {task.description && <p className="text-xs text-on-surface-variant line-clamp-1">{task.description}</p>}
                            </div>
                            <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border shrink-0 ${task.status === "completed" ? 'bg-success/10 text-success border-success/30' :
                              task.status === "in_progress" ? 'bg-primary/10 text-primary border-primary/30' :
                                'bg-surface-container-highest text-on-surface-variant border-outline-variant/20'
                              }`}>
                              {task.status === "completed" ? "Concluída" : task.status === "in_progress" ? "Andamento" : "Pendente"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 relative z-10 py-20">
              <Layers3 size={48} className="text-outline-variant/30 mb-6" />
              <h4 className="text-xl font-bold text-white mb-2">Painel de Inspeção</h4>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
                Selecione um dos blocos modulares soltos no grid lateral para carregar seus dados e ações.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function TrailStepStatusPill({ status, small = false }: { status: TrackTimelineStepStatus, small?: boolean }) {
  const getStyle = () => {
    switch (status) {
      case "completed": return "bg-success/10 text-success border-success/30";
      case "paused": return "bg-warning/10 text-warning border-warning/30";
      case "in_progress": return "bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_rgba(129,236,255,0.15)]";
      case "blocked": return "bg-black/20 text-on-surface-variant border-black/40";
      default: return "bg-surface-container-highest text-on-surface-variant border-outline-variant/20";
    }
  };

  return (
    <span className={`rounded border font-bold uppercase tracking-widest ${small ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-1'} ${getStyle()}`}>
      {statusLabel(status)}
    </span>
  );
}

function StepMarker({ step }: { step: TrackTimelineStep }) {
  const content = step.status === "completed"
    ? <Check size={14} />
    : step.status === "paused"
      ? <Pause size={14} />
      : step.status === "blocked"
        ? <Lock size={14} />
        : step.status === "in_progress"
          ? <Play size={14} />
          : <span className="text-[10px] font-bold">{step.order}</span>;

  return (
    <span
      className={[`
        relative inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold transition-all duration-300
      `,
        step.status === "completed"
          ? "border-success/40 bg-success/10 text-success"
          : step.status === "paused"
            ? "border-warning/30 bg-warning/10 text-warning"
            : step.status === "in_progress"
              ? "border-primary/40 bg-primary/20 text-primary shadow-[0_0_15px_rgba(129,236,255,0.3)]"
              : step.status === "blocked"
                ? "border-outline-variant/10 bg-white/5 text-on-surface-variant"
                : "border-outline-variant/20 bg-surface-container-highest text-white",
      ].join(" ")}
    >
      {content}
    </span>
  );
}

function statusLabel(status: TrackJourneyStatus | TrackTimelineStepStatus) {
  switch (status) {
    case "not_started": return "Não inciada";
    case "in_progress": return "Em andamento";
    case "paused": return "Pausada";
    case "completed": return "Concluída";
    case "blocked": return "Bloqueada";
    default: return status;
  }
}

function withAlpha(hex: string, alpha: number) {
  if (!hex) return "rgba(0,0,0,0)";
  const normalized = hex.replace("#", "").padStart(6, "0").slice(-6);
  const numericAlpha = Math.max(0, Math.min(255, Math.round(alpha * 255)));
  return `#${normalized}${numericAlpha.toString(16).padStart(2, "0")}`;
}
