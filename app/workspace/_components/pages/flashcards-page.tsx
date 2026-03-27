"use client";

import { useState } from "react";
import { Bolt, Check, Plus, Sparkles, Trash2 } from "lucide-react";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
  DataCard,
  EmptyState,
  Field,
  GhostButton,
  MetricCard,
  PageFrame,
  PrimaryButton,
  SectionGrid,
  Select,
  TextArea,
  TextInput,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import { formatRelativeDue, normalizedDeckName } from "@/utils/workspace/helpers";
import { LockedFeaturePage, ModalForm } from "@/app/workspace/_components/pages/shared";
import type { FlashcardRow, ProjectBundle, TrackBlueprint } from "@/utils/workspace/types";

export function FlashcardsPage() {
  const { data, saveFlashcard, deleteFlashcard, reviewFlashcard } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FlashcardRow | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(data!.flashcards[0]?.id ?? null);
  const [renderTimestamp] = useState(() => Date.now());
  const selected =
    data!.flashcards.find((item) => item.id === selectedId) ?? data!.flashcards[0] ?? null;
  const dueNow = data!.flashcards.filter(
    (item) => new Date(item.due_at).getTime() <= renderTimestamp,
  );

  if (!data!.featureAccess.flashcards) {
    return <LockedFeaturePage title="Flashcards premium bloqueados" feature="Flashcards" />;
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

  return (
    <>
      <PageFrame
        title="Flashcards"
        subtitle="Revisão ativa com decks, fila do dia e repetição espaçada baseada no mesmo algoritmo do Windows."
        actions={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Novo card
          </PrimaryButton>
        }
      >
        <SectionGrid columns={4}>
          <MetricCard label="Na fila agora" value={`${dueNow.length}`} helper="Cards vencidos" icon={<Bolt size={16} />} />
          <MetricCard label="Biblioteca" value={`${data!.flashcards.length}`} helper="Cards cadastrados" icon={<Sparkles size={16} />} />
          <MetricCard label="Já revisados" value={`${data!.flashcards.filter((item) => item.review_count > 0).length}`} helper="Biblioteca em movimento" icon={<Check size={16} />} />
          <MetricCard label="Retenção forte" value={`${data!.flashcards.filter((item) => item.correct_streak >= 3).length}`} helper="Streak consistente" icon={<Check size={16} />} />
        </SectionGrid>
        <div className="workspace-split">
          <DataCard title="Decks" subtitle="Biblioteca de revisão.">
            {data!.flashcards.length ? (
              <div className="workspace-stack">
                {data!.flashcards.map((card) => (
                  <button
                    key={card.id}
                    data-testid="flashcard-item"
                    className={
                      card.id === selected?.id
                        ? "workspace-list-item workspace-list-item--active"
                        : "workspace-list-item"
                    }
                    onClick={() => setSelectedId(card.id)}
                  >
                    <div>
                      <strong>{card.question}</strong>
                      <span>
                        {normalizedDeckName(card.deck_name)} • {formatRelativeDue(card.due_at)}
                      </span>
                    </div>
                    <span>{card.review_count}x</span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhum flashcard criado"
                subtitle="Monte o primeiro deck para revisar conceitos e comandos."
              />
            )}
          </DataCard>
          {selected ? (
            <DataCard
              title={selected.question}
              subtitle={`${normalizedDeckName(selected.deck_name)} • próxima revisão ${formatRelativeDue(selected.due_at)}`}
              actions={
                <>
                  <button
                    className="workspace-button workspace-button--ghost"
                    onClick={() => {
                      setEditing(selected);
                      setOpen(true);
                    }}
                  >
                    Editar
                  </button>
                  <GhostButton aria-label={`Excluir flashcard ${selected.question}`} title="Excluir flashcard" onClick={() => void deleteFlashcard(selected.id)}>
                    <Trash2 size={16} />
                  </GhostButton>
                </>
              }
            >
              <div className="workspace-stack">
                <div className="workspace-study-card">
                  <div>
                    <span>Pergunta</span>
                    <strong>{selected.question}</strong>
                  </div>
                  <div>
                    <span>Resposta</span>
                    <p>{selected.answer}</p>
                  </div>
                </div>
                <div className="workspace-inline-actions">
                  <button className="workspace-button workspace-button--secondary" onClick={() => void reviewFlashcard(selected, "again")}>Errei</button>
                  <button className="workspace-button workspace-button--secondary" onClick={() => void reviewFlashcard(selected, "hard")}>Difícil</button>
                  <button className="workspace-button workspace-button--primary" onClick={() => void reviewFlashcard(selected, "good")}>Bom</button>
                  <button className="workspace-button workspace-button--primary" onClick={() => void reviewFlashcard(selected, "easy")}>Fácil</button>
                </div>
              </div>
            </DataCard>
          ) : null}
        </div>
      </PageFrame>
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
      subtitle="Pergunta, resposta e contexto do card."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <Field label="Deck">
          <TextInput name="deck_name" defaultValue={editing?.deck_name || "Geral"} />
        </Field>
        <Field label="Pergunta">
          <TextArea name="question" rows={4} defaultValue={editing?.question || ""} />
        </Field>
        <Field label="Resposta">
          <TextArea name="answer" rows={5} defaultValue={editing?.answer || ""} />
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
