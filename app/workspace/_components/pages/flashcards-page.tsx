"use client";

import {
    fadeUpVariants,
    useMotionPreferences,
} from "@/app/components/ui/motion-system";
import {
    LockedFeaturePage,
    ModalForm,
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
    formatRelativeDue,
    normalizedDeckName,
} from "@/utils/workspace/helpers";
import type {
    FlashcardRow,
    ProjectBundle,
    TrackBlueprint,
} from "@/utils/workspace/types";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bolt,
    Info,
    Lightbulb,
    Pencil,
    Plus,
    RefreshCw,
    Sparkles,
    Trash2,
    TrendingUp,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";

export function FlashcardsPage() {
  const { data, saveFlashcard, deleteFlashcard, reviewFlashcard } =
    useWorkspace();
  const { reduced, hoverLift, transition } = useMotionPreferences();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FlashcardRow | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    data!.flashcards[0]?.id ?? null,
  );
  const [isRevealed, setIsRevealed] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsRevealed(false);
  }, [selectedId]);

  const selected =
    data!.flashcards.find((item) => item.id === selectedId) ??
    data!.flashcards[0] ??
    null;
  const dueNow = data!.flashcards.filter(
    (item) => new Date(item.due_at).getTime() <= currentTime,
  );

  const reviewedCount = data!.flashcards.filter(
    (item) => item.review_count > 0,
  ).length;
  const retentionScore = data!.flashcards.length
    ? Math.round(
        data!.flashcards.reduce((total, item) => {
          const itemScore = Math.min(
            100,
            item.correct_streak * 20 + item.review_count * 8,
          );
          return total + itemScore;
        }, 0) / data!.flashcards.length,
      )
    : 0;

  const sessionProgress = data!.flashcards.length
    ? Math.round((reviewedCount / data!.flashcards.length) * 100)
    : 0;
  const milestoneProgress = Math.min(
    100,
    Math.round((data!.flashcards.length / 200) * 100),
  );

  const activeTrack = data!.trackBlueprints.find(
    (item) => item.track.id === selected?.track_id,
  );
  const activeModule = data!.trackBlueprints
    .flatMap((item) => item.modules)
    .find((item) => item.id === selected?.module_id);
  const activeProject = data!.projectBundles.find(
    (item) => item.project.id === selected?.project_id,
  );

  if (!data!.featureAccess.flashcards) {
    return (
      <LockedFeaturePage
        title="Flashcards premium bloqueados"
        feature="Flashcards"
      />
    );
  }

  async function handleSubmit(formData: FormData) {
    await saveFlashcard({
      id: editing?.id,
      deck_name: formData.get("deck_name")?.toString(),
      question: formData.get("question")?.toString(),
      answer: formData.get("answer")?.toString(),
      track_id: nullable(formData.get("track_id")),
      module_id: nullable(formData.get("module_id")),
      project_id: nullable(formData.get("project_id")),
    });
    setEditing(null);
    setOpen(false);
  }

  const handleReview = async (quality: "again" | "hard" | "good" | "easy") => {
    if (!selected) return;
    const currentSelectedId = selectedId;
    await reviewFlashcard(selected, quality);
    setIsRevealed(false);

    // Automatically select next due card if available
    const nextDue = dueNow.find((c) => c.id !== currentSelectedId);
    if (nextDue) {
      setSelectedId(nextDue.id);
    } else {
      const anyNext = data!.flashcards.find((c) => c.id !== currentSelectedId);
      if (anyNext) setSelectedId(anyNext.id);
    }
  };

  return (
    <>
      <motion.main
        initial="hidden"
        animate="visible"
        variants={fadeUpVariants(reduced, 18)}
        className="w-full max-w-7xl mx-auto space-y-12"
      >
        {/* Page Header */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-8 bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                Aprendizado Ativo
              </span>
            </div>
            <h1 className="mb-2 text-5xl font-black tracking-tighter text-on-surface">
              Flashcards
            </h1>
            <p className="max-w-md text-on-surface-variant text-sm">
              Decks de repetição espaçada com sincronização em tempo real.
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="flex items-center gap-3 rounded-full bg-gradient-to-br from-primary to-primary-container px-8 py-4 text-sm font-black uppercase tracking-widest text-on-primary-fixed shadow-[0_0_30px_rgba(0,227,253,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} className="fill-current" />
            Novo Card
          </button>
        </div>

        {/* Session Progress Header */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-1 block">
                Sessão Atual
              </span>
              <h2 className="text-3xl font-black tracking-tighter text-white">
                {normalizedDeckName(selected?.deck_name ?? "Biblioteca geral")}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-on-surface-variant text-sm">
                Progresso:{" "}
                <span className="text-primary font-mono">
                  {reviewedCount}/{data!.flashcards.length}
                </span>
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sessionProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-primary-container drop-shadow-[0_0_12px_rgba(129,236,255,0.6)]"
            />
          </div>
        </div>

        {/* Flashcard Section */}
        {selected ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Card (The Central Focus) */}
            <div className="lg:col-span-8 group perspective-1000">
              <div className="bg-[rgba(26,26,26,0.7)] backdrop-blur-xl rounded-2xl min-h-[420px] p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(129,236,255,0.1)] border border-outline-variant/10">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold text-primary tracking-widest border border-outline-variant/20 shadow-sm uppercase">
                      {selected.deck_name || "GERAL"}
                    </span>
                    <span className="px-3 py-1 bg-surface-container-lowest rounded-full text-[10px] font-bold text-on-surface-variant tracking-widest border border-outline-variant/10 shadow-sm uppercase">
                      DUE: {formatRelativeDue(selected.due_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditing(selected);
                        setOpen(true);
                      }}
                      className="text-on-surface-variant hover:text-primary transition-colors p-1"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => void deleteFlashcard(selected.id)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center text-center py-10 relative z-10">
                  <span className="text-on-surface-variant text-[10px] sm:text-xs mb-6 uppercase tracking-widest font-medium opacity-80">
                    Pergunta Técnica
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-white mb-8">
                    {selected.question}
                  </h2>

                  <AnimatePresence>
                    {isRevealed && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-xl text-left bg-surface-container-lowest/50 p-6 rounded-xl border border-outline-variant/10 mt-4"
                      >
                        <div className="text-[10px] font-bold text-primary tracking-widest uppercase mb-3">
                          Resposta
                        </div>
                        <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                          {selected.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!isRevealed && (
                  <div className="flex justify-center pt-8 border-t border-outline-variant/10 relative z-10">
                    <button
                      onClick={() => setIsRevealed(true)}
                      className="text-on-surface-variant hover:text-primary flex items-center gap-2 text-sm font-bold tracking-wider transition-all group/reveal"
                    >
                      <RefreshCw
                        size={18}
                        className="group-hover/reveal:rotate-180 transition-transform duration-500"
                      />
                      CLIQUE PARA REVELAR A RESPOSTA
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Control Panel (Asymmetric Stats/Controls) */}
            <div className="lg:col-span-4 space-y-6">
              <motion.div
                animate={{
                  opacity: isRevealed ? 1 : 0.5,
                  filter: isRevealed ? "none" : "grayscale(100%)",
                }}
                className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                    Avaliação
                  </h3>
                  {!isRevealed && (
                    <span className="text-[10px] text-error font-bold tracking-widest uppercase animate-pulse">
                      Aguardando Revelação
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    disabled={!isRevealed}
                    onClick={() => handleReview("again")}
                    className="w-full group flex items-center justify-between p-3 sm:p-4 rounded-xl bg-surface-container hover:bg-error/10 border border-transparent hover:border-error/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center border border-error/20">
                        <X size={16} />
                      </span>
                      <span className="font-bold text-sm tracking-wide group-hover:text-error transition-colors">
                        Difícil (Novamente)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                      Hoje
                    </span>
                  </button>

                  <button
                    disabled={!isRevealed}
                    onClick={() => handleReview("hard")}
                    className="w-full group flex items-center justify-between p-3 sm:p-4 rounded-xl bg-surface-container hover:bg-warning/10 border border-transparent hover:border-warning/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center border border-warning/20">
                        <div className="w-2 h-2 rounded-full bg-warning"></div>
                      </span>
                      <span className="font-bold text-sm tracking-wide group-hover:text-warning transition-colors">
                        Bom
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                      {Math.max(
                        1,
                        Math.ceil((selected.interval_days || 1) / 2),
                      )}
                      d INT
                    </span>
                  </button>

                  <button
                    disabled={!isRevealed}
                    onClick={() => handleReview("easy")}
                    className="w-full group flex items-center justify-between p-3 sm:p-4 rounded-xl bg-surface-container hover:bg-tertiary/10 border border-transparent hover:border-tertiary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center border border-tertiary/20">
                        <Bolt size={16} />
                      </span>
                      <span className="font-bold text-sm tracking-wide group-hover:text-tertiary transition-colors">
                        Fácil
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                      {Math.max(3, (selected.interval_days || 4) + 3)}d INT
                    </span>
                  </button>
                </div>
              </motion.div>

              <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
                    Estatísticas do Deck
                  </h3>
                  <TrendingUp size={16} className="text-secondary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/5">
                    <p className="text-[10px] text-on-surface-variant uppercase mb-1 font-bold">
                      Retenção
                    </p>
                    <p className="text-xl font-bold font-mono text-white">
                      {retentionScore}%
                    </p>
                  </div>
                  <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/5">
                    <p className="text-[10px] text-on-surface-variant uppercase mb-1 font-bold">
                      Sequência
                    </p>
                    <p className="text-xl font-bold font-mono text-white">
                      {selected.correct_streak}d
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center border border-dashed border-outline-variant/20 rounded-2xl bg-surface-container-lowest/50">
            <div className="text-center px-6">
              <Sparkles size={48} className="mx-auto text-primary/40 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Fila Vazia</h3>
              <p className="text-on-surface-variant text-sm">
                Não há flashcards nesta biblioteca. Crie um para começar a
                revisar.
              </p>
            </div>
          </div>
        )}

        {/* Bento Bottom (Context & Extras) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 relative overflow-hidden flex items-center min-h-[160px]">
            <div className="relative z-10 w-full">
              <h4 className="text-primary font-bold text-[10px] tracking-widest uppercase mb-3 flex items-center gap-2">
                <Info size={14} /> Dica & Contexto do Editor
              </h4>
              <p className="text-on-surface-variant text-sm leading-relaxed max-w-xl">
                {activeProject || activeModule || activeTrack ? (
                  <>
                    Este conceito foi derivado de
                    {activeProject ? (
                      <strong className="text-on-surface ml-1">
                        Projeto: {activeProject.project.title}
                      </strong>
                    ) : (
                      ""
                    )}
                    {activeTrack && !activeProject ? (
                      <strong className="text-on-surface ml-1">
                        Trilha: {activeTrack.track.name}
                      </strong>
                    ) : (
                      ""
                    )}
                    {activeModule ? (
                      <strong className="text-on-surface ml-1">
                        Módulo: {activeModule.title}
                      </strong>
                    ) : (
                      ""
                    )}
                    . Revisitar o contexto original ajuda a consolidar o mapa
                    mental.
                  </>
                ) : (
                  "Flashcards isolados de projetos ou trilhas perdem contexto. Tente associar os cards às suas construções na plataforma para fixação mais profunda."
                )}
              </p>
            </div>
            {/* Visual Flare right side */}
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-[radial-gradient(ellipse_at_right,rgba(129,236,255,0.08),transparent)] pointer-events-none"></div>
          </div>

          <div className="bg-surface-container p-8 rounded-2xl border border-primary/10 flex flex-col justify-center min-h-[160px] relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors"></div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={16} className="text-primary" />
                <h4 className="font-bold text-[10px] uppercase tracking-widest text-on-surface">
                  Próximo Marco
                </h4>
              </div>
              <p className="text-2xl font-black text-white font-mono">
                {Math.max(200, Math.ceil(data!.flashcards.length / 100) * 100)}{" "}
                CARDS
              </p>
              <div className="h-1.5 bg-surface-container-highest rounded-full mt-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${milestoneProgress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className="h-full bg-primary/60 rounded-full"
                ></motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Queue Drawer (List of cards) */}
        {data!.flashcards.length > 0 && (
          <div className="mt-12">
            <h3 className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-4 pl-4 border-l-2 border-primary/30">
              Próximos na Fila
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data!.flashcards
                .filter((c) => c.id !== selectedId)
                .slice(0, 6)
                .map((card) => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedId(card.id)}
                    className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/5 hover:border-outline-variant/20 p-4 rounded-xl text-left transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                        {card.deck_name || "Geral"}
                      </span>
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-on-surface-variant">
                        {formatRelativeDue(card.due_at)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                      {card.question}
                    </p>
                  </button>
                ))}
            </div>
          </div>
        )}
      </motion.main>

      <FlashcardModal
        open={open}
        onClose={() => {
          setEditing(null);
          setOpen(false);
        }}
        editing={editing}
        onSubmit={handleSubmit}
        tracks={data!.trackBlueprints}
        projects={data!.projectBundles}
      />
    </>
  );
}

function FlashcardModal({
  open,
  onClose,
  editing,
  onSubmit,
  tracks,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  editing: FlashcardRow | null;
  onSubmit: (formData: FormData) => Promise<void>;
  tracks: TrackBlueprint[];
  projects: ProjectBundle[];
}) {
  return (
    <WorkspaceModal
      title={editing ? "Editar flashcard" : "Novo flashcard"}
      subtitle="Pergunta, resposta e contexto do card na interface Cyberpulse."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <Field label="Deck">
          <TextInput
            name="deck_name"
            defaultValue={editing?.deck_name || "Geral"}
          />
        </Field>
        <Field label="Pergunta">
          <TextArea
            name="question"
            rows={3}
            defaultValue={editing?.question || ""}
          />
        </Field>
        <Field label="Resposta">
          <TextArea
            name="answer"
            rows={4}
            defaultValue={editing?.answer || ""}
          />
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
        <Field label="Módulo">
          <Select name="module_id" defaultValue={editing?.module_id || ""}>
            <option value="">Sem módulo</option>
            {tracks.flatMap((item) =>
              item.modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {item.track.name} • {module.title}
                </option>
              )),
            )}
          </Select>
        </Field>
        <Field label="Projeto">
          <Select name="project_id" defaultValue={editing?.project_id || ""}>
            <option value="">Sem projeto</option>
            {projects.map((item) => (
              <option key={item.project.id} value={item.project.id}>
                {item.project.title}
              </option>
            ))}
          </Select>
        </Field>
      </ModalForm>
    </WorkspaceModal>
  );
}

function nullable(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : null;
}
