"use client";

import { fadeUpVariants, useMotionPreferences } from "@/app/components/ui/motion-system";
import { LockedFeaturePage } from "@/app/workspace/_components/pages/shared";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import { formatPercent } from "@/utils/workspace/helpers";
import type { SessionType } from "@/utils/workspace/types";
import { motion } from "framer-motion";

export function AnalyticsPage() {
  const { data } = useWorkspace();
  const { reduced, hoverLift, transition } = useMotionPreferences();

  if (!data!.featureAccess.analytics) {
    return <LockedFeaturePage title="Análises premium bloqueadas" feature="Análises" />;
  }

  const analytics = data!.analyticsSummary;
  const totalHours = analytics.hoursPerWeek.reduce((sum, item) => sum + item.value, 0);
  const deltaPercent = analytics.previousWeekHours
    ? ((analytics.currentWeekHours - analytics.previousWeekHours) / analytics.previousWeekHours) * 100
    : analytics.currentWeekHours > 0
      ? 100
      : 0;

  const radarEntries = Object.entries(analytics.byType).map(([key, value]) => ({
    label: shortTypeLabel(key as SessionType),
    value,
  }));

  const scatterPoints = analytics.hoursPerDay.slice(0, 8).map((item, index) => ({
    x: 12 + index * 11,
    y: clampPoint(74 - item.value * 8),
    size: 5 + Math.min(item.value * 1.4, 8),
  }));

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants(reduced, 18)}
      className="w-full space-y-12"
    >
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-px w-8 bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              Inteligência Operacional
            </span>
          </div>
          <h1 className="mb-2 text-5xl font-black tracking-tighter text-on-surface">Métricas de Domínio</h1>
          <p className="max-w-md text-on-surface-variant text-sm">
            Sua retenção de memória e ritmo de aprendizado consolidados em tempo real.
          </p>
        </div>
        <div className="flex gap-4">
          <motion.div whileHover={hoverLift} transition={transition} className="bg-surface-container p-4 rounded-xl border border-outline-variant/10 min-w-[160px]">
            <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-1">Tempo Total de Estudo</p>
            <p className="text-2xl font-mono text-primary">{totalHours.toFixed(1)}<span className="text-xs text-on-surface ml-1">HRS</span></p>
          </motion.div>
          <motion.div whileHover={hoverLift} transition={transition} className="bg-surface-container p-4 rounded-xl border border-outline-variant/10 min-w-[160px]">
            <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-1">Delta de Eficiência</p>
            <p className={`text-2xl font-mono ${deltaPercent >= 0 ? 'text-primary' : 'text-warning'}`}>
              {deltaPercent >= 0 ? "+" : ""}{deltaPercent.toFixed(1)}%
            </p>
          </motion.div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Learning Velocity (Line Chart) */}
        <motion.section
          whileHover={{ borderColor: "rgba(129,236,255,0.2)" }}
          transition={transition}
          className="lg:col-span-8 bg-surface-container rounded-2xl border border-outline-variant/10 p-8 relative overflow-hidden group"
        >
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Velocidade de Aprendizado</h3>
              <p className="text-on-surface-variant text-sm">Curva de Aquisição Semanal Recente</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">TEMPO REAL</span>
            </div>
          </div>
          <LineChart data={analytics.hoursPerWeek.length ? analytics.hoursPerWeek : analytics.hoursPerDay} />
        </motion.section>

        {/* Topic Mastery (Radar Chart) */}
        <motion.section
          whileHover={{ borderColor: "rgba(129,236,255,0.2)" }}
          transition={transition}
          className="lg:col-span-4 bg-surface-container rounded-2xl border border-outline-variant/10 p-8 flex flex-col items-center"
        >
          <div className="w-full mb-8">
            <h3 className="text-lg font-bold text-on-surface">Domínio por Tópico</h3>
            <p className="text-on-surface-variant text-sm">Distribuição de Competências</p>
          </div>
          <RadarChart items={radarEntries} />
        </motion.section>

        {/* Cognitive Load vs Study Hours (Scatter Plot) */}
        <motion.section
          whileHover={{ borderColor: "rgba(129,236,255,0.2)" }}
          transition={transition}
          className="lg:col-span-7 bg-surface-container rounded-2xl border border-outline-variant/10 p-8 relative"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(72,72,71,0.1)_1px,transparent_1px)] [background-size:20px_20px] rounded-2xl" />
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Carga Cognitiva vs. Horas de Estudo</h3>
              <p className="text-on-surface-variant text-sm">Mapeamento de Limiar de Eficiência</p>
            </div>
          </div>
          <div className="h-[280px] w-full relative border-l border-b border-white/10 mt-4">
            <ScatterChart points={scatterPoints} />
            <span className="absolute -left-10 top-1/2 -translate-y-1/2 text-[10px] -rotate-90 text-on-surface-variant font-mono uppercase">Carga %</span>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-on-surface-variant font-mono uppercase">Duração (Horas)</span>
          </div>
        </motion.section>

        {/* Projects vs Reviews Breakdown */}
        <motion.section
          whileHover={{ borderColor: "rgba(129,236,255,0.2)" }}
          transition={transition}
          className="lg:col-span-5 bg-surface-container rounded-2xl border border-outline-variant/10 p-8"
        >
          <h3 className="text-lg font-bold text-on-surface mb-2">Alocação de Recursos</h3>
          <p className="text-on-surface-variant text-sm mb-10">Projetos vs. Recall Ativo</p>
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-sm font-bold text-white">Projetos Lab</p>
                    <p className="text-xs text-on-surface-variant">Criação e construção ativa</p>
                  </div>
                </div>
                <p className="text-2xl font-mono text-primary">{Math.round(analytics.focusBalancePercent)}%</p>
              </div>
              <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${analytics.focusBalancePercent}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-primary-container shadow-[0_0_8px_rgba(129,236,255,0.5)]"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-slate-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-bold text-slate-300">Revisões do Sistema</p>
                    <p className="text-xs text-on-surface-variant">Flashcards e Testes de Conhecimento</p>
                  </div>
                </div>
                <p className="text-2xl font-mono text-slate-300">{Math.round(100 - analytics.focusBalancePercent)}%</p>
              </div>
              <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${100 - analytics.focusBalancePercent}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-slate-500"
                />
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-white/5 bg-white/5 rounded-xl p-4 flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
              <div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <strong className="text-on-surface uppercase">Insights:</strong> Seu melhor bloco aparece quando focado {" "}
                  em {(analytics.focusBalancePercent > 50 ? "Prática" : "Revisão")}.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Secondary Analytics Row */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div whileHover={hoverLift} transition={transition} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-1">Sessões de Foco</p>
              <h4 className="text-3xl font-black text-on-surface">{analytics.consistencyDays}</h4>
              <p className="text-xs text-tertiary mt-1">Dias no último mês</p>
            </div>
            <span className="material-symbols-outlined text-4xl text-white/5" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
          </motion.div>

          <motion.div whileHover={hoverLift} transition={transition} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-1">Taxa de Sucesso</p>
              <h4 className="text-3xl font-black text-on-surface">{formatPercent(analytics.completedTaskRate * 100, 1)}</h4>
              <p className="text-xs text-tertiary mt-1">Conclusão de Tarefas</p>
            </div>
            <span className="material-symbols-outlined text-4xl text-white/5" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </motion.div>

          <motion.div whileHover={hoverLift} transition={transition} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-1">Troca de Contextos</p>
              <h4 className="text-3xl font-black text-on-surface">{Math.max(0, analytics.completedReviews - analytics.completedProjects)}</h4>
              <p className="text-xs text-on-surface-variant mt-1">Entre tarefas</p>
            </div>
            <span className="material-symbols-outlined text-4xl text-white/5" style={{ fontVariationSettings: "'FILL' 1" }}>swap_horiz</span>
          </motion.div>
        </div>

      </div>
    </motion.main>
  );
}

function LineChart({ data }: { data: Array<{ label: string; value: number }> }) {
  if (!data.length) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center rounded-[24px] border border-dashed border-outline-variant/20 bg-surface-container-highest/20 text-sm text-text-secondary">
        Registre mais sessões para liberar a curva de aprendizado.
      </div>
    );
  }

  const max = Math.max(...data.map((item) => item.value), 1);
  const path = data
    .map((item, index) => {
      const x = data.length === 1 ? 0 : (index / (data.length - 1)) * 800; // Map to 0-800 for SVG
      const y = 300 - (item.value / max) * 260; // Map to 40-300
      return `${x},${y}`;
    })
    .join(" L ");

  const fillPath = `M 0,300 L ${path} L 800,300 Z`;

  return (
    <div className="h-[300px] w-full relative flex items-end justify-between">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(72,72,71,0.1)_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <svg className="absolute inset-0 w-full h-full p-4 overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 300">
        <defs>
          <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#81ecff" stopOpacity="0.3"></stop>
            <stop offset="100%" stopColor="#81ecff" stopOpacity="0"></stop>
          </linearGradient>
        </defs>

        <motion.path
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="drop-shadow-[0_0_8px_rgba(129,236,255,0.6)]"
          d={`M ${path}`}
          fill="none"
          stroke="#81ecff"
          strokeLinecap="round"
          strokeWidth="3"
        />

        <motion.path
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          d={fillPath}
          fill="url(#lineGrad)"
        />

        {data.map((item, index) => {
          const x = data.length === 1 ? 0 : (index / (data.length - 1)) * 800;
          const y = 300 - (item.value / max) * 260;
          const isLatest = index === data.length - 1;

          return (
            <motion.circle
              key={item.label}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + index * 0.1 }}
              cx={x}
              cy={y}
              fill="#81ecff"
              r={isLatest ? "6" : "4"}
              className={isLatest ? "animate-pulse" : ""}
            />
          );
        })}
      </svg>

      <div className="absolute inset-x-0 bottom-0 top-[310px] flex justify-between px-4 z-10">
        {data.map((item) => (
          <div key={item.label} className="text-[10px] text-on-surface-variant font-mono uppercase">{item.label}</div>
        ))}
      </div>
    </div>
  );
}

function RadarChart({ items }: { items: Array<{ label: string; value: number }> }) {
  const trimmed = items.slice(0, 5);
  // Guarantee 5 points so the pentagon shape holds, pad with 0 if necessary
  while (trimmed.length < 5) {
    trimmed.push({ label: `N/A ${trimmed.length + 1}`, value: 0 });
  }

  const max = Math.max(...trimmed.map((item) => item.value), 1);
  const points = trimmed.map((item, index) => {
    const angle = -Math.PI / 2 + (index / trimmed.length) * Math.PI * 2;
    const radius = 62 * (item.value / max); // scale 0-62 from center (100,100)
    return {
      ...item,
      x: 100 + Math.cos(angle) * (radius + 20), // inner shape padding
      y: 100 + Math.sin(angle) * (radius + 20),
      labelX: 100 + Math.cos(angle) * 90,
      labelY: 100 + Math.sin(angle) * 90,
    };
  });

  return (
    <div className="relative w-full aspect-square flex items-center justify-center p-4">
      <svg className="w-full h-full opacity-20" viewBox="0 0 200 200">
        <polygon fill="none" points="100,20 180,80 150,180 50,180 20,80" stroke="white" strokeWidth="1"></polygon>
        <polygon fill="none" points="100,50 160,95 140,160 60,160 40,95" stroke="white" strokeWidth="1"></polygon>
        <polygon fill="none" points="100,80 130,105 120,140 80,140 70,105" stroke="white" strokeWidth="1"></polygon>
        <line stroke="white" x1="100" x2="100" y1="100" y2="20"></line>
        <line stroke="white" x1="100" x2="180" y1="100" y2="80"></line>
        <line stroke="white" x1="100" x2="150" y1="100" y2="180"></line>
        <line stroke="white" x1="100" x2="50" y1="100" y2="180"></line>
        <line stroke="white" x1="100" x2="20" y1="100" y2="80"></line>
      </svg>

      <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 200 200">
        <motion.polygon
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, type: "spring" }}
          style={{ originX: 0.5, originY: 0.5 }}
          fill="rgba(129, 236, 255, 0.2)"
          points={points.map(p => `${p.x},${p.y}`).join(" ")}
          stroke="#81ecff"
          strokeWidth="2"
        />
      </svg>

      {points.map((item) => (
        <span
          key={item.label}
          style={{ left: `${item.labelX / 2}%`, top: `${item.labelY / 2}%` }}
          className="absolute text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ScatterChart({ points }: { points: Array<{ x: number; y: number; size: number }> }) {
  return (
    <>
      {points.map((point, index) => {
        const isFocus = index % 3 === 0;
        return (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, type: "spring" }}
            className={`absolute rounded-full border border-primary ${isFocus ? "bg-primary/60 shadow-[0_0_15px_rgba(129,236,255,0.6)]" : "bg-primary/40 shadow-[0_0_10px_rgba(129,236,255,0.4)]"}`}
            style={{
              left: `${point.x}%`,
              bottom: `${point.y}%`,
              width: point.size,
              height: point.size,
            }}
          />
        );
      })}
    </>
  );
}

function shortTypeLabel(type: SessionType) {
  switch (type) {
    case "theory":
      return "Teoria";
    case "practice":
      return "Prática";
    case "review":
      return "Revisão";
    case "project":
      return "Projeto";
    case "exercises":
      return "Exercícios";
    default:
      return type;
  }
}

function clampPoint(value: number) {
  return Math.max(6, Math.min(84, value));
}
