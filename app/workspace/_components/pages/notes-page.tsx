"use client";

import { fadeUpVariants, useMotionPreferences } from "@/app/components/ui/motion-system";
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
  decodeNoteContent,
  emptyNoteContext,
  encodeNoteContent,
  noteReadingMinutes,
  noteWordCount,
} from "@/utils/workspace/helpers";
import type {
  NoteContextLink,
  ProjectBundle,
  StudyNoteRow,
  TrackBlueprint,
} from "@/utils/workspace/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bold,
  ChevronRight,
  Code2,
  FileBox,
  FolderOpen,
  Image as ImageIcon,
  Info,
  List,
  MessageSquareQuote,
  Pencil,
  Plus,
  Sparkles,
  Trash2
} from "lucide-react";
import { useState } from "react";

export function NotesPage() {
  const { data, saveNote, deleteNote } = useWorkspace();
  const { reduced, hoverLift, transition } = useMotionPreferences();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudyNoteRow | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(data!.notes[0]?.id ?? null);
  const [deepWork, setDeepWork] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState("");

  const selected = data!.notes.find((item) => item.id === selectedId) ?? data!.notes[0] ?? null;
  const document = selected ? decodeNoteContent(selected.content) : null;
  const cueLines = document ? extractCueLines(document.body) : [];

  const toggleEditMode = () => {
    if (!isEditing && selected) {
      setEditorContent(document?.body || "");
    }
    setIsEditing(!isEditing);
  };

  const handleSaveContent = async () => {
    if (!selected) return;
    const track = data!.trackBlueprints.find(
      (item) => item.track.id === selected.track_id,
    );
    const selectedModule = data!.trackBlueprints
      .flatMap((item) => item.modules)
      .find((item) => item.id === selected.module_id);
    const project = data!.projectBundles.find(
      (item) => item.project.id === selected.project_id,
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
      id: selected.id,
      folder_name: selected.folder_name,
      title: selected.title,
      content: encodeNoteContent(editorContent, context),
    });
    setIsEditing(false);
  };

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
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUpVariants(reduced, 18)}
        className="flex flex-col h-[calc(100vh-8rem)] w-full overflow-hidden border border-outline-variant/10 rounded-2xl bg-surface relative"
      >
        {/* Top Header */}
        <div className="h-14 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-on-surface-variant text-sm">
              <FolderOpen size={16} />
              <span>Workspace</span>
              <ChevronRight size={14} className="opacity-50" />
              <span>{selected?.folder_name || "Geral"}</span>
            </div>
            <div className="h-4 w-px bg-white/10 mx-2"></div>
            <h1 className="text-on-surface font-semibold text-sm truncate max-w-[200px] sm:max-w-md">{selected?.title || "Sem documento ativo"}</h1>
          </div>
          <div className="flex items-center gap-6">
            {/* Deep Work Toggle */}
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Foco Total</span>
              <button
                onClick={() => setDeepWork(!deepWork)}
                className="w-10 h-5 rounded-full bg-surface-container-highest relative flex items-center px-0.5 group focus:outline-none"
              >
                <div className={`h-4 w-4 rounded-full transition-all ${deepWork ? "bg-primary translate-x-5 shadow-[0_0_10px_rgba(129,236,255,0.4)]" : "bg-slate-500 group-hover:bg-primary"}`}></div>
              </button>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              {selected && (
                <>
                  <button
                    onClick={() => void deleteNote(selected.id)}
                    className="p-2 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                    title="Excluir nota"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => { setEditing(selected); setOpen(true); }}
                    className="p-2 hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                    title="Editar detalhes"
                  >
                    <Pencil size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">

          {/* Note List / Folder Explorer Sidebar */}
          <AnimatePresence initial={false}>
            {!deepWork && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 288, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={transition}
                className="w-72 border-r border-outline-variant/10 bg-surface-container-low flex flex-col overflow-hidden shrink-0 z-10"
              >
                <div className="p-4">
                  <button
                    onClick={() => { setEditing(null); setOpen(true); }}
                    className="w-full py-2.5 px-4 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-primary/20 transition-all active:scale-95"
                  >
                    <Plus size={14} /> NOVA_NOTA
                  </button>
                </div>

                <div className="px-4 pb-2 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant/60">Diretório</span>
                  <FileBox size={14} className="text-primary" />
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1" style={{ scrollbarGutter: "stable" }}>
                  {data!.notes.length > 0 ? (
                    data!.notes.map((note) => {
                      const isActive = note.id === selectedId;
                      return (
                        <div
                          key={note.id}
                          onClick={() => setSelectedId(note.id)}
                          className={`p-3 rounded-xl cursor-pointer transition-all border ${isActive ? "bg-surface-container border-primary/30 shadow-[0_0_10px_rgba(129,236,255,0.05)]" : "bg-transparent border-transparent hover:bg-white/5"}`}
                        >
                          <div className="flex items-start justify-between mb-1 gap-2">
                            <span className={`text-xs font-bold truncate flex-1 ${isActive ? "text-primary" : "text-on-surface"}`}>{note.title}</span>
                            <span className="text-[10px] text-on-surface-variant shrink-0">{new Date(note.updated_at).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant/60 line-clamp-1">{note.folder_name}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center p-4 text-sm text-on-surface-variant italic rounded-xl border border-dashed border-outline-variant/10">
                      Nenhuma anotação.
                    </div>
                  )}
                </div>

                <div className="p-4 bg-surface-container-highest/30 border-t border-outline-variant/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-on-surface-variant tracking-widest">EXTRAIR_FLASHCARDS</span>
                    <div className="w-8 h-4 rounded-full bg-primary/20 border border-primary/40 relative flex items-center px-0.5">
                      <div className="h-3 w-3 rounded-full bg-primary translate-x-3.5 shadow-[0_0_8px_rgba(129,236,255,0.6)]"></div>
                    </div>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/50 leading-relaxed">Gera automaticamente material de revisão a partir de pistas de contexto no editor.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor Surface */}
          <div className="flex-1 bg-surface relative flex flex-col overflow-hidden">
            {/* Editor Glow Top Accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent z-10 pointer-events-none"></div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 px-4 sm:px-8 py-3 sm:py-4 border-b border-outline-variant/5 shrink-0 overflow-x-auto">
              <button aria-label="Negrito" className="p-1.5 hover:bg-white/5 rounded text-on-surface-variant transition-colors"><Bold size={18} /></button>
              <button aria-label="Código" className="p-1.5 hover:bg-white/5 rounded text-on-surface-variant transition-colors"><Code2 size={18} /></button>
              <button aria-label="Lista" className="p-1.5 hover:bg-white/5 rounded text-on-surface-variant transition-colors"><List size={18} /></button>
              <button aria-label="Citação" className="p-1.5 hover:bg-white/5 rounded text-on-surface-variant transition-colors"><MessageSquareQuote size={18} /></button>
              <button aria-label="Imagem" className="p-1.5 hover:bg-white/5 rounded text-on-surface-variant transition-colors"><ImageIcon size={18} /></button>
              <div className="flex-1 min-w-[20px]"></div>
              <div className="hidden sm:flex bg-surface-container rounded-lg p-0.5 border border-white/5">
                <button 
                  onClick={() => setIsEditing(false)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!isEditing ? "bg-surface-container-highest text-primary shadow-sm" : "text-on-surface-variant hover:text-white"}`}
                >
                  LEITURA
                </button>
                <button 
                  onClick={() => {
                    if (!isEditing && selected) {
                      setEditorContent(document?.body || "");
                    }
                    setIsEditing(true);
                  }}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${isEditing ? "bg-surface-container-highest text-primary shadow-sm" : "text-on-surface-variant hover:text-white"}`}
                >
                  EDIÇÃO
                </button>
              </div>
            </div>

            {/* Editor Content Area */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-12 md:px-20 lg:px-24 py-12 custom-scrollbar">
              {selected && document ? (
                <div className="max-w-3xl mx-auto space-y-8 pb-32">
                  <div className="space-y-4">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-on-surface">{selected.title}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                      {document.labels.map(label => (
                        <span key={label} className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-bold tracking-widest rounded">{label}</span>
                      ))}
                      <span className="px-2 py-0.5 bg-surface-container border border-outline-variant/10 text-on-surface-variant text-[10px] uppercase font-bold tracking-widest rounded">{noteReadingMinutes(selected)} MIN LEITURA</span>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <textarea
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        className="w-full min-h-[400px] px-4 py-3 bg-surface-container-highest border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/50 focus:outline-none font-mono text-sm leading-relaxed resize-y"
                        placeholder="Escreva sua nota aqui..."
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border border-outline-variant/20 text-on-surface-variant text-xs font-bold rounded-lg hover:bg-surface-container-highest transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveContent}
                          className="px-6 py-2 bg-primary text-on-primary-fixed text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none text-on-surface-variant prose-p:leading-relaxed prose-headings:text-on-surface prose-a:text-primary whitespace-pre-wrap">
                      {document.body}
                    </div>
                  )}

                  {document.context.trackId || document.context.projectId ? (
                    <div className="p-6 bg-primary/5 border-l-2 border-primary rounded-r-xl mt-12 group hover:bg-primary/10 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={16} className="text-primary" />
                        <span className="text-[11px] font-black tracking-widest text-primary uppercase">LINKS DE CONTEXTO</span>
                      </div>
                      <p className="text-sm text-on-surface-variant">
                        Esta nota está associada a {document.context.trackLabel ? <strong className="text-on-surface">Trilha: {document.context.trackLabel}</strong> : null}
                        {document.context.trackLabel && document.context.projectLabel ? " e " : ""}
                        {document.context.projectLabel ? <strong className="text-on-surface">Projeto: {document.context.projectLabel}</strong> : null}.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <Sparkles size={48} className="mx-auto text-on-surface-variant/30 mb-6" />
                    <h3 className="text-xl font-display font-medium text-white mb-2">Nenhuma nota selecionada</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">Crie uma nova nota ou selecione um documento existente para abrir o editor e capturar contexto.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contextual Stats / Right Sidebar */}
          <AnimatePresence initial={false}>
            {!deepWork && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 256, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={transition}
                className="w-64 bg-surface-container-low border-l border-outline-variant/10 hidden xl:flex flex-col p-6 space-y-8 overflow-y-auto shrink-0 z-10"
              >
                <div className="space-y-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant/60">Estatísticas</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/5">
                      <div className="text-[10px] text-on-surface-variant mb-1 font-bold uppercase tracking-wider">Palavras</div>
                      <div className="text-lg font-bold text-on-surface">{selected ? noteWordCount(selected) : 0}</div>
                    </div>
                    <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/5">
                      <div className="text-[10px] text-on-surface-variant mb-1 font-bold uppercase tracking-wider">Leitura</div>
                      <div className="text-lg font-bold text-on-surface">{selected ? noteReadingMinutes(selected) : 0}m</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant/60">Flashcards</span>
                    {cueLines.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{cueLines.length} EXTRAÍDOS</span>}
                  </div>

                  {cueLines.length > 0 ? (
                    <div className="space-y-3">
                      {cueLines.map((cue, i) => (
                        <div key={i} className="p-3 bg-surface border-l-2 border-primary/40 rounded-r-lg group cursor-pointer hover:bg-white/5 transition-colors border-y border-r outline-none border-transparent">
                          <div className="text-[10px] text-primary mb-1 font-bold tracking-widest">PISTA {i + 1}</div>
                          <p className="text-[11px] text-on-surface leading-snug line-clamp-3">{cue}</p>
                        </div>
                      ))}
                      <button className="w-full py-2 text-[11px] font-bold text-on-surface-variant border border-outline-variant/10 rounded-lg hover:border-primary/40 hover:text-primary transition-all uppercase tracking-widest">ADICIONAR_À_FILA</button>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-container rounded-lg border border-dashed border-outline-variant/20 text-[11px] text-on-surface-variant text-center">
                      Escreva conceitos distintos para gerar pistas de revisão automaticamente.
                    </div>
                  )}
                </div>

                <div className="pt-8 mt-auto border-t border-outline-variant/5">
                  <div className="bg-gradient-to-br from-surface-container to-surface-container-highest p-4 rounded-xl border border-outline-variant/5 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all delay-75"></div>
                    <span className="text-[10px] font-black text-primary mb-2 block tracking-widest">DICA_PRO</span>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Use o botão Foco Total no cabeçalho para esconder as barras laterais e maximizar a concentração no editor.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

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
  const parsed = editing
    ? decodeNoteContent(editing.content)
    : { body: "", context: emptyNoteContext() };

  return (
    <WorkspaceModal
      title={editing ? "Editar nota" : "Nova nota"}
      subtitle="Caderno editorial ligado aos checkpoints do workspace."
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
        <Field label="Conteúdo (Markdown)">
          <TextArea name="content" rows={12} defaultValue={parsed.body} />
        </Field>
      </ModalForm>
    </WorkspaceModal>
  );
}

function extractCueLines(body: string) {
  return body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.length > 24)
    .slice(0, 3);
}

function nullable(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : null;
}
