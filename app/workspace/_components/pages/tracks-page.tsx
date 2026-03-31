"use client";

import {
    fadeUpVariants,
    useMotionPreferences,
    useStableReducedMotion,
} from "@/app/components/ui/motion-system";
import {
    TrailActions,
    TrailHeader,
    TrailStepDetails,
    TrailTimeline,
} from "@/app/workspace/_components/pages/trail-timeline";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
    EmptyState,
    PageFrame
} from "@/app/workspace/_components/workspace-ui";
import {
    buildTrackTimelineDetail
} from "@/utils/workspace/helpers";
import type { TrackBlueprint } from "@/utils/workspace/types";
import { motion } from "framer-motion";
import { ArrowRight, Layers3, Play } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function TracksPage() {
  const {
    data,
    refreshing,
    selectTrack,
    startTrack,
    pauseTrack,
    resumeTrack,
    completeTrack,
    completeTrackStep,
  } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const { reduced } = useMotionPreferences();

  const trackId = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] !== "workspace" || parts[1] !== "tracks" || !parts[2]) {
      return null;
    }
    return decodeURIComponent(parts[2]);
  }, [pathname]);

  const timeline = useMemo(() => {
    if (!data || !trackId) return null;
    return buildTrackTimelineDetail({ data, trackId });
  }, [data, trackId]);

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const effectiveSelectedStepId = useMemo(() => {
    if (!timeline) return null;
    if (
      selectedStepId &&
      timeline.steps.some(
        (step) => step.id === selectedStepId && step.isAccessible,
      )
    ) {
      return selectedStepId;
    }
    return timeline.selectedSuggestedStepId;
  }, [selectedStepId, timeline]);
  const selectedStep =
    timeline?.steps.find((step) => step.id === effectiveSelectedStepId) ?? null;

  if (!data) return null;

  // INTERNAL VIEW
  if (trackId) {
    if (!timeline) {
      return (
        <PageFrame
          title="Timeline indisponível"
          subtitle="O identificador não corresponde a nenhuma trilha no catálogo."
        >
          <EmptyState
            title="Trilha não encontrada"
            subtitle="Volte para o catálogo e escolha outra trilha."
            action={
              <button
                type="button"
                className="workspace-button workspace-button--primary"
                onClick={() => router.push("/workspace/tracks")}
              >
                Voltar ao catálogo
              </button>
            }
          />
        </PageFrame>
      );
    }

    return (
      <motion.main
        initial="hidden"
        animate="visible"
        variants={fadeUpVariants(reduced, 18)}
        className="w-full max-w-7xl mx-auto space-y-8"
      >
        <TrailHeader
          timeline={timeline}
          areaLabel={data.profile?.desired_area || "Roadmap estruturado"}
          isSelected={data.profile?.selected_track_id === timeline.track.id}
        />
        <TrailActions
          timeline={timeline}
          busy={refreshing}
          isSelected={data.profile?.selected_track_id === timeline.track.id}
          onSelectTrack={() => void selectTrack(timeline.track.id)}
          onStart={() => void startTrack(timeline.track.id)}
          onPause={() => void pauseTrack(timeline.track.id)}
          onResume={() => void resumeTrack(timeline.track.id)}
          onCompleteTrack={() => void completeTrack(timeline.track.id)}
        />

        {/* Central Layout with Sidebar for Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 sticky top-24">
            <TrailTimeline
              timeline={timeline}
              selectedStepId={effectiveSelectedStepId}
              onSelectStep={setSelectedStepId}
            />
          </div>
          <div className="lg:col-span-8">
            <TrailStepDetails
              timeline={timeline}
              step={selectedStep}
              busy={refreshing}
              onCompleteStep={() => void completeTrackStep(timeline.track.id)}
            />
          </div>
        </div>
      </motion.main>
    );
  }

  // CATALOG VIEW
  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants(reduced, 18)}
      className="w-full max-w-7xl mx-auto space-y-12"
    >
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-px w-8 bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              Roadmap do Sistema
            </span>
          </div>
          <h1 className="mb-2 text-5xl font-black tracking-tighter text-on-surface">
            Catálogo de Trilhas
          </h1>
          <p className="max-w-md text-on-surface-variant text-sm">
            Escolha uma trilha para abrir a timeline dedicada de estudo e
            definir seu foco principal.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container-low px-6 py-4 rounded-xl border border-outline-variant/10">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">
              TOTAL DE TRILHAS
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black italic text-white">
                {data.trackBlueprints.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {data.trackBlueprints.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.trackBlueprints.map((item, index) => (
            <TrackEntryCard
              key={item.track.id}
              blueprint={item}
              isActive={data.profile?.selected_track_id === item.track.id}
              index={index}
              href={`/workspace/tracks/${encodeURIComponent(item.track.id)}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sem trilhas disponíveis"
          subtitle="O catálogo do workspace ainda não foi carregado."
        />
      )}
    </motion.main>
  );
}

function TrackEntryCard({
  blueprint,
  isActive,
  index,
  href,
}: {
  blueprint: TrackBlueprint;
  isActive: boolean;
  index: number;
  href: string;
}) {
  const { hoverLift, press, transition } = useMotionPreferences();
  const reducedMotion = useStableReducedMotion();
  const topSkills = blueprint.skills.slice(0, 3);
  const openTrack = () => {
    if (typeof window !== "undefined") {
      window.location.assign(href);
    }
  };

  return (
    <motion.button
      type="button"
      layout="position"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: reducedMotion ? 0 : 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            ...transition,
            delay: reducedMotion ? 0 : index * 0.05,
          },
        },
      }}
      whileHover={hoverLift}
      whileTap={press}
      onClick={openTrack}
      className={`group flex flex-col h-full text-left rounded-2xl bg-surface-container-low border transition-all duration-300 relative overflow-hidden ${isActive ? "border-primary/40 shadow-[0_10px_30px_rgba(129,236,255,0.15)] bg-surface-container-highest" : "border-outline-variant/10 hover:border-primary/20 hover:bg-surface-container-highest"}`}
      data-testid={`track-card-${blueprint.track.id}`}
    >
      {/* Decorative Glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-40"
        style={{ backgroundColor: blueprint.track.color_hex }}
      />

      {/* Header / Graphic */}
      <div className="p-6 pb-0 flex items-start justify-between relative z-10">
        <div
          className="w-14 h-14 rounded-xl border border-white/10 flex items-center justify-center shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${withAlpha(blueprint.track.color_hex, 0.4)}, rgba(14,14,14,1))`,
          }}
        >
          <Layers3 size={24} color={blueprint.track.color_hex} />
        </div>
        <div className="flex flex-col gap-1 items-end">
          {isActive && (
            <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(129,236,255,0.2)]">
              Ativa
            </span>
          )}
          {blueprint.isCompleted && (
            <span className="bg-success/10 text-success border border-success/20 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
              Concluída
            </span>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col relative z-10">
        <strong className="block text-xl font-black tracking-tight text-white mb-2 leading-tight">
          {blueprint.track.name}
        </strong>
        <p className="line-clamp-2 text-sm leading-relaxed text-on-surface-variant mb-6">
          {blueprint.track.description}
        </p>

        {/* Progress block */}
        <div className="mt-auto">
          <div className="bg-surface-container-highest/50 rounded-xl p-4 border border-outline-variant/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Progresso
              </span>
              <span className="text-xs font-black text-white">
                {Math.round(blueprint.progressPercent)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${blueprint.progressPercent}%`,
                  backgroundColor:
                    blueprint.progressPercent > 0
                      ? blueprint.track.color_hex
                      : "transparent",
                }}
              />
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider bg-white/5 px-2 py-0.5 rounded">
                {blueprint.modules.length} Módulos
              </span>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider bg-white/5 px-2 py-0.5 rounded">
                {blueprint.skills.length} Skills
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 border-t border-outline-variant/10 mt-auto flex items-center justify-between relative z-10 group-hover:border-primary/20 transition-colors duration-300">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-white transition-colors flex items-center gap-2 mt-4">
          <Play size={14} className="text-primary" /> Abrir Trilha
        </span>
        <ArrowRight
          size={16}
          className="text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 mt-4"
        />
      </div>
    </motion.button>
  );
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "").padStart(6, "0").slice(-6);
  const numericAlpha = Math.max(0, Math.min(255, Math.round(alpha * 255)));
  return `#${normalized}${numericAlpha.toString(16).padStart(2, "0")}`;
}
