"use client";

import { useState } from "react";
import { BookOpen, Bolt, Clock3, Plus, Target, Trash2 } from "lucide-react";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
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
import { formatHours, labelForSessionType } from "@/utils/workspace/helpers";
import { ModalForm, toDatetimeLocal } from "@/app/workspace/_components/pages/shared";
import type { StudySessionRow, TrackBlueprint } from "@/utils/workspace/types";

export function SessionsPage() {
  const { data, saveSession, deleteSession } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudySessionRow | null>(null);

  async function handleSubmit(formData: FormData) {
    const start = formData.get("start_time")?.toString() || new Date().toISOString();
    const duration = Number(formData.get("duration_minutes") || 50);
    await saveSession({
      id: editing?.id,
      track_id: nullable(formData.get("track_id")),
      type: (formData.get("type")?.toString() as StudySessionRow["type"]) || "practice",
      start_time: new Date(start).toISOString(),
      duration_minutes: duration,
      notes: formData.get("notes")?.toString() || "",
      productivity_score: Number(formData.get("productivity_score") || 4),
    });
    setOpen(false);
    setEditing(null);
  }

  return (
    <>
      <PageFrame
        title="Sessões"
        subtitle="Cronômetro, histórico e blocos de foco com contexto real, usando as mesmas tabelas do desktop."
        actions={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Nova sessão
          </PrimaryButton>
        }
      >
        <SectionGrid columns={4}>
          <MetricCard
            label="Total de sessões"
            value={`${data!.sessions.length}`}
            helper="Histórico consolidado"
            icon={<Clock3 size={16} />}
          />
          <MetricCard
            label="Horas registradas"
            value={formatHours(
              data!.sessions.reduce((sum, item) => sum + item.duration_minutes, 0) / 60,
            )}
            helper="Volume total estudado"
            icon={<Bolt size={16} />}
          />
          <MetricCard
            label="Média de foco"
            value={`${(
              data!.sessions.reduce((sum, item) => sum + item.productivity_score, 0) /
              (data!.sessions.length || 1)
            ).toFixed(1)}`}
            helper="Produtividade média"
            icon={<Target size={16} />}
          />
          <MetricCard
            label="Última sessão"
            value={data!.sessions[0] ? new Date(data!.sessions[0].start_time).toLocaleDateString("pt-BR") : "--"}
            helper="Recência da atividade"
            icon={<BookOpen size={16} />}
          />
        </SectionGrid>

        <div className="workspace-stack">
          {data!.sessions.map((session) => (
            <div key={session.id} className="workspace-row-card" data-testid="session-row">
              <div>
                <strong>{labelForSessionType(session.type)}</strong>
                <span>
                  {new Date(session.start_time).toLocaleString("pt-BR")} •{" "}
                  {session.duration_minutes} min • produtividade {session.productivity_score}/5
                </span>
                {session.notes ? <p>{session.notes}</p> : null}
              </div>
              <div className="workspace-inline-actions">
                <button
                  className="workspace-button workspace-button--ghost"
                  onClick={() => {
                    setEditing(session);
                    setOpen(true);
                  }}
                >
                  Editar
                </button>
                <GhostButton aria-label={`Excluir sessão ${session.id}`} title="Excluir sessão" onClick={() => void deleteSession(session.id)}>
                  <Trash2 size={16} />
                </GhostButton>
              </div>
            </div>
          ))}
        </div>
      </PageFrame>

      <SessionModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSubmit={handleSubmit}
        tracks={data!.trackBlueprints}
      />
    </>
  );
}

function SessionModal({
  open,
  onClose,
  editing,
  onSubmit,
  tracks,
}: {
  open: boolean;
  onClose: () => void;
  editing: StudySessionRow | null;
  onSubmit: (formData: FormData) => Promise<void>;
  tracks: TrackBlueprint[];
}) {
  return (
    <WorkspaceModal
      title={editing ? "Editar sessão" : "Nova sessão"}
      subtitle="Registre o bloco de foco com contexto da trilha."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <Field label="Tipo">
          <Select name="type" defaultValue={editing?.type || "practice"}>
            <option value="theory">Teoria</option>
            <option value="practice">Prática</option>
            <option value="review">Revisão</option>
            <option value="project">Projeto</option>
            <option value="exercises">Exercícios</option>
          </Select>
        </Field>
        <Field label="Início">
          <TextInput
            name="start_time"
            type="datetime-local"
            defaultValue={toDatetimeLocal(editing?.start_time)}
          />
        </Field>
        <Field label="Duração (min)">
          <TextInput
            name="duration_minutes"
            type="number"
            min={5}
            defaultValue={editing?.duration_minutes || 50}
          />
        </Field>
        <Field label="Produtividade">
          <TextInput
            name="productivity_score"
            type="number"
            min={1}
            max={5}
            defaultValue={editing?.productivity_score || 4}
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
        <Field label="Notas">
          <TextArea name="notes" rows={6} defaultValue={editing?.notes || ""} />
        </Field>
      </ModalForm>
    </WorkspaceModal>
  );
}

function nullable(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : null;
}
