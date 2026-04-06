"use client";

import {
    fadeUpVariants,
    useMotionPreferences,
} from "@/app/components/ui/motion-system";
import {
    ModalForm,
    nullable,
    toDatetimeLocal,
} from "@/app/workspace/_components/pages/shared";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
    Field,
    Select,
    TextArea,
    TextInput,
    WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import { labelForReviewStatus } from "@/utils/workspace/helpers";
import type { ReviewRow, TrackBlueprint } from "@/utils/workspace/types";
import { motion } from "framer-motion";
import {
    BrainCircuit,
    Check,
    Clock3,
    History,
    Layers3,
    Pencil,
    Play,
    Repeat2,
    Trash2,
} from "lucide-react";
import { useState } from "react";

export function ReviewsPage() {
  const { data, saveReview, deleteReview } = useWorkspace();
  const { reduced } = useMotionPreferences();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReviewRow | null>(null);
  const pendingCount = data!.reviews.filter(
    (item) => item.status === "pending",
  ).length;
  const overdueCount = data!.reviews.filter(
    (item) => item.status === "overdue",
  ).length;
  const completedCount = data!.reviews.filter(
    (item) => item.status === "completed",
  ).length;
  const efficiency = data!.reviews.length
    ? Math.round((completedCount / data!.reviews.length) * 1000) / 10
    : 0;
  const heatmapCells = buildHeatmapCells(data!.reviews);

  async function handleSubmit(formData: FormData) {
    await saveReview({
      id: editing?.id,
      title: formData.get("title")?.toString(),
      scheduled_for: new Date(
        formData.get("scheduled_for")?.toString() || new Date(),
      ).toISOString(),
      status: formData.get("status")?.toString() as ReviewRow["status"],
      interval_label: formData.get("interval_label")?.toString(),
      notes: formData.get("notes")?.toString() || null,
      track_id: nullable(formData.get("track_id")),
    });
    setEditing(null);
    setOpen(false);
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
                Fase: Retenção
              </span>
            </div>
            <h1 className="mb-2 text-5xl font-black tracking-tighter text-on-surface">
              Revisão Diária
            </h1>
            <p className="max-w-md text-on-surface-variant text-sm">
              Sistema pronto para sequência de repetição espaçada. Otimize suas
              vias neurais.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-surface-container-low px-6 py-4">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Sequência Atual
                </div>
                <div className="text-2xl font-black italic text-primary">
                  {String(Math.max(0, completedCount)).padStart(2, "0")} feitas
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <BrainCircuit size={20} className="text-primary" />
              </div>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-3 rounded-full bg-gradient-to-br from-primary to-primary-container px-8 py-4 text-sm font-black uppercase tracking-widest text-on-primary-fixed shadow-[0_0_30px_rgba(0,227,253,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              Iniciar Sequência
              <Play size={18} className="fill-current" />
            </button>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Review Queue */}
          <div className="space-y-6 lg:col-span-8">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
                <Layers3 size={20} className="text-primary" />
                Filas Pendentes
              </h2>
              <span className="font-mono text-xs text-on-surface-variant">
                TOTAL: {String(data!.reviews.length).padStart(2, "0")}
              </span>
            </div>

            {data!.reviews.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data!.reviews.map((review) => {
                  const isOverdue = review.status === "overdue";
                  const isCompleted = review.status === "completed";

                  const borderColor = isCompleted
                    ? "border-success"
                    : isOverdue
                      ? "border-error"
                      : "border-primary";
                  const shadowColor = isCompleted
                    ? "shadow-[0_0_8px_rgba(72,255,160,0.4)]"
                    : isOverdue
                      ? "shadow-[0_0_8px_rgba(255,113,108,0.4)]"
                      : "shadow-[0_0_8px_rgba(129,236,255,0.4)]";
                  const tagStyle = isCompleted
                    ? "bg-success/10 text-success"
                    : isOverdue
                      ? "bg-error/10 text-error"
                      : "bg-primary/10 text-primary";
                  const barColor = isCompleted
                    ? "bg-success"
                    : isOverdue
                      ? "bg-error"
                      : "bg-primary";

                  return (
                    <div
                      key={review.id}
                      data-testid="review-row"
                      className={`group relative overflow-hidden rounded-r-xl border-l-4 ${borderColor} bg-surface-container p-6 transition-all hover:bg-surface-container-high`}
                    >
                      <div className="absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
                        {isCompleted ? (
                          <Check size={80} />
                        ) : isOverdue ? (
                          <Clock3 size={80} />
                        ) : (
                          <Repeat2 size={80} />
                        )}
                      </div>
                      <div className="mb-4 flex items-start justify-between">
                        <div className="min-w-0 pr-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest ${isCompleted ? "text-success" : isOverdue ? "text-error" : "text-primary"}`}
                          >
                            {review.interval_label}
                          </span>
                          <h3 className="mt-1 truncate text-lg font-bold text-white">
                            {review.title}
                          </h3>
                        </div>
                        <div
                          className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase ${tagStyle}`}
                        >
                          {labelForReviewStatus(review.status)}
                        </div>
                      </div>
                      <div className="mb-6 flex items-center gap-4 font-mono text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1 opacity-80">
                          <Clock3 size={14} />{" "}
                          {relativeReviewTiming(review.scheduled_for)}
                        </span>
                        {review.notes && (
                          <span
                            className="flex items-center gap-1 opacity-80 truncate"
                            title={review.notes}
                          >
                            <span className="truncate max-w-[120px]">
                              {review.notes}
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-highest">
                        <div
                          className={`h-full ${barColor} ${shadowColor}`}
                          style={{
                            width: isCompleted
                              ? "100%"
                              : isOverdue
                                ? "92%"
                                : "45%",
                          }}
                        />
                      </div>

                      <div className="mt-4 flex gap-2 pt-4 relative z-10 border-t border-white/5">
                        {review.status !== "completed" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void saveReview({
                                id: review.id,
                                status: "completed",
                                completed_at: new Date().toISOString(),
                              });
                            }}
                            className="text-[10px] uppercase font-bold text-success hover:text-success/80 transition-colors flex items-center gap-1"
                          >
                            <Check size={12} /> Resolver
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(review);
                            setOpen(true);
                          }}
                          aria-label="Editar"
                          className="text-[10px] uppercase font-bold text-on-surface-variant hover:text-white transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteReview(review.id);
                          }}
                          aria-label="Excluir revisão"
                          className="text-[10px] uppercase font-bold text-on-surface-variant hover:text-error transition-colors flex items-center gap-1 ml-2"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-surface-container">
                <Layers3 size={40} className="mb-3 opacity-20" />
                <p className="text-on-surface-variant text-sm">
                  Nenhuma revisão na fila.
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar Stats */}
          <div className="space-y-6 lg:col-span-4">
            {/* Spaced Repetition Heatmap */}
            <div className="rounded-2xl border border-white/5 bg-surface-container p-6">
              <h3 className="mb-6 flex items-center justify-between text-sm font-bold tracking-tight text-white">
                Mapa Neural
                <span className="font-mono text-[10px] uppercase text-slate-500">
                  Ano 2026
                </span>
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {heatmapCells.slice(0, 28).map((intensity, index) => (
                  <div
                    key={index}
                    className={`aspect-square w-full rounded-sm ${
                      intensity === 0
                        ? "bg-primary/5"
                        : intensity === 1
                          ? "bg-primary/20"
                          : intensity === 2
                            ? "bg-primary/40 text-primary"
                            : intensity === 3
                              ? "bg-primary/60 text-primary"
                              : "bg-primary shadow-[0_0_8px_rgba(129,236,255,0.4)]"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between font-mono text-[10px] text-on-surface-variant">
                <span>Menos Ativo</span>
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-sm bg-primary/10"></div>
                  <div className="h-2 w-2 rounded-sm bg-primary/30"></div>
                  <div className="h-2 w-2 rounded-sm bg-primary/60"></div>
                  <div className="h-2 w-2 rounded-sm bg-primary"></div>
                </div>
                <span>Hiper Ativo</span>
              </div>
            </div>

            {/* Topic Breakdown */}
            <div className="rounded-2xl border border-white/5 bg-surface-container p-6">
              <h3 className="mb-6 text-sm font-bold tracking-tight text-white">
                Distribuição por Dificuldade
              </h3>
              <div className="space-y-4">
                <DistributionRow
                  label="Caminho Fácil"
                  value={`${completedCount} Tópicos`}
                  percent={
                    data!.reviews.length
                      ? (completedCount / data!.reviews.length) * 100
                      : 0
                  }
                  tone="primary"
                />
                <DistributionRow
                  label="Zona Estável"
                  value={`${pendingCount} Tópicos`}
                  percent={
                    data!.reviews.length
                      ? (pendingCount / data!.reviews.length) * 100
                      : 0
                  }
                  tone="tertiary"
                />
                <DistributionRow
                  label="Zona Crítica"
                  value={`${overdueCount} Tópicos`}
                  percent={
                    data!.reviews.length
                      ? (overdueCount / data!.reviews.length) * 100
                      : 0
                  }
                  tone="warning"
                />
              </div>
            </div>

            {/* Performance Index */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-surface-container p-6">
              <div className="relative z-10">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                  Eficiência de Recall
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black italic tracking-tighter text-on-surface">
                    {efficiency.toFixed(1)}%
                  </span>
                  <span className="text-xs font-bold text-primary">
                    +{Math.max(0, completedCount - overdueCount)}.0%
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <BrainCircuit size={14} className="text-primary" />
                  <span className="font-mono text-[10px] uppercase text-on-surface-variant">
                    Otimizado na última sequência
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <BrainCircuit size={100} className="text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <ActionInsightCard
            icon={<Repeat2 size={24} />}
            title="Gerar Flashcards"
            subtitle="Converta notas recentes em cards de repetição espaçada automaticamente."
            tone="primary"
          />
          <ActionInsightCard
            icon={<BrainCircuit size={24} />}
            title="Resumo com IA"
            subtitle="Revise tópicos complexos com o assistente Neon AI."
            tone="tertiary"
          />
          <ActionInsightCard
            icon={<History size={24} />}
            title="Nós Esquecidos"
            subtitle="Revise tópicos com menor pontuação de memorização na sua biblioteca."
            tone="warning"
          />
        </div>
      </motion.main>

      <ReviewModal
        open={open}
        onClose={() => {
          setEditing(null);
          setOpen(false);
        }}
        editing={editing}
        onSubmit={handleSubmit}
        tracks={data!.trackBlueprints}
      />
    </>
  );
}

function ReviewModal({
  open,
  onClose,
  editing,
  onSubmit,
  tracks,
}: {
  open: boolean;
  onClose: () => void;
  editing: ReviewRow | null;
  onSubmit: (formData: FormData) => Promise<void>;
  tracks: TrackBlueprint[];
}) {
  return (
    <WorkspaceModal
      title={editing ? "Editar revisão" : "Nova revisão"}
      subtitle="Agende a revisão com rótulo de intervalo."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <Field label="Título">
          <TextInput name="title" defaultValue={editing?.title || ""} />
        </Field>
        <Field label="Data da revisão">
          <TextInput
            name="scheduled_for"
            type="datetime-local"
            defaultValue={toDatetimeLocal(editing?.scheduled_for)}
          />
        </Field>
        <Field label="Intervalo">
          <TextInput
            name="interval_label"
            defaultValue={editing?.interval_label || "D+1"}
          />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={editing?.status || "pending"}>
            <option value="pending">Pendente</option>
            <option value="completed">Concluída</option>
            <option value="overdue">Atrasada</option>
          </Select>
        </Field>
        <Field label="Trilha">
          <Select name="track_id" defaultValue={editing?.track_id || ""}>
            <option value="">Sem trilha</option>
            {tracks.map((item) => (
              <option key={item.track.id} value={item.track.id}>
                {item.track.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notas">
          <TextArea name="notes" rows={5} defaultValue={editing?.notes || ""} />
        </Field>
      </ModalForm>
    </WorkspaceModal>
  );
}

function DistributionRow({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: string;
  percent: number;
  tone: "primary" | "success" | "warning" | "tertiary";
}) {
  const barClass =
    tone === "success" || tone === "tertiary"
      ? "bg-tertiary shadow-[0_0_8px_rgba(84,224,253,0.4)]"
      : tone === "warning"
        ? "bg-error shadow-[0_0_8px_rgba(255,113,108,0.4)]"
        : "bg-primary shadow-[0_0_8px_rgba(129,236,255,0.4)]";
  const labelClass =
    tone === "success" || tone === "tertiary"
      ? "text-tertiary"
      : tone === "warning"
        ? "text-error"
        : "text-primary";

  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-tighter">
        <span className={labelClass}>{label}</span>
        <span className="text-on-surface">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface-container-highest">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${Math.max(6, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

function ActionInsightCard({
  icon,
  title,
  subtitle,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: "primary" | "neutral" | "warning" | "tertiary";
}) {
  const iconClass =
    tone === "warning"
      ? "text-error"
      : tone === "primary"
        ? "text-primary"
        : "text-tertiary";

  return (
    <div className="group cursor-pointer rounded-xl border border-white/5 bg-surface-container-low p-6 transition-colors hover:bg-surface-container">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container transition-transform group-hover:scale-110">
        <span className={iconClass}>{icon}</span>
      </div>
      <h4 className="mb-1 text-sm font-bold uppercase tracking-tight text-white">
        {title}
      </h4>
      <p className="text-xs text-on-surface-variant">{subtitle}</p>
    </div>
  );
}

function buildHeatmapCells(reviews: ReviewRow[]) {
  const base = Array.from({ length: 28 }, () => 0);
  reviews.forEach((review, index) => {
    const cellIndex = index % base.length;
    const intensity =
      review.status === "completed" ? 4 : review.status === "pending" ? 2 : 3;
    base[cellIndex] = Math.min(4, Math.max(base[cellIndex], intensity));
  });
  return base;
}

function reviewAccentClass(status: ReviewRow["status"]) {
  if (status === "completed") {
    return "border-success/80 border border-success/18";
  }
  if (status === "overdue") {
    return "border-warning/80 border border-warning/18";
  }
  return "border-primary/80 border border-primary/14";
}

function reviewPillTone(status: ReviewRow["status"]) {
  if (status === "completed") return "success";
  if (status === "overdue") return "warning";
  return "primary";
}

function reviewPressureLabel(status: ReviewRow["status"]) {
  if (status === "completed") return "Baixa";
  if (status === "overdue") return "Alta";
  return "Média";
}

function reviewPressureValue(status: ReviewRow["status"]) {
  if (status === "completed") return 28;
  if (status === "overdue") return 92;
  return 64;
}

function relativeReviewTiming(value: string) {
  const delta = new Date(value).getTime() - Date.now();
  const hours = Math.round(delta / (1000 * 60 * 60));

  if (hours <= -24) {
    return `${Math.abs(Math.round(hours / 24))}d atrasada`;
  }
  if (hours < 0) {
    return `${Math.abs(hours)}h atrasada`;
  }
  if (hours < 24) {
    return `em ${hours}h`;
  }
  return `em ${Math.round(hours / 24)}d`;
}
