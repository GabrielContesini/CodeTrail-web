"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Waypoints,
} from "lucide-react";
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
  TextInput,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import { LockedFeaturePage } from "@/app/workspace/_components/pages/shared";
import {
  decodeMindMap,
  encodeMindMap,
  formatDateTime,
  formatShortDate,
  initialMindMapDocument,
} from "@/utils/workspace/helpers";
import type {
  MindMapRow,
  ProjectBundle,
  TrackBlueprint,
} from "@/utils/workspace/types";

type MessageState = {
  tone: "success" | "error";
  text: string;
};

type MapModalPayload = {
  id?: string;
  folder_name: string;
  title: string;
  track_id: string | null;
  module_id: string | null;
  project_id: string | null;
};

export function MindMapsLibraryPage() {
  const router = useRouter();
  const { data, error, saveMindMap, deleteMindMap } = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(data!.mindMaps[0]?.id ?? null);
  const [selectedFolder, setSelectedFolder] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapModalState, setMapModalState] = useState<{
    open: boolean;
    editing: MindMapRow | null;
  }>({
    open: false,
    editing: null,
  });
  const [message, setMessage] = useState<MessageState | null>(null);
  const featureEnabled = data!.featureAccess.mindMaps;

  const folderOptions = buildFolderOptions(data!.mindMaps);
  const filteredMaps = data!.mindMaps.filter((map) => {
    if (selectedFolder !== "Todas" && map.folder_name !== selectedFolder) {
      return false;
    }

    if (!searchQuery.trim()) {
      return true;
    }

    const haystack = [
      map.title,
      map.folder_name,
      ...mindMapContextLabels(map, data!.trackBlueprints, data!.projectBundles),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchQuery.trim().toLowerCase());
  });

  const selected =
    filteredMaps.find((item) => item.id === selectedId) ??
    filteredMaps[0] ??
    null;
  const selectedDocument = selected ? decodeMindMap(selected.content_json, selected.title) : null;
  const selectedLabels = selected
    ? mindMapContextLabels(selected, data!.trackBlueprints, data!.projectBundles)
    : [];
  const stats = useMemo(() => {
    return data!.mindMaps.reduce(
      (accumulator, map) => {
        const document = decodeMindMap(map.content_json, map.title);
        return {
          maps: accumulator.maps + 1,
          nodes: accumulator.nodes + document.nodes.length,
          connections: accumulator.connections + document.connections.length,
        };
      },
      { maps: 0, nodes: 0, connections: 0 },
    );
  }, [data]);

  if (!featureEnabled) {
    return <LockedFeaturePage title="Mind maps premium bloqueados" feature="Mind Maps" />;
  }

  async function handleMapSubmit(payload: MapModalPayload) {
    const targetId = payload.id ?? crypto.randomUUID();
    const existing = mapModalState.editing;

    try {
      await saveMindMap({
        id: targetId,
        folder_name: payload.folder_name,
        title: payload.title,
        content_json:
          existing?.content_json ?? encodeMindMap(initialMindMapDocument(payload.title)),
        track_id: payload.track_id,
        module_id: payload.module_id,
        project_id: payload.project_id,
      });

      setSelectedId(targetId);
      setMapModalState({ open: false, editing: null });
      setMessage({
        tone: "success",
        text: existing ? "Detalhes do mapa atualizados." : "Mapa criado. Abrindo canvas...",
      });

      if (!payload.id) {
        router.push(`/workspace/mind-maps/editor/${targetId}`);
      }
    } catch (nextError) {
      setMessage({
        tone: "error",
        text:
          nextError instanceof Error
            ? nextError.message
            : "Nao foi possivel salvar o mapa agora.",
      });
    }
  }

  async function handleDeleteMap(map: MindMapRow) {
    if (!window.confirm(`Excluir o mapa "${map.title}"? Esta acao nao pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteMindMap(map.id);
      setMessage({
        tone: "success",
        text: "Mapa removido da biblioteca.",
      });

      if (selectedId === map.id) {
        const nextMap = data!.mindMaps.find((item) => item.id !== map.id) ?? null;
        setSelectedId(nextMap?.id ?? null);
      }
    } catch (nextError) {
      setMessage({
        tone: "error",
        text:
          nextError instanceof Error
            ? nextError.message
            : "Nao foi possivel excluir o mapa agora.",
      });
    }
  }

  return (
    <>
      <PageFrame
        title="Mind Maps"
        subtitle="A biblioteca agora fica separada do canvas. Aqui voce organiza seus mapas; ao abrir um item, entra em uma tela dedicada so para construcao visual."
        actions={
          <PrimaryButton onClick={() => setMapModalState({ open: true, editing: null })}>
            <Plus size={16} />
            Novo mapa
          </PrimaryButton>
        }
      >
        {(error || message) && (
          <div
            className={
              message?.tone === "error" || error
                ? "border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                : "border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
            }
          >
            {error ?? message?.text}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <DataCard dense title="Mapas ativos" subtitle="Boards prontos para abrir no editor.">
            <div className="flex items-end justify-between gap-4">
              <strong className="text-3xl font-display text-white">{stats.maps}</strong>
              <Pill tone="primary">Biblioteca</Pill>
            </div>
          </DataCard>
          <DataCard dense title="Conceitos mapeados" subtitle="Nos espalhados entre todos os mapas.">
            <div className="flex items-end justify-between gap-4">
              <strong className="text-3xl font-display text-white">{stats.nodes}</strong>
              <Pill tone="neutral">Nos</Pill>
            </div>
          </DataCard>
          <DataCard dense title="Relacoes criadas" subtitle="Conexoes prontas para revisar no canvas.">
            <div className="flex items-end justify-between gap-4">
              <strong className="text-3xl font-display text-white">{stats.connections}</strong>
              <Pill tone="neutral">Links</Pill>
            </div>
          </DataCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <DataCard
            title="Biblioteca"
            subtitle={`${filteredMaps.length} mapa(s) no filtro atual.`}
            className="min-h-[760px]"
          >
            <div className="grid gap-3">
              <Field label="Pasta">
                <Select
                  value={selectedFolder}
                  onChange={(event) => setSelectedFolder(event.target.value)}
                >
                  {folderOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Buscar mapa">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                  />
                  <TextInput
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Titulo, pasta, trilha ou projeto"
                    className="pl-10"
                  />
                </div>
              </Field>
            </div>

            {filteredMaps.length ? (
              <div className="flex max-h-[590px] flex-col gap-3 overflow-y-auto pr-1">
                {filteredMaps.map((map) => {
                  const document = decodeMindMap(map.content_json, map.title);
                  return (
                    <button
                      key={map.id}
                      type="button"
                      data-testid="mindmap-item"
                      onClick={() => setSelectedId(map.id)}
                      className={`w-full rounded-[22px] border p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-150 ${
                        map.id === selected?.id
                          ? "border-primary/60 bg-primary/10 shadow-[0_20px_40px_rgba(50,208,255,0.08)]"
                          : "border-border/50 bg-background/40 hover:border-primary/30 hover:bg-primary/5"
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-display text-white">
                              {map.title}
                            </h3>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                              {map.folder_name} • {formatShortDate(map.updated_at)}
                            </p>
                          </div>
                          {map.id === selected?.id ? <Pill tone="primary">Ativo</Pill> : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Pill tone="neutral">{document.nodes.length} nos</Pill>
                          <Pill tone="neutral">{document.connections.length} conexoes</Pill>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Nenhum mapa encontrado"
                subtitle="Troque a pasta, limpe a busca ou crie um novo mapa para continuar."
                action={
                  <PrimaryButton onClick={() => setMapModalState({ open: true, editing: null })}>
                    <Plus size={16} />
                    Criar mapa
                  </PrimaryButton>
                }
              />
            )}
          </DataCard>

          {selected && selectedDocument ? (
            <div className="grid gap-6">
              <DataCard
                title={selected.title}
                subtitle="Revise o contexto aqui e abra o editor dedicado quando for desenhar, reorganizar ou conectar os nos."
                actions={
                  <div className="flex flex-wrap gap-2">
                    <PrimaryButton onClick={() => router.push(`/workspace/mind-maps/editor/${selected.id}`)}>
                      <Waypoints size={16} />
                      Abrir canvas
                    </PrimaryButton>
                    <SecondaryButton
                      onClick={() => setMapModalState({ open: true, editing: selected })}
                    >
                      <Pencil size={16} />
                      Editar detalhes
                    </SecondaryButton>
                    <GhostButton
                      onClick={() => void handleDeleteMap(selected)}
                      className="text-red-200 hover:bg-red-500/10 hover:text-red-100"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </GhostButton>
                  </div>
                }
              >
                <div className="flex flex-wrap gap-2">
                  <Pill tone="primary">{selected.folder_name}</Pill>
                  <Pill tone="neutral">{selectedDocument.nodes.length} nos</Pill>
                  <Pill tone="neutral">{selectedDocument.connections.length} conexoes</Pill>
                  {selectedLabels.map((label) => (
                    <Pill key={label} tone="primary">
                      {label}
                    </Pill>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <MetricLine label="Ultima atualizacao" value={formatDateTime(selected.updated_at)} />
                  <MetricLine label="Criado em" value={formatShortDate(selected.created_at)} />
                  <MetricLine
                    label="Estrutura"
                    value={`${selectedDocument.nodes.length} nos / ${selectedDocument.connections.length} links`}
                  />
                </div>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="flex flex-col gap-4">
                    <div className="rounded-none border border-border/60 bg-background/40 p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                        Fluxo recomendado
                      </p>
                      <h3 className="mt-3 text-xl font-display text-white">
                        Biblioteca para contexto, canvas para criacao.
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                        Essa separacao deixa a navegacao mais limpa: voce seleciona o mapa, revisa o
                        contexto e entra no editor somente quando realmente vai montar ou ajustar a
                        estrutura visual.
                      </p>
                    </div>
                    <DataCard dense title="Primeiros nos" subtitle="Resumo rapido do conteudo ja existente.">
                      {selectedDocument.nodes.length ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {selectedDocument.nodes.slice(0, 6).map((node) => (
                            <div
                              key={node.id}
                              className="border border-border/50 bg-background/40 px-4 py-3"
                            >
                              <p className="truncate text-sm font-semibold text-white">{node.label}</p>
                              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                                {node.shape} • {Math.round(node.x)} x {Math.round(node.y)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          title="Mapa ainda vazio"
                          subtitle="Abra o canvas para criar os primeiros nos e comecar a estruturar a ideia."
                          action={
                            <PrimaryButton onClick={() => router.push(`/workspace/mind-maps/editor/${selected.id}`)}>
                              <Sparkles size={16} />
                              Comecar no canvas
                            </PrimaryButton>
                          }
                        />
                      )}
                    </DataCard>
                  </div>
                  <DataCard
                    dense
                    title="Contexto vinculado"
                    subtitle="Conexoes do mapa com o restante do workspace."
                  >
                    <div className="flex flex-col gap-3">
                      <ContextLine label="Pasta" value={selected.folder_name} />
                      <ContextLine
                        label="Trilha / modulo / projeto"
                        value={selectedLabels.length ? selectedLabels.join(" • ") : "Sem contexto vinculado"}
                      />
                      <ContextLine
                        label="Ultimo passo"
                        value="Abra o canvas dedicado para mover nos, criar conexoes e salvar a composicao final."
                      />
                    </div>
                    <div className="mt-4 border-t border-border/50 pt-4">
                      <SecondaryButton
                        className="w-full"
                        onClick={() => router.push(`/workspace/mind-maps/editor/${selected.id}`)}
                      >
                        <FolderOpen size={16} />
                        Ir para o editor dedicado
                      </SecondaryButton>
                    </div>
                  </DataCard>
                </div>
              </DataCard>
            </div>
          ) : (
            <DataCard title="Mapa" subtitle="Selecione um item da biblioteca para revisar o resumo.">
              <EmptyState
                title="Nenhum mapa selecionado"
                subtitle="Escolha um mapa na biblioteca ou crie um novo para abrir o canvas dedicado."
              />
            </DataCard>
          )}
        </div>
      </PageFrame>

      <MindMapMetaModal
        open={mapModalState.open}
        editing={mapModalState.editing}
        tracks={data!.trackBlueprints}
        projects={data!.projectBundles}
        onClose={() => setMapModalState({ open: false, editing: null })}
        onSubmit={handleMapSubmit}
      />
    </>
  );
}

function MindMapMetaModal({
  open,
  editing,
  tracks,
  projects,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: MindMapRow | null;
  tracks: TrackBlueprint[];
  projects: ProjectBundle[];
  onClose: () => void;
  onSubmit: (payload: MapModalPayload) => Promise<void>;
}) {
  const [folderName, setFolderName] = useState("Geral");
  const [title, setTitle] = useState("");
  const [trackId, setTrackId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFolderName(editing?.folder_name || "Geral");
    setTitle(editing?.title || "");
    setTrackId(editing?.track_id || "");
    setModuleId(editing?.module_id || "");
    setProjectId(editing?.project_id || "");
  }, [editing, open]);

  const selectedTrack = tracks.find((item) => item.track.id === trackId) ?? null;
  const modules = useMemo(() => selectedTrack?.modules ?? [], [selectedTrack]);

  useEffect(() => {
    if (!moduleId) return;
    if (!modules.some((item) => item.id === moduleId)) {
      setModuleId("");
    }
  }, [moduleId, modules]);

  return (
    <WorkspaceModal
      open={open}
      onClose={onClose}
      title={editing ? "Editar mapa" : "Novo mapa"}
      subtitle="Defina nome, pasta e o contexto desse board antes de abrir o canvas."
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!title.trim()) return;

          setSubmitting(true);
          try {
            await onSubmit({
              id: editing?.id,
              folder_name: folderName.trim() || "Geral",
              title: title.trim(),
              track_id: trackId || null,
              module_id: moduleId || null,
              project_id: projectId || null,
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <Field label="Pasta">
          <TextInput value={folderName} onChange={(event) => setFolderName(event.target.value)} />
        </Field>
        <Field label="Titulo">
          <TextInput value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="Trilha">
          <Select value={trackId} onChange={(event) => setTrackId(event.target.value)}>
            <option value="">Sem trilha</option>
            {tracks.map((item) => (
              <option key={item.track.id} value={item.track.id}>
                {item.track.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Modulo">
          <Select value={moduleId} onChange={(event) => setModuleId(event.target.value)}>
            <option value="">Sem modulo</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Projeto">
          <Select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="">Sem projeto</option>
            {projects.map((item) => (
              <option key={item.project.id} value={item.project.id}>
                {item.project.title}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-5">
          <SecondaryButton type="button" onClick={onClose}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={submitting || !title.trim()}>
            {submitting ? "Salvando..." : editing ? "Salvar mapa" : "Criar mapa"}
          </PrimaryButton>
        </div>
      </form>
    </WorkspaceModal>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/50 bg-background/40 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ContextLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/50 bg-background/40 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-white">{value}</p>
    </div>
  );
}

function buildFolderOptions(maps: MindMapRow[]) {
  const folders = new Set<string>(["Geral"]);
  maps.forEach((map) => {
    if (map.folder_name.trim()) {
      folders.add(map.folder_name.trim());
    }
  });
  return ["Todas", ...Array.from(folders).sort((left, right) => left.localeCompare(right))];
}

function mindMapContextLabels(
  map: MindMapRow,
  tracks: TrackBlueprint[],
  projects: ProjectBundle[],
) {
  const track = tracks.find((item) => item.track.id === map.track_id);
  const linkedModule = tracks
    .flatMap((item) => item.modules)
    .find((item) => item.id === map.module_id);
  const project = projects.find((item) => item.project.id === map.project_id);

  return [
    ...(track ? [track.track.name] : []),
    ...(linkedModule ? [linkedModule.title] : []),
    ...(project ? [project.project.title] : []),
  ];
}
