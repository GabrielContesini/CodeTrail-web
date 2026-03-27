"use client";

import { useState } from "react";
import { AlertTriangle, Check, CheckSquare, Clock3, Plus, Trash2 } from "lucide-react";
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
import { labelForTaskPriority, labelForTaskStatus } from "@/utils/workspace/helpers";
import { ModalForm, nullable, nullableDate, toDatetimeLocal } from "@/app/workspace/_components/pages/shared";
import type { TaskRow, TrackBlueprint } from "@/utils/workspace/types";

export function TasksPage() {
  const { data, saveTask, deleteTask } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);

  async function handleSubmit(formData: FormData) {
    await saveTask({
      id: editing?.id,
      title: formData.get("title")?.toString(),
      description: formData.get("description")?.toString(),
      priority: formData.get("priority")?.toString() as TaskRow["priority"],
      status: formData.get("status")?.toString() as TaskRow["status"],
      due_date: nullableDate(formData.get("due_date")),
      track_id: nullable(formData.get("track_id")),
    });
    setEditing(null);
    setOpen(false);
  }

  return (
    <>
      <PageFrame
        title="Tarefas"
        subtitle="Planejamento, execução e prioridade no mesmo fluxo visual do desktop."
        actions={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Nova tarefa
          </PrimaryButton>
        }
      >
        <SectionGrid columns={4}>
          <MetricCard
            label="Pendentes"
            value={`${data!.tasks.filter((item) => item.status === "pending").length}`}
            helper="Aguardando ação"
            icon={<CheckSquare size={16} />}
          />
          <MetricCard
            label="Em andamento"
            value={`${data!.tasks.filter((item) => item.status === "in_progress").length}`}
            helper="Execução atual"
            icon={<Clock3 size={16} />}
          />
          <MetricCard
            label="Concluídas"
            value={`${data!.tasks.filter((item) => item.status === "completed").length}`}
            helper="Finalizadas"
            icon={<Check size={16} />}
          />
          <MetricCard
            label="Críticas"
            value={`${data!.tasks.filter((item) => item.priority === "critical").length}`}
            helper="Maior prioridade"
            icon={<AlertTriangle size={16} />}
          />
        </SectionGrid>

        <div className="workspace-stack">
          {data!.tasks.map((task) => (
            <div key={task.id} className="workspace-row-card" data-testid="task-row">
              <div>
                <strong>{task.title}</strong>
                <span>
                  {labelForTaskPriority(task.priority)} • {labelForTaskStatus(task.status)}
                </span>
                {task.description ? <p>{task.description}</p> : null}
              </div>
              <div className="workspace-inline-actions">
                {task.status !== "completed" ? (
                  <button
                    className="workspace-button workspace-button--secondary"
                    onClick={() =>
                      void saveTask({
                        id: task.id,
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
                    setEditing(task);
                    setOpen(true);
                  }}
                >
                  Editar
                </button>
                <GhostButton aria-label={`Excluir tarefa ${task.title}`} title="Excluir tarefa" onClick={() => void deleteTask(task.id)}>
                  <Trash2 size={16} />
                </GhostButton>
              </div>
            </div>
          ))}
        </div>
      </PageFrame>
      <TaskModal
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

function TaskModal({
  open,
  onClose,
  editing,
  onSubmit,
  tracks,
}: {
  open: boolean;
  onClose: () => void;
  editing: TaskRow | null;
  onSubmit: (formData: FormData) => Promise<void>;
  tracks: TrackBlueprint[];
}) {
  return (
    <WorkspaceModal
      title={editing ? "Editar tarefa" : "Nova tarefa"}
      subtitle="Defina a próxima ação com prioridade e prazo."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <Field label="Título">
          <TextInput name="title" defaultValue={editing?.title || ""} />
        </Field>
        <Field label="Descrição">
          <TextArea name="description" rows={5} defaultValue={editing?.description || ""} />
        </Field>
        <Field label="Prioridade">
          <Select name="priority" defaultValue={editing?.priority || "medium"}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={editing?.status || "pending"}>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em andamento</option>
            <option value="completed">Concluída</option>
          </Select>
        </Field>
        <Field label="Prazo">
          <TextInput name="due_date" type="datetime-local" defaultValue={toDatetimeLocal(editing?.due_date)} />
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
      </ModalForm>
    </WorkspaceModal>
  );
}
