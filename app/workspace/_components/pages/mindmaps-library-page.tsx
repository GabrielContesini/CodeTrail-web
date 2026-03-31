"use client";

import { fadeUpVariants, useMotionPreferences } from "@/app/components/ui/motion-system";
import { LockedFeaturePage } from "@/app/workspace/_components/pages/shared";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
  Field,
  Select,
  TextInput,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import {
  decodeMindMap,
  encodeMindMap,
  formatShortDate,
  initialMindMapDocument
} from "@/utils/workspace/helpers";
import type {
  MindMapRow,
  ProjectBundle,
  TrackBlueprint,
} from "@/utils/workspace/types";
import { motion } from "framer-motion";
import {
  FolderOpen,
  GitBranch,
  Network,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Waypoints
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const { reduced, hoverLift, transition } = useMotionPreferences();

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

  const selected = filteredMaps.find((item) => item.id === selectedId) ?? filteredMaps[0] ?? null;
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
        text: nextError instanceof Error ? nextError.message : "Nao foi possivel salvar o mapa agora.",
      });
    }
  }

  async function handleDeleteMap(map: MindMapRow) {
    if (!window.confirm(`Excluir o mapa "${map.title}"? Esta acao nao pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteMindMap(map.id);
      setMessage({ tone: "success", text: "Mapa removido da biblioteca." });

      if (selectedId === map.id) {
        const nextMap = data!.mindMaps.find((item) => item.id !== map.id) ?? null;
        setSelectedId(nextMap?.id ?? null);
      }
    } catch (nextError) {
      setMessage({
        tone: "error",
        text: nextError instanceof Error ? nextError.message : "Nao foi possivel excluir o mapa agora.",
      });
    }
  }

  return (
    <>
      <motion.main
        initial="hidden"
        animate="visible"
        variants={fadeUpVariants(reduced, 18)}
        className="w-full max-w-7xl mx-auto space-y-12"
      >
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-8 bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                Grafos de Conhecimento
              </span>
            </div>
            <h1 className="mb-2 text-5xl font-black tracking-tighter text-on-surface">Biblioteca de Mapas Mentais</h1>
            <p className="max-w-md text-on-surface-variant text-sm">Arquitetura visual do seu conhecimento. Selecione um mapa para revisar seu contexto, ou abra o canvas dedicado para reestruturar conceitos.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setMapModalState({ open: true, editing: null })}
              className="flex items-center gap-3 rounded-full bg-gradient-to-br from-primary to-primary-container px-8 py-4 text-sm font-black uppercase tracking-widest text-on-primary-fixed shadow-[0_0_30px_rgba(0,227,253,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={16} /> Novo Mapa
            </button>
          </div>
        </div>

        {(error || message) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-3 rounded-xl border text-sm font-medium ${message?.tone === "error" || error
              ? "border-error/30 bg-error/10 text-error"
              : "border-primary/30 bg-primary/10 text-primary"
              }`}
          >
            {error ?? message?.text}
          </motion.div>
        )}

        {/* Global Stats Trio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div whileHover={hoverLift} transition={transition} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-4">Mapas Ativos</p>
            <div className="flex items-end justify-between">
              <h4 className="text-4xl font-black text-white font-mono">{stats.maps}</h4>
              <Network size={32} className="text-primary/40" />
            </div>
          </motion.div>

          <motion.div whileHover={hoverLift} transition={transition} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors"></div>
            <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-4">Conceitos Mapeados</p>
            <div className="flex items-end justify-between">
              <h4 className="text-4xl font-black text-white font-mono">{stats.nodes}</h4>
              <Sparkles size={32} className="text-secondary/40" />
            </div>
          </motion.div>

          <motion.div whileHover={hoverLift} transition={transition} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors"></div>
            <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-4">Relações Estabelecidas</p>
            <div className="flex items-end justify-between">
              <h4 className="text-4xl font-black text-white font-mono">{stats.connections}</h4>
              <GitBranch size={32} className="text-tertiary/40" />
            </div>
          </motion.div>
        </div>

        {/* Library & Detail View */}
        <div className="grid lg:grid-cols-[380px_minmax(0,1fr)] gap-8 items-start">

          {/* Library Sidebar */}
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-6 flex flex-col h-[700px]">
            <h3 className="text-sm font-bold text-on-surface mb-1">Diretório de Mapas</h3>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-6">{filteredMaps.length} registros</p>

            <div className="space-y-4 mb-6 shrink-0">
              <div>
                <Select
                  value={selectedFolder}
                  onChange={(event) => setSelectedFolder(event.target.value)}
                  className="w-full bg-surface border-outline-variant/20 text-sm"
                >
                  {folderOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </Select>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <TextInput
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar grafos..."
                  className="pl-9 bg-surface border-outline-variant/20 text-sm w-full"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {filteredMaps.length > 0 ? (
                filteredMaps.map((map) => {
                  const doc = decodeMindMap(map.content_json, map.title);
                  const isActive = map.id === selected?.id;
                  return (
                    <button
                      key={map.id}
                      onClick={() => setSelectedId(map.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all border ${isActive
                        ? "bg-surface-container border-primary/40 shadow-[0_0_15px_rgba(129,236,255,0.1)]"
                        : "bg-transparent border-transparent hover:bg-white/5 hover:border-outline-variant/20"
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`text-sm font-bold truncate pr-2 ${isActive ? "text-primary" : "text-white"}`}>{map.title}</h4>
                        {isActive && <span className="shrink-0 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#81ecff]"></span>}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono uppercase tracking-tight">
                        <span className="truncate max-w-[120px]">{map.folder_name}</span>
                        <span>{doc.nodes.length} nós / {doc.connections.length} conexões</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-outline-variant/20 rounded-xl bg-surface/50">
                  <FolderOpen size={32} className="text-on-surface-variant/30 mb-3" />
                  <p className="text-sm font-bold text-white mb-1">Nenhum Mapa</p>
                  <p className="text-[10px] text-on-surface-variant">Altere os filtros ou crie um novo mapa.</p>
                </div>
              )}
            </div>
          </div>

          {/* Details View */}
          <div className="h-full flex flex-col">
            {selected && selectedDocument ? (
              <div className="bg-[rgba(26,26,26,0.5)] backdrop-blur-md rounded-2xl border border-outline-variant/10 p-8 h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-surface-container border border-outline-variant/10 rounded uppercase text-[10px] font-bold text-on-surface-variant tracking-widest">{selected.folder_name}</span>
                      <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded uppercase text-[10px] font-bold text-primary tracking-widest">{formatShortDate(selected.updated_at)}</span>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">{selected.title}</h2>
                    <p className="text-sm text-on-surface-variant">Grafo central para visualizar conceitos e estabelecer dependências.</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setMapModalState({ open: true, editing: selected })}
                      className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/10 text-on-surface-variant hover:text-primary hover:border-primary/30 transition-colors"
                      title="Editar metadados"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => void handleDeleteMap(selected)}
                      className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/10 text-on-surface-variant hover:text-error hover:border-error/30 hover:bg-error/10 transition-colors"
                      title="Excluir mapa"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => router.push(`/workspace/mind-maps/editor/${selected.id}`)}
                      className="ml-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary font-bold text-xs uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-primary/20 transition-all active:scale-95"
                    >
                      <Network size={16} /> ABRIR CANVAS
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-surface-container-highest/50 p-4 rounded-xl border border-outline-variant/5">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Nós</p>
                    <p className="text-2xl font-mono text-white">{selectedDocument.nodes.length}</p>
                  </div>
                  <div className="bg-surface-container-highest/50 p-4 rounded-xl border border-outline-variant/5">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Arestas</p>
                    <p className="text-2xl font-mono text-white">{selectedDocument.connections.length}</p>
                  </div>
                  <div className="bg-surface-container-highest/50 p-4 rounded-xl border border-outline-variant/5 md:col-span-2">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Contexto Topológico</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedLabels.length > 0 ? selectedLabels.map(lbl => (
                        <span key={lbl} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-on-surface-variant">{lbl}</span>
                      )) : <span className="text-[10px] text-on-surface-variant/50 italic">Grafo Órfão</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 flex-1">
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Preview do Grafo (Nós Principais)</h3>
                  {selectedDocument.nodes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedDocument.nodes.slice(0, 6).map(node => (
                        <div key={node.id} className="p-3 bg-surface-container border border-outline-variant/10 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3 truncate">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: node.colorHex }}></span>
                            <span className="text-sm font-medium text-white truncate">{node.label}</span>
                          </div>
                          <span className="text-[10px] font-mono text-on-surface-variant/50 shrink-0 ml-2">[{Math.round(node.x)}, {Math.round(node.y)}]</span>
                        </div>
                      ))}
                      {selectedDocument.nodes.length > 6 && (
                        <div className="p-3 bg-surface-container/30 border border-dashed border-outline-variant/20 rounded-lg flex items-center justify-center">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">+ {selectedDocument.nodes.length - 6} NÓS</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 bg-surface-container/30 border border-dashed border-outline-variant/20 rounded-xl text-center flex-1 flex flex-col items-center justify-center">
                      <Sparkles size={32} className="text-primary/30 mb-3" />
                      <p className="text-sm text-white font-bold mb-1">Canvas em Branco</p>
                      <p className="text-xs text-on-surface-variant max-w-sm mb-6">Este mapa está pronto para conceitos. Abra o canvas para começar a adicionar nós e gerar conexões.</p>
                      <button
                        onClick={() => router.push(`/workspace/mind-maps/editor/${selected.id}`)}
                        className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                      >
                        ABRIR EDITOR
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-8 h-full flex flex-col items-center justify-center text-center">
                <Waypoints size={48} className="text-on-surface-variant/20 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Nenhuma Seleção</h2>
                <p className="text-sm text-on-surface-variant max-w-sm">Selecione um grafo de conhecimento no diretório para revisar seus metadados e topologia.</p>
              </div>
            )}
          </div>
        </div>

      </motion.main>

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
      subtitle="Defina nome, pasta e o contexto desse board para a biblioteca."
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
        <div className="flex items-center justify-end gap-3 border-t border-outline-variant/10 pt-5 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-white transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={submitting || !title.trim()} className="px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-bold hover:bg-primary/30 transition-colors disabled:opacity-50">
            {submitting ? "Salvando..." : editing ? "Salvar mapa" : "Criar mapa"}
          </button>
        </div>
      </form>
    </WorkspaceModal>
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
