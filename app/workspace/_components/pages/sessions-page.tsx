"use client";

import { fadeUpVariants, useMotionPreferences } from "@/app/components/ui/motion-system";
import { ModalForm, nullable, toDatetimeLocal } from "@/app/workspace/_components/pages/shared";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
  Field,
  Select,
  TextArea,
  TextInput,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import { formatHours } from "@/utils/workspace/helpers";
import type { StudySessionRow, TrackBlueprint } from "@/utils/workspace/types";
import { AnimatePresence, motion } from "framer-motion";
import { Bolt, BookOpen, Calendar, Clock3, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";

export function SessionsPage() {
  const { data, saveSession, deleteSession } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudySessionRow | null>(null);
  const { reduced, hoverGlow, hoverLift } = useMotionPreferences();

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

  const translateType = (type: string) => {
    switch (type) {
      case "theory": return "Teoria";
      case "practice": return "Prática";
      case "review": return "Revisão";
      case "project": return "Projeto";
      case "exercises": return "Exercícios";
      default: return type;
    }
  };

  const totalSessions = data!.sessions.length;
  const totalHours = data!.sessions.reduce((sum, item) => sum + item.duration_minutes, 0) / 60;
  const avgFoco = totalSessions > 0 ? (data!.sessions.reduce((sum, item) => sum + item.productivity_score, 0) / totalSessions).toFixed(1) : "0.0";
  const lastSession = data!.sessions[0] ? new Date(data!.sessions[0].start_time).toLocaleDateString("pt-BR") : "--";

  return (
    <>
      <motion.main
        initial="hidden"
        animate="visible"
        variants={fadeUpVariants(reduced, 18)}
        className="w-full max-w-7xl mx-auto space-y-12"
      >
        {/* Header */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-8 bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                Registro de Atividades
              </span>
            </div>
            <h1 className="mb-2 text-5xl font-black tracking-tighter text-on-surface">Sessões</h1>
            <p className="max-w-md text-on-surface-variant text-sm">
              Cronômetro, histórico e blocos de foco com contexto real integrados ao seu workspace.
            </p>
          </div>
          <motion.button
            whileHover={hoverLift}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditing(null); setOpen(true); }}
            className="flex items-center gap-3 rounded-full bg-gradient-to-br from-primary to-primary-container px-8 py-4 text-sm font-black uppercase tracking-widest text-on-primary-fixed shadow-[0_0_30px_rgba(0,227,253,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} className="fill-current" /> Nova Sessão
          </motion.button>
        </div>

        {/* HUD Metrics Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total de sessões", val: totalSessions.toString(), icon: Clock3, desc: "Histórico consolidado" },
            { label: "Horas registradas", val: formatHours(totalHours), icon: Bolt, desc: "Volume total estudado" },
            { label: "Média de foco", val: avgFoco, icon: Target, desc: "Produtividade média" },
            { label: "Última sessão", val: lastSession, icon: BookOpen, desc: "Recência da atividade" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={reduced ? {} : hoverGlow}
              className="bg-surface-container-low border-outline-variant/10 p-6 rounded-2xl border flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">{stat.label}</span>
                <stat.icon size={16} className="text-primary" />
              </div>
              <div className="relative z-10">
                <span className="text-4xl font-black text-white block leading-none">{stat.val}</span>
                <span className="text-[10px] text-text-secondary mt-2 block">{stat.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sessions List Grid */}
        <div className="bg-surface-container/30 border border-outline-variant/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Histórico de Sessões</h3>
            <span className="text-[10px] text-primary uppercase font-bold tracking-widest">{data!.sessions.length} Registros</span>
          </div>

          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {data!.sessions.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center flex flex-col items-center">
                  <Clock3 size={48} className="text-outline-variant/20 mb-4" />
                  <span className="text-on-surface text-lg font-bold">Nenhuma sessão registrada.</span>
                  <span className="text-on-surface-variant text-sm mt-2">Inicie uma sessão para acompanhar seu tempo de foco.</span>
                </motion.div>
              ) : (
                data!.sessions.map((session) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={session.id}
                    className="group flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center justify-between bg-surface-container-low hover:bg-surface-container-highest p-5 rounded-2xl border border-outline-variant/5 hover:border-primary/20 transition-all"
                  >
                    {/* Session Info Area */}
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20"><Bolt size={14} /></div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <strong className="text-base font-bold text-white">
                            {translateType(session.type)}
                          </strong>
                          <div className="flex items-center gap-2">
                            <span className="bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded">
                              {session.duration_minutes} min
                            </span>
                            <span className="bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded">
                              Foco: {session.productivity_score}/5
                            </span>
                          </div>
                        </div>
                        {session.notes && (
                          <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed max-w-3xl">
                            {session.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">
                          <Calendar size={12} /> {new Date(session.start_time).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-[48px] sm:ml-0">
                      <button
                        onClick={() => { setEditing(session); setOpen(true); }}
                        className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-surface-container-highest border border-transparent rounded-lg text-on-surface-variant hover:text-white transition-all"
                        title="Editar Sessão"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => void deleteSession(session.id)}
                        className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-error/10 border border-transparent hover:border-error/20 rounded-lg text-on-surface-variant hover:text-error transition-all"
                        title="Excluir Sessão"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.main>

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
      title={editing ? "Editar Sessão" : "Nova Sessão"}
      subtitle="Registre o bloco de foco com contexto da trilha."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <Field label="TIPO">
          <Select name="type" defaultValue={editing?.type || "practice"}>
            <option value="theory">Teoria</option>
            <option value="practice">Prática</option>
            <option value="review">Revisão</option>
            <option value="project">Projeto</option>
            <option value="exercises">Exercícios</option>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="INÍCIO">
            <TextInput
              name="start_time"
              type="datetime-local"
              defaultValue={toDatetimeLocal(editing?.start_time)}
            />
          </Field>
          <Field label="DURAÇÃO (MIN)">
            <TextInput
              name="duration_minutes"
              type="number"
              min={5}
              defaultValue={editing?.duration_minutes || 50}
            />
          </Field>
        </div>
        <Field label="PRODUTIVIDADE (1-5)">
          <TextInput
            name="productivity_score"
            type="number"
            min={1}
            max={5}
            defaultValue={editing?.productivity_score || 4}
          />
        </Field>
        <Field label="TRILHA (OPCIONAL)">
          <Select name="track_id" defaultValue={editing?.track_id || ""}>
            <option value="">Sem trilha associada</option>
            {tracks.map((item) => (
              <option key={item.track.id} value={item.track.id}>
                {item.track.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="NOTAS">
          <TextArea name="notes" rows={4} defaultValue={editing?.notes || ""} placeholder="Resumo do que foi estudado ou construído..." />
        </Field>
      </ModalForm>
    </WorkspaceModal>
  );
}
