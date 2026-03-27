"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoadingState } from "@/app/components/ui/system-primitives";
import {
  fadeUpVariants,
  listItemVariants,
  staggerContainerVariants,
  useStableReducedMotion,
} from "@/app/components/ui/motion-system";
import { AnalyticsPage } from "@/app/workspace/_components/pages/analytics-page";
import { BillingPage } from "@/app/workspace/_components/pages/billing-page";
import { DashboardPage } from "@/app/workspace/_components/pages/dashboard-page";
import { FlashcardsPage } from "@/app/workspace/_components/pages/flashcards-page";
import { MindMapsPage } from "@/app/workspace/_components/pages/mindmaps-page";
import { NotesPage } from "@/app/workspace/_components/pages/notes-page";
import { ProjectsPage } from "@/app/workspace/_components/pages/projects-page";
import { ReviewsPage } from "@/app/workspace/_components/pages/reviews-page";
import { SessionsPage } from "@/app/workspace/_components/pages/sessions-page";
import { SettingsPage } from "@/app/workspace/_components/pages/settings-page";
import { TasksPage } from "@/app/workspace/_components/pages/tasks-page";
import { TracksPage } from "@/app/workspace/_components/pages/tracks-page";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import { PageFrame } from "@/app/workspace/_components/workspace-ui";
import type { WorkspaceSectionKey } from "@/utils/workspace/types";

export function WorkspaceSection({ section }: { section: WorkspaceSectionKey }) {
  const { data, loading, error } = useWorkspace();
  const reducedMotion = useStableReducedMotion();

  if (loading) {
    return (
      <PageFrame
        title="Inicializando workspace"
        subtitle="Estabelecendo conexão segura com o backend remoto..."
      >
        <div className="flex flex-col gap-5 py-6 sm:gap-6 sm:py-8">
          <LoadingState
            title="Carregando seu ambiente"
            message="Montando as áreas principais, sincronizando contexto e preparando a navegação."
          />
          <motion.div
            className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6"
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants(reducedMotion, 0.08)}
          >
            <WorkspaceSkeletonCard className="min-h-[220px]" reducedMotion={reducedMotion} />
            <WorkspaceSkeletonCard className="min-h-[220px]" reducedMotion={reducedMotion} />
          </motion.div>
          <motion.div
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 xl:gap-6"
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants(reducedMotion, 0.06)}
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <WorkspaceSkeletonCard
                key={index}
                className="min-h-[148px]"
                reducedMotion={reducedMotion}
              />
            ))}
          </motion.div>
        </div>
      </PageFrame>
    );
  }

  if (!data) {
    return (
      <PageFrame
        title="Erro de Conexão"
        subtitle="Não possuímos acesso as chaves de dados do seu workspace no momento."
      >
        <motion.div
          className="border border-red-500/30 bg-red-500/10 p-6 font-sans text-sm text-red-400"
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants(reducedMotion, 12)}
        >
          {error || "Falha na sincronização dos dados operacionais."}
        </motion.div>
      </PageFrame>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeUpVariants(reducedMotion, 18)}
      >
        {renderSection(section)}
      </motion.div>
    </AnimatePresence>
  );
}

function renderSection(section: WorkspaceSectionKey) {
  if (section === "dashboard") return <DashboardPage />;
  if (section === "tracks") return <TracksPage />;
  if (section === "sessions") return <SessionsPage />;
  if (section === "tasks") return <TasksPage />;
  if (section === "reviews") return <ReviewsPage />;
  if (section === "projects") return <ProjectsPage />;
  if (section === "notes") return <NotesPage />;
  if (section === "flashcards") return <FlashcardsPage />;
  if (section === "mind-maps") return <MindMapsPage />;
  if (section === "analytics") return <AnalyticsPage />;
  if (section === "settings") return <SettingsPage />;
  return <BillingPage />;
}

function WorkspaceSkeletonCard({
  reducedMotion,
  className,
}: {
  reducedMotion: boolean | null;
  className?: string;
}) {
  return (
      <motion.div
      className={[
        "workspace-panel workspace-panel--muted flex flex-col gap-4 overflow-hidden p-5 sm:p-6",
        className,
      ].join(" ")}
      variants={listItemVariants(reducedMotion)}
    >
      <div className="workspace-skeleton-line w-24" />
      <div className="workspace-skeleton-line h-8 w-[72%]" />
      <div className="workspace-skeleton-line w-[86%]" />
      <div className="workspace-skeleton-line w-[64%]" />
      <div className="mt-auto grid gap-3 md:grid-cols-2">
        <div className="workspace-skeleton-block h-16" />
        <div className="workspace-skeleton-block h-16" />
      </div>
    </motion.div>
  );
}
