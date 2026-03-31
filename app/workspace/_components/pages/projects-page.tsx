"use client";

import {
    fadeUpVariants,
    useMotionPreferences,
} from "@/app/components/ui/motion-system";
import { FeedbackMessage } from "@/app/components/ui/system-primitives";
import { ModalForm } from "@/app/workspace/_components/pages/shared";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
    Field,
    Select,
    TextArea,
    TextInput,
    WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import {
    labelForProjectStatus,
    projectCompletion,
} from "@/utils/workspace/helpers";
import type {
    ProjectBundle,
    ProjectRow,
    TrackBlueprint,
} from "@/utils/workspace/types";
import { motion } from "framer-motion";
import {
    Check,
    ExternalLink,
    FileStack,
    FolderGit2,
    GitBranch,
    Pencil,
    Plus,
    TerminalSquare,
    Trash2,
} from "lucide-react";
import { useState } from "react";

export function ProjectsPage() {
  const {
    data,
    saveProject,
    deleteProject,
    saveProjectStep,
    deleteProjectStep,
  } = useWorkspace();
  const { reduced } = useMotionPreferences();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    data!.projectBundles[0]?.project.id ?? null,
  );
  const [stepTitle, setStepTitle] = useState("");
  const selectedBundle =
    data!.projectBundles.find(
      (item) => item.project.id === selectedProjectId,
    ) ??
    data!.projectBundles[0] ??
    null;

  const hasGithubIntegration = data!.projectBundles.some(
    (bundle) => bundle.project.repository_url,
  );

  async function handleGitHubConnect() {
    if (!githubRepoUrl.trim()) return;
    
    const url = githubRepoUrl.trim();
    const isValidGitHubUrl = url.includes("github.com");
    
    if (!isValidGitHubUrl) {
      setFormError("Por favor, insira uma URL válida do GitHub");
      return;
    }

    if (selectedBundle) {
      await saveProject({
        ...selectedBundle.project,
        repository_url: url,
      });
    }
    setGithubModalOpen(false);
    setGithubRepoUrl("");
  }

  async function handleSubmit(formData: FormData) {
    const nextProjectId = editing?.id ?? crypto.randomUUID();
    const payload = {
      id: nextProjectId,
      title: formData.get("title")?.toString(),
      scope: formData.get("scope")?.toString(),
      description: formData.get("description")?.toString(),
      status: formData.get("status")?.toString() as ProjectRow["status"],
      repository_url: nullable(formData.get("repository_url")),
      documentation_url: nullable(formData.get("documentation_url")),
      video_url: nullable(formData.get("video_url")),
      track_id: nullable(formData.get("track_id")),
    };

    setFormError(null);

    try {
      await saveProject(payload);
      setSelectedProjectId(nextProjectId);
      setOpen(false);
      setEditing(null);
    } catch (error) {
      setFormError(mapProjectFormError(error));
    }
  }

  return (
    <>
      <motion.main
        initial="hidden"
        animate="visible"
        variants={fadeUpVariants(reduced, 18)}
        className="w-full max-w-7xl mx-auto space-y-8"
      >
        {/* Header Section */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-8 bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                Centro de Comando de Projetos
              </span>
            </div>
            <h1 className="mb-2 text-5xl font-black tracking-tighter text-on-surface">
              Projetos Ativos
            </h1>
            <p className="max-w-md text-on-surface-variant text-sm">
              Portfólio prático com ritmo de entrega, links de execução e banco
              operacional.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setEditing(null);
                setFormError(null);
                setOpen(true);
              }}
              className="flex items-center gap-3 rounded-full bg-gradient-to-br from-primary to-primary-container px-8 py-4 text-sm font-black uppercase tracking-widest text-on-primary-fixed shadow-[0_0_30px_rgba(0,227,253,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={18} className="fill-current" />
              Novo Projeto
            </button>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Repositories List (Left 8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {data!.projectBundles.length ? (
              data!.projectBundles.map((bundle) => {
                const isSelected =
                  bundle.project.id === selectedBundle?.project.id;
                const completion = projectCompletion(bundle);
                return (
                  <div
                    key={bundle.project.id}
                    onClick={() => setSelectedProjectId(bundle.project.id)}
                    className={`group cursor-pointer rounded-xl border p-6 transition-all ${
                      isSelected
                        ? "border-primary/40 bg-surface-container shadow-[0_0_30px_rgba(129,236,255,0.08)]"
                        : "border-white/5 bg-surface-container hover:border-primary/20"
                    }`}
                  >
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex gap-4">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-colors ${
                            isSelected
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-white/10 bg-surface-container-highest text-on-surface-variant group-hover:border-primary/40 group-hover:text-primary"
                          }`}
                        >
                          <TerminalSquare size={24} />
                        </div>
                        <div className="min-w-0">
                          <h3
                            className={`mb-1 truncate text-lg font-bold tracking-tight transition-colors ${
                              isSelected
                                ? "text-primary"
                                : "text-on-surface group-hover:text-primary"
                            }`}
                          >
                            {bundle.project.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-on-surface-variant">
                            <span className="flex items-center gap-1 text-primary">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                              {labelForProjectStatus(bundle.project.status)}
                            </span>
                            <span className="opacity-50">•</span>
                            <span className="truncate">
                              {bundle.project.scope || "Escopo livre"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(bundle.project);
                            setOpen(true);
                          }}
                          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                      </div>
                    </div>

                    {/* Details visible only when selected */}
                    {isSelected && (
                      <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
                        <p className="mb-6 text-sm text-on-surface-variant text-balance leading-relaxed">
                          {bundle.project.description ||
                            "Nenhuma descrição fornecida."}
                        </p>

                        <div className="mb-6 flex h-24 items-end gap-1 px-2">
                          {buildActivityBars(bundle).map((height, index) => (
                            <div
                              key={index}
                              className={`flex-1 rounded-t-sm transition-all duration-500 ${
                                index === 7
                                  ? "bg-primary shadow-[0_0_15px_rgba(129,236,255,0.4)]"
                                  : "bg-surface-container-highest group-hover:bg-primary/20"
                              }`}
                              style={{ height: `${height}%` }}
                            />
                          ))}
                        </div>

                        <div className="grid gap-4 border-t border-white/5 py-4 sm:grid-cols-3 w-full">
                          <div className="flex flex-col">
                            <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                              Tarefas Abertas
                            </span>
                            <span className="font-mono text-lg text-on-surface">
                              {bundle.steps
                                .filter((item) => !item.is_done)
                                .length.toString()
                                .padStart(2, "0")}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                              Concluídas
                            </span>
                            <span className="font-mono text-lg text-primary">
                              {bundle.steps
                                .filter((item) => item.is_done)
                                .length.toString()
                                .padStart(2, "0")}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                              Score de Saúde
                            </span>
                            <span className="font-mono text-lg text-on-surface">
                              {Math.max(
                                62,
                                Math.round(
                                  100 -
                                    bundle.steps.filter((item) => !item.is_done)
                                      .length *
                                      3.5,
                                ),
                              )}
                              %
                            </span>
                          </div>
                        </div>

                        {/* Quick Links */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {bundle.project.repository_url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  bundle.project.repository_url!,
                                  "_blank",
                                );
                              }}
                              className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-container-highest px-4 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-white/10"
                            >
                              <GitBranch size={14} /> Repositório
                            </button>
                          )}
                          {bundle.project.documentation_url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  bundle.project.documentation_url!,
                                  "_blank",
                                );
                              }}
                              className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-container-highest px-4 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-white/10"
                            >
                              <FileStack size={14} /> Docs
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(bundle.project.id);
                            }}
                            className="ml-auto flex items-center gap-2 rounded-full border border-error/20 bg-error/5 px-4 py-2 text-xs font-semibold text-error transition-colors hover:bg-error/20"
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Not Selected progress bar styling */}
                    {!isSelected && (
                      <>
                        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                          <div
                            className="h-full rounded-full bg-primary shadow-[0_0_8px_rgba(129,236,255,0.6)]"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <div className="grid gap-4 border-t border-white/5 pt-4 opacity-60 sm:grid-cols-3">
                          <div className="flex flex-col">
                            <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                              Atualização
                            </span>
                            <span className="font-mono text-sm text-on-surface">
                              {new Date(
                                bundle.project.updated_at,
                              ).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                              Progresso
                            </span>
                            <span className="font-mono text-sm text-primary">
                              {completion.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-surface-container">
                <TerminalSquare size={48} className="mb-4 opacity-20" />
                <p className="text-on-surface-variant">
                  Nenhum projeto cadastrado.
                </p>
              </div>
            )}

            {/* Etapas / Tasks list for the Selected Bundle */}
            {selectedBundle && (
              <div className="rounded-xl border border-white/5 bg-surface-container p-6 animate-in slide-in-from-bottom-4 fade-in">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-on-surface">
                    Detalhamento de Tarefas
                  </h3>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {selectedBundle.steps.filter((s) => s.is_done).length} /{" "}
                    {selectedBundle.steps.length} Feitas
                  </span>
                </div>

                <div className="mb-6 flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-lg border border-white/10 bg-surface-container-highest px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="Adicionar nova tarefa..."
                    value={stepTitle}
                    onChange={(e) => setStepTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && stepTitle.trim()) {
                        void saveProjectStep({
                          project_id: selectedBundle.project.id,
                          title: stepTitle.trim(),
                          description: "",
                          is_done: false,
                        });
                        setStepTitle("");
                      }
                    }}
                  />
                  <button
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
                    className="flex items-center justify-center rounded-lg bg-primary/20 px-4 py-2.5 text-primary transition-colors hover:bg-primary/30"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {selectedBundle.steps.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {selectedBundle.steps.map((step) => (
                      <div
                        key={step.id}
                        className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors ${
                          step.is_done
                            ? "border-success/20 bg-success/5"
                            : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex flex-1 items-center gap-3 min-w-0">
                          <button
                            onClick={() =>
                              void saveProjectStep({
                                id: step.id,
                                project_id: step.project_id,
                                is_done: !step.is_done,
                                completed_at: !step.is_done
                                  ? new Date().toISOString()
                                  : null,
                              })
                            }
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              step.is_done
                                ? "bg-success text-background"
                                : "border-2 border-on-surface-variant text-transparent hover:border-primary"
                            }`}
                          >
                            {step.is_done && (
                              <Check size={12} strokeWidth={3} />
                            )}
                          </button>
                          <span
                            className={`truncate text-sm ${step.is_done ? "text-on-surface-variant line-through" : "text-on-surface font-medium"}`}
                          >
                            {step.title}
                          </span>
                        </div>
                        <button
                          onClick={() => void deleteProjectStep(step.id)}
                          className="shrink-0 text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100 hover:text-error md:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-on-surface-variant">
                    Nenhuma tarefa definida. Divida seu projeto em etapas para
                    começar.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Content (Right 4 cols) */}
          <div className="space-y-6 lg:col-span-4">
            {/* Current Sprint Card */}
            <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-surface-container-high p-6 shadow-xl w-full">
              <div className="absolute -mr-16 -mt-16 right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Sprint Ativo
              </h3>
              {selectedBundle ? (
                <>
                  <div className="mb-6">
                    <div className="mb-2 flex items-end justify-between gap-2 overflow-hidden">
                      <span className="text-xl sm:text-2xl font-black text-on-surface truncate">
                        Sprint Ativo
                      </span>
                      <span className="font-mono text-xs text-on-surface-variant whitespace-nowrap">
                        {Math.max(3, selectedBundle.steps.length + 4)}d
                        restantes
                      </span>
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-on-surface-variant">
                      Objetivo: Entrega e refinamento técnico de{" "}
                      {selectedBundle.project.title}.
                    </p>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-container"
                        style={{
                          width: `${projectCompletion(selectedBundle)}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between font-mono text-[10px] text-on-surface-variant">
                      <span>
                        {projectCompletion(selectedBundle).toFixed(0)}%
                        CONCLUÍDO
                      </span>
                      <span>
                        {selectedBundle.steps.filter((s) => s.is_done).length}/
                        {selectedBundle.steps.length} TAREFAS
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {selectedBundle.steps.slice(0, 4).map((step, idx) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 min-w-0 ${
                          step.is_done
                            ? "border-white/5 bg-white/5 text-on-surface"
                            : idx === 0
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-white/5 bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {step.is_done ? (
                          <Check size={16} className="text-success shrink-0" />
                        ) : idx === 0 ? (
                          <div className="h-2 w-2 animate-pulse rounded-full bg-primary shrink-0" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-on-surface-variant/30 shrink-0" />
                        )}
                        <span className="truncate text-xs font-medium">
                          {step.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  Selecione um projeto para ver o sprint.
                </p>
              )}
            </div>

            {/* Terminal Console */}
            <div className="flex h-[320px] w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-surface-container">
              <div className="flex items-center justify-between border-b border-white/5 bg-surface-variant px-4 py-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Logs do Sistema
                </span>
                <TerminalSquare
                  size={14}
                  className="text-on-surface-variant shrink-0"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1 overflow-y-auto w-full p-4 font-mono text-[11px] leading-relaxed">
                {buildProjectLogLines(selectedBundle).map((line, idx) => (
                  <div
                    key={idx}
                    className="text-on-surface-variant break-all sm:break-normal"
                  >
                    <span className="text-primary mr-2 font-semibold">
                      [
                      {new Date().toLocaleTimeString("pt-BR", {
                        hour12: false,
                      })}
                      ]
                    </span>{" "}
                    {line}
                  </div>
                ))}
                <div className="pt-2 text-on-surface-variant">
                  _{" "}
                  <span className="inline-block h-4 w-2 animate-pulse align-middle bg-primary" />
                </div>
              </div>
            </div>

            {/* GitHub Integration */}
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-outline-variant/30 bg-surface-container p-8 text-center sm:hidden md:flex">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-highest">
                <ExternalLink size={24} className="text-on-surface-variant" />
              </div>
              <h4 className="mb-2 font-bold text-on-surface">
                Integração GitHub
              </h4>
              <p className="mb-6 text-xs text-on-surface-variant">
                {hasGithubIntegration 
                  ? "Você possui repositórios conectados ao CodeTrail."
                  : "Conecte sua organização do GitHub para sincronizar repositórios e automatizar seu fluxo de trabalho."}
              </p>
              <button
                onClick={() => setGithubModalOpen(true)}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-xs font-bold transition-all ${
                  hasGithubIntegration 
                    ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
                    : "border-white/5 bg-surface-bright text-on-surface hover:border-primary/50"
                }`}
              >
                <FolderGit2 size={16} />
                <span>{hasGithubIntegration ? "Integração Online" : "Conectar Repositório"}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.main>

      {/* GitHub Connect Modal */}
      <WorkspaceModal
        title="Conectar Repositório GitHub"
        subtitle="Cole a URL do repositório que deseja conectar ao seu projeto."
        open={githubModalOpen}
        onClose={() => {
          setGithubModalOpen(false);
          setGithubRepoUrl("");
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              URL do Repositório
            </label>
            <input
              type="url"
              value={githubRepoUrl}
              onChange={(e) => setGithubRepoUrl(e.target.value)}
              placeholder="https://github.com/usuario/repositorio"
              className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant/20 rounded-lg text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setGithubModalOpen(false);
                setGithubRepoUrl("");
              }}
              className="flex-1 px-4 py-3 border border-outline-variant/20 text-on-surface-variant text-xs font-bold rounded-lg hover:bg-surface-container-highest transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGitHubConnect}
              disabled={!githubRepoUrl.trim()}
              className="flex-1 px-4 py-3 bg-primary text-on-primary-fixed text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Conectar
            </button>
          </div>
        </div>
      </WorkspaceModal>

      <ProjectModal
        open={open}
        onClose={() => {
          setEditing(null);
          setFormError(null);
          setOpen(false);
        }}
        editing={editing}
        onSubmit={handleSubmit}
        tracks={data!.trackBlueprints}
        errorMessage={formError}
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
  errorMessage,
}: {
  open: boolean;
  onClose: () => void;
  editing: ProjectRow | null;
  onSubmit: (formData: FormData) => Promise<void>;
  tracks: TrackBlueprint[];
  errorMessage: string | null;
}) {
  return (
    <WorkspaceModal
      title={editing ? "Editar projeto" : "Novo projeto"}
      subtitle="Monte o item do portfólio com status e links."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        {errorMessage ? (
          <FeedbackMessage
            tone="error"
            title="Não foi possível salvar o projeto"
            message={errorMessage}
          />
        ) : null}
        <Field label="Título">
          <TextInput name="title" defaultValue={editing?.title || ""} />
        </Field>
        <Field label="Escopo">
          <TextInput name="scope" defaultValue={editing?.scope || ""} />
        </Field>
        <Field label="Descrição">
          <TextArea
            name="description"
            rows={5}
            defaultValue={editing?.description || ""}
          />
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
          <TextInput
            name="repository_url"
            defaultValue={editing?.repository_url || ""}
          />
        </Field>
        <Field label="Documentação">
          <TextInput
            name="documentation_url"
            defaultValue={editing?.documentation_url || ""}
          />
        </Field>
        <Field label="Vídeo">
          <TextInput name="video_url" defaultValue={editing?.video_url || ""} />
        </Field>
      </ModalForm>
    </WorkspaceModal>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-border/60 bg-background/55 px-4 py-3">
      <p className="m-0 text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
        {label}
      </p>
      <strong className="mt-2 block font-display text-xl text-white">
        {value}
      </strong>
    </div>
  );
}

function buildActivityBars(bundle: ProjectBundle) {
  const completion = Math.round(projectCompletion(bundle));
  const pending = bundle.steps.filter((item) => !item.is_done).length;

  return [
    40,
    58,
    34,
    Math.min(88, completion + 10),
    Math.min(96, completion + 20),
    52,
    46,
    68,
  ].map((value, index) =>
    Math.max(22, value - pending * (index % 3 === 0 ? 1 : 0)),
  );
}

function buildProjectLogLines(bundle: ProjectBundle | null) {
  if (!bundle) {
    return [
      "[14:22:01] Aguardando seleção de projeto...",
      "[14:22:03] Nenhum repositório ativo no painel.",
      "[14:22:05] Selecione um item para carregar logs de contexto.",
    ];
  }

  return [
    `[14:22:01] Carregando contexto de ${bundle.project.title}...`,
    `[14:22:03] Status atual: ${labelForProjectStatus(bundle.project.status)}.`,
    `[14:22:06] Etapas concluídas: ${bundle.steps.filter((item) => item.is_done).length}/${bundle.steps.length}.`,
    `[14:22:09] Scope: ${bundle.project.scope || "escopo livre"}.`,
    `[14:22:12] Última atualização: ${new Date(bundle.project.updated_at).toLocaleString("pt-BR")}.`,
    "[14:22:15] Painel operacional pronto.",
  ];
}

function nullable(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : null;
}

function mapProjectFormError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Não foi possível salvar o projeto agora.";

  if (message.includes("projects_limit")) {
    return "Seu plano atual atingiu o limite de projetos. Exclua um projeto antigo ou faça upgrade para continuar.";
  }

  return message;
}
