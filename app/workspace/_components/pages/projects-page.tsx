"use client";

import { useState } from "react";
import { Check, FileStack, GitBranch, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
  DataCard,
  EmptyState,
  Field,
  GhostButton,
  PageFrame,
  Pill,
  PrimaryButton,
  ProgressBar,
  SecondaryButton,
  Select,
  TextArea,
  TextInput,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import { labelForProjectStatus, projectCompletion } from "@/utils/workspace/helpers";
import { ModalForm } from "@/app/workspace/_components/pages/shared";
import type { ProjectRow, TrackBlueprint } from "@/utils/workspace/types";

export function ProjectsPage() {
  const { data, saveProject, deleteProject, saveProjectStep, deleteProjectStep } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    data!.projects[0]?.id ?? null,
  );
  const [stepTitle, setStepTitle] = useState("");
  const selectedBundle =
    data!.projectBundles.find((item) => item.project.id === selectedProjectId) ??
    data!.projectBundles[0] ??
    null;

  async function handleSubmit(formData: FormData) {
    await saveProject({
      id: editing?.id,
      title: formData.get("title")?.toString(),
      scope: formData.get("scope")?.toString(),
      description: formData.get("description")?.toString(),
      status: formData.get("status")?.toString() as ProjectRow["status"],
      repository_url: nullable(formData.get("repository_url")),
      documentation_url: nullable(formData.get("documentation_url")),
      video_url: nullable(formData.get("video_url")),
      track_id: nullable(formData.get("track_id")),
    });
    setOpen(false);
    setEditing(null);
  }

  return (
    <>
      <PageFrame
        title="Projetos"
        subtitle="Portfólio prático com etapas, links e ritmo de entrega, igual ao ecossistema do desktop."
        actions={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Novo projeto
          </PrimaryButton>
        }
      >
        <div className="workspace-split">
          <DataCard title="Portfólio" subtitle="Projetos do usuário atual.">
            {data!.projectBundles.length ? (
              <div className="workspace-stack">
                {data!.projectBundles.map((bundle) => (
                  <button
                    key={bundle.project.id}
                    data-testid="project-item"
                    className={
                      bundle.project.id === selectedBundle?.project.id
                        ? "workspace-list-item workspace-list-item--active"
                        : "workspace-list-item"
                    }
                    onClick={() => setSelectedProjectId(bundle.project.id)}
                  >
                    <div>
                      <strong>{bundle.project.title}</strong>
                      <span>
                        {labelForProjectStatus(bundle.project.status)} • {bundle.steps.length} etapa(s)
                      </span>
                    </div>
                    <Pill tone="primary">{projectCompletion(bundle).toFixed(0)}%</Pill>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sem projetos"
                subtitle="Crie um projeto para transformar estudo em entrega prática."
              />
            )}
          </DataCard>

          {selectedBundle ? (
            <div className="workspace-stack">
              <DataCard
                title={selectedBundle.project.title}
                subtitle={selectedBundle.project.scope}
                actions={
                  <>
                    <SecondaryButton
                      onClick={() => {
                        setEditing(selectedBundle.project);
                        setOpen(true);
                      }}
                    >
                      Editar
                    </SecondaryButton>
                    <GhostButton aria-label={`Excluir projeto ${selectedBundle.project.title}`} title="Excluir projeto" onClick={() => void deleteProject(selectedBundle.project.id)}>
                      <Trash2 size={16} />
                    </GhostButton>
                  </>
                }
              >
                <div className="workspace-stack">
                  <p className="workspace-copy-muted">{selectedBundle.project.description}</p>
                  <ProgressBar value={projectCompletion(selectedBundle)} />
                  <div className="workspace-inline-actions">
                    {selectedBundle.project.repository_url ? (
                      <SecondaryButton
                        onClick={() => window.open(selectedBundle.project.repository_url!, "_blank")}
                      >
                        <GitBranch size={16} />
                        Repositório
                      </SecondaryButton>
                    ) : null}
                    {selectedBundle.project.documentation_url ? (
                      <SecondaryButton
                        onClick={() =>
                          window.open(selectedBundle.project.documentation_url!, "_blank")
                        }
                      >
                        <FileStack size={16} />
                        Documentação
                      </SecondaryButton>
                    ) : null}
                  </div>
                </div>
              </DataCard>

              <DataCard title="Etapas" subtitle="Checklist operacional do projeto.">
                <div className="workspace-inline-actions">
                  <TextInput
                    value={stepTitle}
                    onChange={(event) => setStepTitle(event.target.value)}
                    placeholder="Adicionar etapa"
                  />
                  <PrimaryButton
                    aria-label="Adicionar etapa"
                    title="Adicionar etapa"
                    onClick={() => {
                      if (!stepTitle.trim()) return;
                      void saveProjectStep({
                        project_id: selectedBundle.project.id,
                        title: stepTitle.trim(),
                        description: "",
                        is_done: false,
                      });
                      setStepTitle("");
                    }}
                  >
                    <Plus size={16} />
                  </PrimaryButton>
                </div>
                {selectedBundle.steps.length ? (
                  <div className="workspace-stack">
                    {selectedBundle.steps.map((step) => (
                      <div key={step.id} className="workspace-row-card" data-testid="project-step-row">
                        <div>
                          <strong>{step.title}</strong>
                          <span>{step.description || "Etapa operacional do projeto."}</span>
                        </div>
                        <div className="workspace-inline-actions">
                          <GhostButton
                            aria-label={step.is_done ? `Reabrir etapa ${step.title}` : `Concluir etapa ${step.title}`}
                            title={step.is_done ? "Reabrir etapa" : "Concluir etapa"}
                            onClick={() =>
                              void saveProjectStep({
                                id: step.id,
                                project_id: step.project_id,
                                is_done: !step.is_done,
                                completed_at: !step.is_done ? new Date().toISOString() : null,
                              })
                            }
                          >
                            <Check size={16} />
                          </GhostButton>
                          <GhostButton aria-label={`Excluir etapa ${step.title}`} title="Excluir etapa" onClick={() => void deleteProjectStep(step.id)}>
                            <Trash2 size={16} />
                          </GhostButton>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Sem etapas ainda"
                    subtitle="Adicione a primeira etapa para guiar a execução do projeto."
                  />
                )}
              </DataCard>
            </div>
          ) : null}
        </div>
      </PageFrame>
      <ProjectModal
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

function ProjectModal({
  open,
  onClose,
  editing,
  onSubmit,
  tracks,
}: {
  open: boolean;
  onClose: () => void;
  editing: ProjectRow | null;
  onSubmit: (formData: FormData) => Promise<void>;
  tracks: TrackBlueprint[];
}) {
  return (
    <WorkspaceModal
      title={editing ? "Editar projeto" : "Novo projeto"}
      subtitle="Monte o item do portfólio com status e links."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <Field label="Título">
          <TextInput name="title" defaultValue={editing?.title || ""} />
        </Field>
        <Field label="Escopo">
          <TextInput name="scope" defaultValue={editing?.scope || ""} />
        </Field>
        <Field label="Descrição">
          <TextArea name="description" rows={5} defaultValue={editing?.description || ""} />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={editing?.status || "planned"}>
            <option value="planned">Planejado</option>
            <option value="active">Ativo</option>
            <option value="blocked">Bloqueado</option>
            <option value="completed">Concluído</option>
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
        <Field label="Repositório">
          <TextInput name="repository_url" defaultValue={editing?.repository_url || ""} />
        </Field>
        <Field label="Documentação">
          <TextInput name="documentation_url" defaultValue={editing?.documentation_url || ""} />
        </Field>
        <Field label="Vídeo">
          <TextInput name="video_url" defaultValue={editing?.video_url || ""} />
        </Field>
      </ModalForm>
    </WorkspaceModal>
  );
}

function nullable(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : null;
}
