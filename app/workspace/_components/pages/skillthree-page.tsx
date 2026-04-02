"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Award,
  Cpu,
  Flame,
  Gauge,
  LucideIcon,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MetricCard,
  Pill,
  ProgressBar,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import {
  fadeUpVariants,
  useStableReducedMotion,
} from "@/app/components/ui/motion-system";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import type {
  SkillThreeAchievementState,
  SkillThreeExperience,
  SkillThreeLeaderboardScope,
  SkillThreeNodeState,
} from "@/utils/skillthree/types";

const iconMap: Record<string, LucideIcon> = {
  activity: Activity,
  award: Award,
  cpu: Cpu,
  flame: Flame,
  gauge: Gauge,
  sparkles: Sparkles,
  trophy: Trophy,
  volume2: Volume2,
  volumex: VolumeX,
  zap: Zap,
};

function resolveIcon(key: string) {
  const normalized = key.replace(/-/g, "_").toLowerCase();
  return iconMap[normalized] ?? Sparkles;
}

function renderIcon(key: string, size = 18) {
  const Icon = resolveIcon(key);
  return <Icon size={size} />;
}

function formatXp(value: number) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

export function SkillThreePage() {
  const { data, saveSkillThreeState } = useWorkspace();
  const skillThree = data!.skillThree;
  const reducedMotion = useStableReducedMotion();
  const router = useRouter();
  const [leaderboardScope, setLeaderboardScope] =
    useState<SkillThreeLeaderboardScope>("global");
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SkillThreeNodeState | null>(null);
  const [zoom, setZoom] = useState(1);

  const leaderboard =
    skillThree.leaderboardByScope[
      leaderboardScope === "track" && !skillThree.activeTrack ? "global" : leaderboardScope
    ];

  const toggleSound = async () => {
    await saveSkillThreeState({
      sound_enabled: !(skillThree.playerState?.sound_enabled ?? true),
    });
  };

  if (!skillThree.activeTrack) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUpVariants(reducedMotion, 20)}
        className="space-y-8"
      >
        <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.36)] sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(129,236,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(0,227,253,0.12),transparent_26%)]" />
          <div className="relative flex flex-col gap-8">
            <div className="max-w-3xl space-y-4">
              <Pill tone="primary">{"SKILLTHREE // FIRST LINK"}</Pill>
              <h1 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-[4rem]">
                Defina sua formação no perfil para ligar o núcleo competitivo do CodeTrail.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
                A SkillThree agora reflete a formação configurada em{" "}
                <span className="text-white">Configurações &gt; Editar conta</span>.
                É ela que define a árvore, as conquistas, as missões prioritárias
                e o eixo visual da progressão.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.34)] sm:p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">
                  PROFILE CONTROL
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                  A formação da SkillThree é configurada no seu perfil.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
                  Ajuste a formação em Configurações para atualizar a árvore, o leaderboard
                  por formação e os achievements exclusivos sem depender de um seletor dentro da feature.
                </p>
              </div>
              <div className="flex flex-col justify-between gap-4 rounded-[28px] bg-white/[0.03] p-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                    Próximo passo
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Abra o perfil, escolha entre Dev Fullstack ou Engenheiro de Dados e volte para liberar o command center.
                  </p>
                </div>
                <button
                  type="button"
                  className="workspace-button workspace-button--primary w-full justify-center"
                  onClick={() => router.push("/workspace/settings")}
                >
                  Abrir perfil
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUpVariants(reducedMotion, 20)}
        className="space-y-8"
      >
         {/* HEADER COM STATS */}
         <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-3">
               <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase">Development Path</span>
               <div className="h-px w-12 bg-primary/30" />
             </div>
             <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-white leading-none">
               SKILL_ARCHITECTURE
             </h1>
           </div>
           <div className="flex gap-3 flex-shrink-0">
             <div className="bg-[#1a1a1a] border border-white/[0.05] p-4 rounded-lg flex items-center gap-4 w-[200px]">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                 <Zap size={18} className="text-primary" />
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] text-[#adaaaa] font-black uppercase tracking-widest leading-tight mb-0.5">XP Points</p>
                 <p className="text-lg font-black text-white truncate">{formatXp(skillThree.totalXp)}</p>
               </div>
             </div>
             <div className="bg-[#1a1a1a] border border-white/[0.05] p-4 rounded-lg flex items-center gap-4 w-[200px]">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                 <Gauge size={18} className="text-primary" />
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] text-[#adaaaa] font-black uppercase tracking-widest leading-tight mb-0.5">Rank</p>
                 <p className="text-lg font-black text-white truncate">Lv. {skillThree.level.level}</p>
               </div>
             </div>
           </div>
         </header>

        {/* MAIN GRID: 8 col skill tree + 4 col sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SKILL TREE - 66% */}
          <section className="lg:col-span-8">
            <div className="bg-[#131313] rounded-2xl border border-white/[0.05] overflow-hidden relative min-h-[700px] flex flex-col">
              <div className="p-6 border-b border-white/[0.05] flex justify-between items-center bg-[#1a1a1a]/40 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <Sparkles size={18} className="text-primary" />
                  <h2 className="font-black tracking-wide text-white uppercase text-sm">Interactive Skill Web</h2>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 bg-primary/10 text-primary text-[9px] font-black rounded-full border border-primary/20 tracking-wider">
                    ACTIVE_PATH: {skillThree.activeTrack.commandLabel}
                  </span>
                </div>
              </div>
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#81ecff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
              <SkillThreeCanvas nodes={skillThree.skillTree} zoom={zoom} onSelectNode={setSelectedNode} />
              
              {/* FOOTER STATS */}
              <div className="p-6 bg-[#1a1a1a]/20 border-t border-white/[0.05] grid grid-cols-3 gap-4">
                <div className="text-center border-r border-white/[0.05]">
                  <p className="text-[9px] text-[#adaaaa] uppercase font-black tracking-wider mb-2">Nodes Unlocked</p>
                  <p className="text-xl font-black text-white">{skillThree.formationProgress.masteredNodes} / {skillThree.formationProgress.totalNodes}</p>
                </div>
                <div className="text-center border-r border-white/[0.05]">
                  <p className="text-[9px] text-[#adaaaa] uppercase font-black tracking-wider mb-2">Mastery Points</p>
                  <p className="text-xl font-black text-primary">{formatXp(skillThree.totalXp)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-[#adaaaa] uppercase font-black tracking-wider mb-2">Next Unlock</p>
                  <p className="text-xl font-black text-white">
                    {skillThree.level.nextLevelXp
                      ? `${formatXp(skillThree.level.nextLevelXp - skillThree.totalXp)} XP`
                      : "MAX"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SIDEBAR - 33% */}
          <aside className="lg:col-span-4 space-y-8">
            {/* DAILY KATAS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  <h3 className="text-sm font-black tracking-wider uppercase">Daily Katas</h3>
                </div>
                <button type="button" className="text-[10px] text-primary hover:text-primary/80 font-black tracking-wide" onClick={() => setAchievementsOpen(true)}>
                  VIEW_ALL
                </button>
              </div>
               <div className="space-y-3">
                 {skillThree.dailyMissions.slice(0, 2).map((mission, idx) => (
                   <div key={mission.instanceId} className="group bg-[#1a1a1a] hover:bg-[#1f1f1e] border border-white/[0.08] hover:border-primary/30 rounded-lg p-4 transition-all flex items-center gap-3 cursor-pointer">
                     <div className="w-12 h-12 rounded-lg bg-[#262626] flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0 text-primary">
                       {renderIcon(idx === 0 ? "zap" : "cpu", 18)}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start gap-2">
                         <h4 className="text-xs font-black text-white tracking-tight truncate">{mission.title}</h4>
                         <span className={`text-[8px] font-black ${mission.completed ? 'text-primary bg-primary/10 border border-primary/30' : 'text-[#ff6b6b] bg-[#ff6b6b]/10 border border-[#ff6b6b]/30'} px-1.5 py-0.5 rounded-sm flex-shrink-0 whitespace-nowrap`}>
                           {mission.completed ? 'DONE' : 'HARD'}
                         </span>
                       </div>
                       <p className="text-[10px] text-[#adaaaa] mt-0.5 line-clamp-1">{mission.description}</p>
                       <div className="flex items-center gap-3 mt-1.5">
                         <span className="text-[9px] text-primary font-black">
                           +{mission.rewardXp} XP
                         </span>
                         <span className="text-[9px] text-[#adaaaa]">
                           {Math.round(mission.progressPercent)}% done
                         </span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* LEADERBOARD */}
            <div className="bg-[#131313] border border-white/[0.05] rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/[0.05] bg-[#1a1a1a]/40">
                <h3 className="text-sm font-black tracking-wider uppercase mb-1">Top Operators</h3>
                <p className="text-[10px] text-[#adaaaa] font-medium">Global System Ranking // V_2.0</p>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  {leaderboard.topThree.map((entry, index) => (
                    <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${entry.isCurrentUser ? 'bg-primary/5 border border-primary/10' : 'hover:bg-white/[0.02]'}`}>
                      <span className={`text-xs font-black ${entry.isCurrentUser ? 'text-primary' : 'text-primary/40'} w-6 text-center`}>{String(index + 1).padStart(2, '0')}</span>
                      <div className={`w-8 h-8 rounded-full border flex-shrink-0 ${entry.isCurrentUser ? 'border-primary shadow-[0_0_10px_rgba(129,236,255,0.3)]' : 'border-white/10'} bg-primary/10`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white truncate">{entry.name}</p>
                        <p className="text-[9px] text-[#adaaaa] font-medium">{entry.isCurrentUser ? 'YOU' : `Lv. ${entry.level}`}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] font-black text-primary tracking-tight">{formatXp(entry.weeklyXp)} XP</p>
                        <div className="flex gap-0.5 justify-end mt-0.5">
                          <div className="w-1 h-1 bg-primary rounded-full"></div>
                          <div className={`w-1 h-1 ${entry.isCurrentUser ? 'bg-primary' : 'bg-white/20'} rounded-full`}></div>
                          <div className={`w-1 h-1 ${index === 0 ? 'bg-primary' : 'bg-white/20'} rounded-full`}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" className="w-full p-4 bg-[#1a1a1a] hover:bg-[#20201f] text-[10px] font-black text-[#adaaaa] tracking-[0.15em] transition-all uppercase border-t border-white/[0.05]" onClick={() => setLeaderboardOpen(true)}>
                Full Leaderboard View
              </button>
            </div>

            {/* MASTERY MEDALS */}
            <div className="bg-[#131313] border border-white/[0.05] rounded-2xl p-6">
              <h3 className="text-sm font-black tracking-wider uppercase mb-4">Mastery Medals</h3>
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((idx) => {
                  const achievement = skillThree.unlockedAchievements[idx];
                  const isUnlocked = achievement && achievement.status !== "locked";
                  
                  return (
                    <div 
                      key={idx}
                      className={`aspect-square rounded-lg bg-[#262626] flex items-center justify-center group cursor-help relative transition-all hover:bg-primary/10 ${!isUnlocked ? 'opacity-30 grayscale' : 'hover:shadow-[0_0_12px_rgba(129,236,255,0.2)]'}`}
                    >
                      {renderIcon(achievement?.icon || "sparkles", 22)}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </motion.div>

      <SkillThreeModals
        skillThree={skillThree}
        achievementsOpen={achievementsOpen}
        leaderboardOpen={leaderboardOpen}
        selectedNode={selectedNode}
        leaderboardScope={leaderboardScope}
        leaderboard={leaderboard}
        onCloseAchievements={() => setAchievementsOpen(false)}
        onCloseLeaderboard={() => setLeaderboardOpen(false)}
        onCloseNode={() => setSelectedNode(null)}
        onChangeScope={setLeaderboardScope}
      />
    </>
  );
}

function SkillThreeCanvas({
  nodes,
  zoom,
  onSelectNode,
}: {
  nodes: SkillThreeNodeState[];
  zoom: number;
  onSelectNode: (node: SkillThreeNodeState) => void;
}) {
  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  return (
    <div className="relative overflow-hidden flex-1 flex flex-col">
      <div className="relative flex-1 overflow-x-auto overflow-y-hidden px-2 py-5">
        <div
          className="mx-auto h-[600px] min-w-[860px] origin-top transition-transform duration-200 relative"
          style={{ transform: `scale(${zoom})` }}
        >
          <svg 
            className="absolute inset-0 h-full w-full opacity-80 pointer-events-none" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(129,236,255)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(0,227,253)" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {nodes.flatMap((node) =>
              node.prerequisites.map((prerequisite) => {
                const source = nodeMap.get(prerequisite);
                if (!source) return null;
                
                const isLocked = node.status === "locked";
                const opacity = isLocked ? 0.12 : 0.22;
                
                return (
                  <line
                    key={`${prerequisite}-${node.id}`}
                    x1={source.x}
                    y1={source.y}
                    x2={node.x}
                    y2={node.y}
                    stroke={`rgba(129,236,255,${opacity})`}
                    strokeWidth={isLocked ? 0.2 : 0.3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              }),
            )}
          </svg>

          {nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectNode(node)}
              className="absolute text-left"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <CanvasNode node={node} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CanvasNode({ node }: { node: SkillThreeNodeState }) {
  const isCore = node.size === "core";
  
  let borderColor = "border-white/10";
  let bgColor = "bg-[#1a1a1a]";
  let glow = "";
  
  if (node.status === "mastered") {
    borderColor = "border-primary";
    bgColor = "bg-[#1a1a1a]";
    glow = "shadow-[0_0_20px_rgba(129,236,255,0.4)]";
  } else if (node.status === "in_progress") {
    borderColor = "border-[#00e3fd]";
    bgColor = "bg-[#1a1a1a]";
    glow = "shadow-[0_0_12px_rgba(0,227,253,0.3)]";
  } else if (node.status === "locked") {
    borderColor = "border-white/5";
    bgColor = "bg-[#1a1a1a]";
    glow = "opacity-35 grayscale";
  }

  const sizeClass = isCore ? "h-[120px] w-[120px] rounded-full" : "w-[175px] rounded-lg px-3 py-3";

  return (
    <motion.div
      whileHover={node.status !== "locked" ? { y: -3, scale: 1.012 } : undefined}
      className={`relative overflow-hidden border ${borderColor} ${bgColor} ${glow} ${sizeClass} flex flex-col transition-all duration-200`}
    >
      {isCore && (
        <div className="absolute -inset-4 rounded-full border border-primary/20 animate-pulse" />
      )}
      <div className="relative flex h-full flex-col justify-between gap-2">
        {!isCore && (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/14 bg-primary/10 text-primary text-sm flex-shrink-0">
                {renderIcon(node.icon, 15)}
              </div>
              <span className="text-[7px] font-black uppercase text-primary bg-primary/10 px-1 py-0.5 rounded whitespace-nowrap">
                {node.status === "mastered" ? "MASTERED" : node.status === "in_progress" ? "IN" : "LOCK"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold tracking-tight text-white line-clamp-2">{node.shortLabel}</h4>
            </div>
            <div className="mt-auto">
              <ProgressBar value={node.progressPercent} />
            </div>
          </>
        )}
        {isCore && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-1">
              <div className="text-3xl text-primary">{renderIcon(node.icon, 32)}</div>
              <span className="text-[7px] font-black uppercase text-white tracking-wider">Core</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SkillThreeModals({
  skillThree,
  achievementsOpen,
  leaderboardOpen,
  selectedNode,
  leaderboardScope,
  leaderboard,
  onCloseAchievements,
  onCloseLeaderboard,
  onCloseNode,
  onChangeScope,
}: {
  skillThree: SkillThreeExperience;
  achievementsOpen: boolean;
  leaderboardOpen: boolean;
  selectedNode: SkillThreeNodeState | null;
  leaderboardScope: SkillThreeLeaderboardScope;
  leaderboard: SkillThreeExperience["leaderboardByScope"]["global"];
  onCloseAchievements: () => void;
  onCloseLeaderboard: () => void;
  onCloseNode: () => void;
  onChangeScope: (scope: SkillThreeLeaderboardScope) => void;
}) {
  return (
    <>
      <WorkspaceModal
        open={achievementsOpen}
        onClose={onCloseAchievements}
        title="Achievement Matrix"
        subtitle="Catálogo vivo da sua progressão universal e da formação ativa."
        size="xl"
        eyebrow="SkillThree Registry"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {skillThree.achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </WorkspaceModal>

      <WorkspaceModal
        open={leaderboardOpen}
        onClose={onCloseLeaderboard}
        title="Leaderboard"
        subtitle="Leitura completa do ranking global, semanal e por formação."
        size="lg"
        eyebrow="Competition Layer"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {(["global", "weekly", "track"] as SkillThreeLeaderboardScope[]).map((scope) => (
            <button
              key={scope}
              type="button"
              className={scope === leaderboardScope ? "workspace-button workspace-button--primary" : "workspace-button workspace-button--ghost"}
              onClick={() => onChangeScope(scope)}
            >
              {scope === "global" ? "Global" : scope === "weekly" ? "Semanal" : "Formação"}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {leaderboard.entries.map((entry, index) => (
            <LeaderboardRow key={`${entry.id}-${leaderboardScope}`} entry={entry} position={index + 1} />
          ))}
        </div>
      </WorkspaceModal>

      <WorkspaceModal
        open={Boolean(selectedNode)}
        onClose={onCloseNode}
        title={selectedNode?.label ?? "Node"}
        subtitle={selectedNode?.description}
        size="md"
        eyebrow={selectedNode?.domain ?? "Skill Tree"}
      >
        {selectedNode ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                label="Status"
                value={selectedNode.status.toUpperCase()}
                helper={selectedNode.remainingLabel}
                icon={<Cpu size={18} />}
              />
              <MetricCard
                label="Reward"
                value={`+${selectedNode.rewardXp} XP`}
                helper={`Lv. recomendado ${selectedNode.recommendedLevel}`}
                icon={<Zap size={18} />}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-secondary">
                  Progresso do node
                </span>
                <span className="text-sm font-bold text-primary">
                  {selectedNode.remainingLabel}
                </span>
              </div>
              <ProgressBar value={selectedNode.progressPercent} />
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedNode.linkedAchievementIds.map((achievementId) => {
                const achievement = skillThree.achievements.find((item) => item.id === achievementId);
                if (!achievement) return null;
                return (
                  <Pill key={achievementId} tone={achievement.status === "locked" ? "neutral" : "primary"}>
                    {achievement.name}
                  </Pill>
                );
              })}
            </div>
          </div>
        ) : null}
      </WorkspaceModal>
    </>
  );
}

function LeaderboardRow({
  entry,
  position,
}: {
  entry: SkillThreeExperience["leaderboardByScope"]["global"]["entries"][number];
  position: number;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-[22px] px-4 py-3 ${entry.isCurrentUser ? "bg-primary/10 ring-1 ring-primary/24" : "bg-white/[0.025]"}`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/16 bg-black/20 text-xs font-black text-white">
        {String(position).padStart(2, "0")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-white">{entry.name}</p>
          <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-text-secondary">
            {entry.badge}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-text-secondary">
          {`${entry.rankLabel} // LV. ${entry.level}`}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-primary">{formatXp(entry.weeklyXp)} XP</p>
        <p className="text-[11px] text-text-secondary">
          {entry.positionDelta > 0 ? `+${entry.positionDelta}` : entry.positionDelta}
        </p>
      </div>
    </div>
  );
}

function AchievementCard({
  achievement,
  compact = false,
}: {
  achievement: SkillThreeAchievementState;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[24px] bg-white/[0.03] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/18 bg-primary/10 text-primary">
          {renderIcon(achievement.icon, 18)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-white">{achievement.name}</h4>
            <Pill tone={achievement.status === "locked" ? "neutral" : "primary"}>
              {achievement.status.replace("_", " ")}
            </Pill>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-text-secondary">
            {achievement.description}
          </p>
          <div className="mt-3 space-y-2">
            <ProgressBar value={achievement.progressPercent} />
            <div className="flex items-center justify-between gap-3 text-[11px] text-text-secondary">
              <span>{achievement.remainingLabel}</span>
              <span>+{achievement.xpBonus} XP</span>
            </div>
          </div>
          {!compact ? (
            <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-primary">
              Lv. recomendado {achievement.recommendedLevel}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
