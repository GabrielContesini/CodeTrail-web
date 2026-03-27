"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
  DataCard,
  EmptyState,
  Field,
  GhostButton,
  PageFrame,
  Pill,
  PrimaryButton,
  SecondaryButton,
  Select,
  TextArea,
  TextInput,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import {
  decodeNoteContent,
  emptyNoteContext,
  encodeNoteContent,
  noteReadingMinutes,
  noteWordCount,
} from "@/utils/workspace/helpers";
import { ModalForm } from "@/app/workspace/_components/pages/shared";
import type { NoteContextLink, ProjectBundle, StudyNoteRow, TrackBlueprint } from "@/utils/workspace/types";

export function NotesPage() {
  const { data, saveNote, deleteNote } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudyNoteRow | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(data!.notes[0]?.id ?? null);
  const selected = data!.notes.find((item) => item.id === selectedId) ?? data!.notes[0] ?? null;
  const document = selected ? decodeNoteContent(selected.content) : null;

  async function handleSubmit(formData: FormData) {
    const track = data!.trackBlueprints.find(
      (item) => item.track.id === nullable(formData.get("track_id")),
    );
    const selectedModule = data!.trackBlueprints
      .flatMap((item) => item.modules)
      .find((item) => item.id === nullable(formData.get("module_id")));
    const project = data!.projectBundles.find(
      (item) => item.project.id === nullable(formData.get("project_id")),
    );

    const context: NoteContextLink = {
      trackId: track?.track.id ?? null,
      trackLabel: track?.track.name ?? null,
      moduleId: selectedModule?.id ?? null,
      moduleLabel: selectedModule?.title ?? null,
      projectId: project?.project.id ?? null,
      projectLabel: project?.project.title ?? null,
    };

    await saveNote({
      id: editing?.id,
      folder_name: formData.get("folder_name")?.toString() || "Geral",
      title: formData.get("title")?.toString(),
      content: encodeNoteContent(formData.get("content")?.toString() || "", context),
    });
    setEditing(null);
    setOpen(false);
  }

  return (
    <>
      <PageFrame
        title="Notas"
        subtitle="Cadernos, páginas e resumos em uma base viva ligada à trilha, módulo e projeto."
        actions={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Nova nota
          </PrimaryButton>
        }
      >
        <div className="workspace-split">
          <DataCard title="Biblioteca" subtitle="Notas registradas no seu workspace.">
            {data!.notes.length ? (
              <div className="workspace-stack">
                {data!.notes.map((note) => (
                  <button
                    key={note.id}
                    data-testid="note-item"
                    className={
                      note.id === selected?.id
                        ? "workspace-list-item workspace-list-item--active"
                        : "workspace-list-item"
                    }
                    onClick={() => setSelectedId(note.id)}
                  >
                    <div>
                      <strong>{note.title}</strong>
                      <span>
                        {note.folder_name} • {noteWordCount(note)} palavras
                      </span>
                    </div>
                    <Pill tone="neutral">{decodeNoteContent(note.content).labels[0] || "Sem contexto"}</Pill>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhuma nota criada"
                subtitle="Crie seu primeiro caderno para guardar resumos e checkpoints."
              />
            )}
          </DataCard>
          {selected && document ? (
            <div className="workspace-stack">
              <DataCard
                title={selected.title}
                subtitle={`${selected.folder_name} • atualizado em ${new Date(selected.updated_at).toLocaleString("pt-BR")}`}
                actions={
                  <>
                    <SecondaryButton
                      onClick={() => {
                        setEditing(selected);
                        setOpen(true);
                      }}
                    >
                      Editar
                    </SecondaryButton>
                    <GhostButton aria-label={`Excluir nota ${selected.title}`} title="Excluir nota" onClick={() => void deleteNote(selected.id)}>
                      <Trash2 size={16} />
                    </GhostButton>
                  </>
                }
              >
                <div className="workspace-stack">
                  <div className="workspace-inline-actions">
                    {document.labels.map((label) => (
                      <Pill key={label}>{label}</Pill>
                    ))}
                    <Pill tone="warning">{noteReadingMinutes(selected)} min de leitura</Pill>
                  </div>
                  <pre className="workspace-note-paper">{document.body}</pre>
                </div>
              </DataCard>
            </div>
          ) : null}
        </div>
      </PageFrame>
      <NoteModal
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

function NoteModal({
  open,
  onClose,
  editing,
  onSubmit,
  tracks,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  editing: StudyNoteRow | null;
  onSubmit: (formData: FormData) => Promise<void>;
  tracks: TrackBlueprint[];
  projects: ProjectBundle[];
}) {
  const parsed = editing ? decodeNoteContent(editing.content) : { body: "", context: emptyNoteContext() };
  return (
    <WorkspaceModal
      title={editing ? "Editar nota" : "Nova nota"}
      subtitle="Página de caderno ligada a contexto de trilha, módulo e projeto."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <Field label="Pasta">
          <TextInput name="folder_name" defaultValue={editing?.folder_name || "Geral"} />
        </Field>
        <Field label="Título">
          <TextInput name="title" defaultValue={editing?.title || ""} />
        </Field>
        <Field label="Trilha">
          <Select name="track_id" defaultValue={parsed.context.trackId || ""}>
            <option value="">Sem trilha</option>
            {tracks.map((item) => (
              <option key={item.track.id} value={item.track.id}>
                {item.track.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Módulo">
          <Select name="module_id" defaultValue={parsed.context.moduleId || ""}>
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
          <Select name="project_id" defaultValue={parsed.context.projectId || ""}>
            <option value="">Sem projeto</option>
            {projects.map((item) => (
              <option key={item.project.id} value={item.project.id}>
                {item.project.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Conteúdo">
          <TextArea name="content" rows={12} defaultValue={parsed.body} />
        </Field>
      </ModalForm>
    </WorkspaceModal>
  );
}

function nullable(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : null;
}
