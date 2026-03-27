"use client";

import { useState } from "react";
import { AlertTriangle, Check, Clock3, Plus, Repeat2, Trash2 } from "lucide-react";
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
import { labelForReviewStatus } from "@/utils/workspace/helpers";
import { ModalForm, nullable, toDatetimeLocal } from "@/app/workspace/_components/pages/shared";
import type { ReviewRow, TrackBlueprint } from "@/utils/workspace/types";

export function ReviewsPage() {
  const { data, saveReview, deleteReview } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReviewRow | null>(null);

  async function handleSubmit(formData: FormData) {
    await saveReview({
      id: editing?.id,
      title: formData.get("title")?.toString(),
      scheduled_for: new Date(formData.get("scheduled_for")?.toString() || new Date()).toISOString(),
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
      <PageFrame
        title="Revisões"
        subtitle="Ciclos D+1, D+7, D+15 e D+30 para manter retenção real no produto web."
        actions={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Nova revisão
          </PrimaryButton>
        }
      >
        <SectionGrid columns={4}>
          <MetricCard
            label="Pendentes"
            value={`${data!.reviews.filter((item) => item.status === "pending").length}`}
            helper="Na fila atual"
            icon={<Repeat2 size={16} />}
          />
          <MetricCard
            label="Atrasadas"
            value={`${data!.reviews.filter((item) => item.status === "overdue").length}`}
            helper="Pedindo atenção"
            icon={<AlertTriangle size={16} />}
          />
          <MetricCard
            label="Concluídas"
            value={`${data!.reviews.filter((item) => item.status === "completed").length}`}
            helper="Retenção fechada"
            icon={<Check size={16} />}
          />
          <MetricCard
            label="Próxima data"
            value={data!.reviews[0] ? new Date(data!.reviews[0].scheduled_for).toLocaleDateString("pt-BR") : "--"}
            helper="Agenda mais próxima"
            icon={<Clock3 size={16} />}
          />
        </SectionGrid>
        <div className="workspace-stack">
          {data!.reviews.map((review) => (
            <div key={review.id} className="workspace-row-card" data-testid="review-row">
              <div>
                <strong>{review.title}</strong>
                <span>
                  {review.interval_label} • {labelForReviewStatus(review.status)} •{" "}
                  {new Date(review.scheduled_for).toLocaleString("pt-BR")}
                </span>
                {review.notes ? <p>{review.notes}</p> : null}
              </div>
              <div className="workspace-inline-actions">
                {review.status !== "completed" ? (
                  <button
                    className="workspace-button workspace-button--secondary"
                    onClick={() =>
                      void saveReview({
                        id: review.id,
                        status: "completed",
                        completed_at: new Date().toISOString(),
                      })
                    }
                  >
                    Concluir
                  </button>
                ) : null}
                <button
                  className="workspace-button workspace-button--ghost"
                  onClick={() => {
                    setEditing(review);
                    setOpen(true);
                  }}
                >
                  Editar
                </button>
                <GhostButton aria-label={`Excluir revisão ${review.title}`} title="Excluir revisão" onClick={() => void deleteReview(review.id)}>
                  <Trash2 size={16} />
                </GhostButton>
              </div>
            </div>
          ))}
        </div>
      </PageFrame>
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
          <TextInput name="interval_label" defaultValue={editing?.interval_label || "D+1"} />
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
