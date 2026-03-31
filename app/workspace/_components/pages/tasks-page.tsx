"use client";

import { fadeUpVariants, useMotionPreferences } from "@/app/components/ui/motion-system";
import { ModalForm, nullable, nullableDate, toDatetimeLocal } from "@/app/workspace/_components/pages/shared";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
  Field,
  Select,
  TextArea,
  TextInput,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import type { TaskRow, TrackBlueprint } from "@/utils/workspace/types";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Calendar, Check, CheckSquare, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function TasksPage() {
  const { data, saveTask, deleteTask } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const { reduced, hoverGlow, hoverLift } = useMotionPreferences();

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

  const pending = data!.tasks.filter((item) => item.status === "pending").length;
  const inProgress = data!.tasks.filter((item) => item.status === "in_progress").length;
  const completed = data!.tasks.filter((item) => item.status === "completed").length;
  const critical = data!.tasks.filter((item) => item.priority === "critical" && item.status !== "completed").length;

  const translateStatus = (s: string) => {
    if (s === "pending") return "Pendente";
    if (s === "in_progress") return "Em Andamento";
    if (s === "completed") return "Concluída";
    return s;
  };
  const translatePriority = (p: string) => {
    if (p === "low") return "Baixa";
    if (p === "medium") return "Média";
    if (p === "high") return "Alta";
    if (p === "critical") return "Crítica";
    return p;
  };

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
                Gerenciamento Operacional
              </span>
            </div>
            <h1 className="mb-2 text-5xl font-black tracking-tighter text-on-surface">Tarefas</h1>
            <p className="max-w-md text-on-surface-variant text-sm">
              Planejamento, execução e prioridade no mesmo fluxo visual do terminal.
            </p>
          </div>
          <motion.button
            whileHover={hoverLift}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditing(null); setOpen(true); }}
            className="flex items-center gap-3 rounded-full bg-gradient-to-br from-primary to-primary-container px-8 py-4 text-sm font-black uppercase tracking-widest text-on-primary-fixed shadow-[0_0_30px_rgba(0,227,253,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} className="fill-current" /> Nova Tarefa
          </motion.button>
        </div>

        {/* HUD Metrics Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Pendentes", val: pending, icon: CheckSquare, desc: "Aguardando ação" },
            { label: "Em andamento", val: inProgress, icon: Clock3, desc: "Execução atual" },
            { label: "Concluídas", val: completed, icon: Check, desc: "Finalizadas" },
            { label: "Críticas", val: critical, icon: AlertTriangle, desc: "Atenção imediata", isAlert: true },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={reduced ? {} : hoverGlow}
              className={`bg-surface-container-low p-6 rounded-2xl border ${stat.isAlert && stat.val > 0 ? "border-error/40 shadow-[0_0_15px_rgba(255,113,108,0.1)]" : "border-outline-variant/10"} flex flex-col justify-between group overflow-hidden relative`}
            >
              {stat.isAlert && stat.val > 0 && (
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-error/10 rounded-full blur-xl pointer-events-none" />
              )}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">{stat.label}</span>
                <stat.icon size={16} className={stat.isAlert && stat.val > 0 ? "text-error animate-pulse" : "text-primary"} />
              </div>
              <div className="relative z-10">
                <span className="text-4xl font-black text-white block leading-none">{stat.val}</span>
                <span className="text-[10px] text-text-secondary mt-2 block">{stat.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Task List Grid */}
        <div className="bg-surface-container/30 border border-outline-variant/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Backlog</h3>
            <span className="text-[10px] text-primary uppercase font-bold tracking-widest">{data!.tasks.length} Itens</span>
          </div>

          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {data!.tasks.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center flex flex-col items-center">
                  <CheckSquare size={48} className="text-outline-variant/20 mb-4" />
                  <span className="text-on-surface text-lg font-bold">Nenhuma tarefa encontrada.</span>
                  <span className="text-on-surface-variant text-sm mt-2">Crie uma nova tarefa para alimentar seu dashboard de atividades.</span>
                </motion.div>
              ) : (
                data!.tasks.map((task) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={task.id}
                    className="group flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center justify-between bg-surface-container-low hover:bg-surface-container-highest p-5 rounded-2xl border border-outline-variant/5 hover:border-primary/20 transition-all"
                  >
                    {/* Task Info Area */}
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex shrink-0">
                        {task.status === "completed" ? (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20"><Check size={14} strokeWidth={3} /></div>
                        ) : task.priority === "critical" ? (
                          <div className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center border border-error/20"><AlertTriangle size={14} /></div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center border border-outline-variant/20"><ArrowRight size={14} /></div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <strong className={`text-base font-bold ${task.status === 'completed' ? 'line-through text-on-surface-variant' : 'text-white'}`}>
                            {task.title}
                          </strong>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${task.status === 'completed' ? 'bg-white/5 text-on-surface-variant' :
                              task.status === 'in_progress' ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_8px_rgba(129,236,255,0.2)]' :
                                'bg-surface-container-highest text-on-surface border border-outline-variant/10'
                              }`}>
                              {translateStatus(task.status)}
                            </span>
                            <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${task.priority === 'critical' ? 'bg-error/10 text-error border border-error/20' :
                              task.priority === 'high' ? 'bg-warning/10 text-warning border border-warning/20' :
                                'bg-surface-container-highest text-on-surface-variant border border-outline-variant/10'
                              }`}>
                              {translatePriority(task.priority)}
                            </span>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed max-w-3xl">
                            {task.description}
                          </p>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">
                            <Calendar size={12} /> Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-[48px] sm:ml-0">
                      {task.status !== "completed" && (
                        <button
                          onClick={() => void saveTask({ id: task.id, status: "completed", completed_at: new Date().toISOString() })}
                          className="px-4 py-2 bg-surface-container-highest hover:bg-primary/20 text-on-surface hover:text-primary transition-all border border-outline-variant/10 hover:border-primary/30 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                        >
                          Concluir
                        </button>
                      )}
                      <button
                        onClick={() => { setEditing(task); setOpen(true); }}
                        className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-surface-container-highest border border-transparent rounded-lg text-on-surface-variant hover:text-white transition-all"
                        title="Editar Tarefa"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => void deleteTask(task.id)}
                        className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-error/10 border border-transparent hover:border-error/20 rounded-lg text-on-surface-variant hover:text-error transition-all"
                        title="Excluir Tarefa"
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
      title={editing ? "Editar Tarefa" : "Nova Tarefa"}
      subtitle="Defina o escopo, prioridade e track associada para esta atividade."
      open={open}
      onClose={onClose}
    >
      <ModalForm onSubmit={onSubmit}>
        <Field label="TÍTULO">
          <TextInput name="title" defaultValue={editing?.title || ""} placeholder="Título da tarefa" />
        </Field>
        <Field label="DESCRIÇÃO">
          <TextArea name="description" rows={4} defaultValue={editing?.description || ""} placeholder="Anotações e detalhes do escopo..." />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="PRIORIDADE">
            <Select name="priority" defaultValue={editing?.priority || "medium"}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </Select>
          </Field>
          <Field label="STATUS">
            <Select name="status" defaultValue={editing?.status || "pending"}>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em Andamento</option>
              <option value="completed">Concluída</option>
            </Select>
          </Field>
        </div>
        <Field label="PRAZO (OPCIONAL)">
          <TextInput name="due_date" type="datetime-local" defaultValue={toDatetimeLocal(editing?.due_date)} />
        </Field>
        <Field label="TRILHA (OPCIONAL)">
          <Select name="track_id" defaultValue={editing?.track_id || ""}>
            <option value="">Nenhuma trilha associada</option>
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
