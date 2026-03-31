"use client";

import { fadeUpVariants, useMotionPreferences } from "@/app/components/ui/motion-system";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import { formatRelativeDue } from "@/utils/workspace/helpers";
import { motion } from "framer-motion";
import {
  Bolt,
  Brain,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Flame,
  Gauge,
  History,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export function DashboardPage() {
  const { data, user } = useWorkspace();
  const { reduced, hoverLift, transition } = useMotionPreferences();

  const summary = data!.dashboardSummary;
  const analytics = data!.analyticsSummary;
  const displayName = data!.profile?.full_name || user.fullName || "Operador";
  const activeTracks = data!.trackBlueprints.filter(t => !t.isCompleted);
  const completedTracks = data!.trackBlueprints.filter(t => t.isCompleted);
  const selectedTrackId = data!.profile?.selected_track_id;
  const primaryTrack = selectedTrackId 
    ? activeTracks.find(t => t.track.id === selectedTrackId) 
    : activeTracks.length > 0 
      ? activeTracks.sort((left, right) => right.progressPercent - left.progressPercent)[0] 
      : data!.trackBlueprints.sort((left, right) => right.progressPercent - left.progressPercent)[0] ?? null;

  const nextReview =
    [...data!.reviews]
      .filter((item) => item.status !== "completed")
      .sort((left, right) => new Date(left.scheduled_for).getTime() - new Date(right.scheduled_for).getTime())[0] ?? null;

  const openTasks = data!.tasks.filter((item) => item.status !== "completed").slice(0, 4);
  const completedTasksCount = data!.tasks.filter((item) => item.status === "completed").length;

  const totalReviews = data!.reviews.length;
  const completedReviews = data!.reviews.filter(r => r.status === "completed").length;
  const retentionScore = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

  const totalSessions = data!.sessions.length;
  const avgMinutes = totalSessions > 0 
    ? Math.round(data!.sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / totalSessions)
    : 0;
  const avgProductivity = totalSessions > 0 
    ? data!.sessions.reduce((sum, s) => sum + (s.productivity_score || 0), 0) / totalSessions
    : 0.5;

  const focusStats = [
    {
      label: "Retenção de memória",
      value: clamp(retentionScore > 0 ? retentionScore : 50),
      icon: <Brain size={18} className="text-primary" />,
      metric: `${retentionScore}%`,
    },
    {
      label: "Foco da sessão",
      value: clamp(avgProductivity * 20),
      icon: <Gauge size={18} className="text-primary" />,
      metric: `${Math.round(avgProductivity * 20)}`,
    },
    {
      label: "Precisão geral",
      value: clamp(completedTasksCount > 0 ? (completedTasksCount / (completedTasksCount + openTasks.length)) * 100 : 0),
      icon: <ShieldCheck size={18} className="text-primary" />,
      metric: `${completedTasksCount} concluídas`,
    },
    {
      label: "Sessão média",
      value: clamp(totalSessions > 0 ? (avgMinutes / 60) * 100 : 0),
      icon: <Clock size={18} className="text-primary" />,
      metric: `${avgMinutes}m`,
    },
  ];

  const objectives = [
    ...openTasks.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.priority.toUpperCase(),
      done: false,
      href: "/workspace/tasks",
      accent: item.priority === "critical",
    })),
    ...data!.reviews
      .filter((item) => item.status === "completed")
      .slice(0, 2)
      .map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.interval_label.toUpperCase(),
        done: true,
        href: "/workspace/reviews",
        accent: false,
      })),
  ].slice(0, 4);

  const completedObjectivesCount = objectives.filter((obj) => obj.done).length;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants(reduced, 18)}
      className="space-y-10 w-full"
    >
      {/* Welcome Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-px w-8 bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              Status do Sistema: Online
            </span>
          </div>
          <h1 className="mb-2 text-5xl font-black text-on-surface tracking-tighter">
            Bem-vindo(a) de volta, <span className="text-primary italic">{displayName.split(" ")[0]}.</span>
          </h1>
          <p className="max-w-md text-on-surface-variant text-sm">
            Seu caminho neural está {(primaryTrack?.progressPercent ?? summary.trackProgress).toFixed(0)}% concluído. Pronto para iniciar a próxima sessão?
          </p>
        </div>
        <div className="flex gap-4">
          <motion.div whileHover={hoverLift} transition={transition} className="bg-surface-container-low px-6 py-4 rounded-xl border border-outline-variant/10">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">SEQUÊNCIA</p>
            <div className="flex items-center gap-2">
              <Flame size={24} className="text-primary neon-glow" />
              <span className="text-2xl font-black italic">{summary.streakDays} DIAS</span>
            </div>
          </motion.div>
          <motion.div whileHover={hoverLift} transition={transition} className="bg-surface-container-low px-6 py-4 rounded-xl border border-outline-variant/10">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">TAREFAS FEITAS</p>
            <div className="flex items-center gap-2">
              <Bolt size={24} className="text-primary neon-glow" />
              <span className="text-2xl font-black italic">{completedTasksCount}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-12 gap-6 w-full">
        {/* Primary Focus: Current Study Trail */}
        <motion.div
          whileHover={{ borderColor: "rgba(129,236,255,0.2)" }}
          transition={transition}
          className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-2xl p-8 relative overflow-hidden group border border-outline-variant/5"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
          <div className="flex flex-col md:flex-row gap-10 items-center relative z-10 w-full">
            {/* Circular Progress Indicator */}
            <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                <circle className="text-surface-container-highest" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="8"></circle>
                <circle className="text-primary neon-glow transition-all duration-1000 ease-out" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeDasharray="553" strokeDashoffset={553 - (553 * (primaryTrack?.progressPercent ?? summary.trackProgress)) / 100} strokeLinecap="round" strokeWidth="8"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-4xl font-black italic tracking-tighter">{(primaryTrack?.progressPercent ?? summary.trackProgress).toFixed(0)}%</span>
                <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">Progresso da Trilha</span>
              </div>
            </div>

            <div className="flex-1 space-y-6 w-full">
              <div>
                <h3 className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-1">Trilha Ativa</h3>
                <h4 className="text-3xl font-bold tracking-tight text-white">{primaryTrack?.track.name ?? "Nenhuma trilha ativa"}</h4>
                <p className="text-on-surface-variant mt-2 text-sm leading-relaxed">
                  {primaryTrack?.track.description || "Selecione uma trilha para transformar metas em módulos, habilidades e checkpoints visuais."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {(primaryTrack?.skills.slice(0, 3).map((item) => item.name) ?? ["Roadmap", "Sessões", "Projetos"]).map((label) => (
                  <span key={label} className="px-3 py-1 bg-surface-container-highest rounded text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
                ))}
              </div>
              <div className="pt-4 flex gap-4 w-full">
                <Link href="/workspace/sessions" className="px-8 py-3 bg-white/5 hover:bg-white/10 text-on-surface text-sm font-bold rounded-full border border-outline-variant/20 transition-all active:scale-95">
                  RETOMAR SESSÃO
                </Link>
                <Link href="/workspace/tracks" className="px-8 py-3 bg-transparent text-on-surface-variant hover:text-white text-sm font-bold rounded-full border border-transparent transition-all active:scale-95">
                  Ver Trilha
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Review Item */}
        <motion.div
          whileHover={{ borderColor: "rgba(129,236,255,0.2)" }}
          transition={transition}
          className="col-span-12 lg:col-span-4 bg-surface-container-high rounded-2xl p-8 border border-outline-variant/10 flex flex-col justify-between"
        >
          {nextReview ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-6 border-b-0">
                  <h3 className="text-[10px] font-bold text-on-surface-variant tracking-[0.2em] uppercase mb-0">PRÓXIMA</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-tighter ${nextReview.status === "overdue" ? "bg-error/10 text-error" : "bg-warning/10 text-warning"}`}>
                    {nextReview.status === "overdue" ? "Prioridade Alta" : "Pendente"}
                  </span>
                </div>
                <h4 className="text-xl font-bold leading-tight text-white">{nextReview.title}</h4>
                <p className="text-on-surface-variant mt-3 text-sm">
                  Revisão {nextReview.interval_label} agendada para reforçar sua memorização.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-outline-variant/10 space-y-4">
                <div className="flex items-center gap-3">
                  <History size={18} className="text-primary" />
                  <span className="text-xs text-on-surface-variant">Prazo: {formatRelativeDue(nextReview.scheduled_for)}</span>
                </div>
                <Link href="/workspace/reviews" className="flex items-center justify-center w-full py-3 bg-surface-container-highest hover:bg-white/5 text-on-surface text-xs font-bold rounded-lg transition-all border border-outline-variant/20 uppercase tracking-widest">
                  INICIAR REVISÃO
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full justify-between gap-6">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-bold text-on-surface-variant tracking-[0.2em] uppercase mb-0">PRÓXIMA</h3>
                  <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-bold rounded uppercase tracking-tighter">Fila Limpa</span>
                </div>
                <h4 className="text-xl font-bold leading-tight text-white">Sem revisões urgentes.</h4>
                <p className="text-on-surface-variant mt-3 text-sm">
                  Aproveite a janela livre para avançar projeto, consolidar notas ou iniciar outra sessão.
                </p>
              </div>
              <Link href="/workspace/reviews" className="flex items-center justify-center w-full py-3 bg-surface-container-highest hover:bg-white/5 text-on-surface text-xs font-bold rounded-lg transition-all border border-outline-variant/20 uppercase tracking-widest">
                VER REVISÕES
              </Link>
            </div>
          )}
        </motion.div>

        {/* Today's Goals */}
        <div className="col-span-12 space-y-4 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black italic tracking-tight text-white">OBJETIVOS DO DIA</h3>
            <span className="text-primary text-xs font-bold tracking-widest uppercase">{completedObjectivesCount} DE {objectives.length} CONCLUÍDOS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {objectives.length > 0 ? (
              objectives.map((item) => (
                <Link key={item.id} href={item.href} className={`p-6 rounded-xl border flex items-center justify-between group transition-all ${item.accent ? "bg-surface-container border-primary/40 shadow-[0_0_15px_rgba(129,236,255,0.1)]" : "bg-surface-container-low border-outline-variant/5 hover:border-primary/20"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded flex items-center justify-center ${item.done ? "bg-primary/10" : "bg-primary/5"}`}>
                      {item.done ? <CheckCircle2 size={18} className="text-primary" /> : <Circle size={18} className="text-on-surface-variant" />}
                    </div>
                    <div className="flex flex-col max-w-[124px] sm:max-w-[180px]">
                      <p className="text-sm font-bold text-white truncate w-full">{item.title}</p>
                      <p className={`text-[10px] font-bold uppercase truncate w-full ${item.accent ? "text-primary" : "text-on-surface-variant"}`}>{item.subtitle}</p>
                    </div>
                  </div>
                  {item.accent && <ChevronRight size={14} className="text-primary shrink-0" />}
                </Link>
              ))
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low/20 px-6 py-10 text-center text-sm text-on-surface-variant">
                Sem objetivos ativos agora. Abra tarefas ou revisões para montar o próximo ciclo.
              </div>
            )}
          </div>
        </div>

        {/* Neural Analytics */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-container-low/50 rounded-2xl p-8 border border-outline-variant/5 w-full">
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold tracking-tight mb-4 text-white">Análise Neural</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Sua retenção de memória e ritmo de aprendizado consolidados em tempo real. Continue focado em manter The Streak.
            </p>
            <div className="w-full h-32 mt-6 rounded-lg opacity-80 mix-blend-screen bg-gradient-to-t from-primary/10 to-transparent border-b border-primary/20 relative">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline points="0,100 0,80 20,60 40,70 60,30 80,40 100,10 100,100" fill="rgba(129,236,255,0.1)" />
                <polyline points="0,80 20,60 40,70 60,30 80,40 100,10" fill="none" stroke="#81ecff" strokeWidth="2" className="neon-glow" />
              </svg>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {focusStats.map((item) => (
              <motion.div whileHover={hoverLift} transition={transition} key={item.label} className="bg-surface-container-highest/40 p-6 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b-0">
                  {item.icon}
                  <span className="text-xs font-bold text-primary">{item.metric}</span>
                </div>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-0">{item.label}</p>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden mt-3">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    className="h-full bg-primary neon-glow"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
