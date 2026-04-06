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
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pill,
  ProgressBar,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import {
  fadeUpVariants,
  useStableReducedMotion,
} from "@/app/components/ui/motion-system";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import { buildSkillThreeExperience } from "@/utils/skillthree/build-skillthree";
import { formatSkillThreeXp } from "@/utils/skillthree/progression";
import type {
   SkillThreeAchievementState,
   SkillThreeExperience,
   SkillThreeLeaderboardScope,
   SkillThreeNodeState,
   SkillThreeMissionState,
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

export function SkillThreePage() {
  const { data } = useWorkspace();
  const skillThree = useMemo(() => buildSkillThreeExperience(data), [data]);
  const reducedMotion = useStableReducedMotion();
  const router = useRouter();
  const activeTrackId = skillThree.activeTrack?.id ?? null;
   const [leaderboardScope, setLeaderboardScope] =
     useState<SkillThreeLeaderboardScope>("global");
   const [achievementsOpen, setAchievementsOpen] = useState(false);
   const [leaderboardOpen, setLeaderboardOpen] = useState(false);
   const [selectedNode, setSelectedNode] = useState<SkillThreeNodeState | null>(null);
   const [selectedMission, setSelectedMission] = useState<SkillThreeMissionState | null>(null);
   const zoom = 1;
   const [leaderboardByScope, setLeaderboardByScope] = useState(skillThree.leaderboardByScope);
   const [leaderboardSource, setLeaderboardSource] = useState("fallback");

  useEffect(() => {
    setLeaderboardByScope(skillThree.leaderboardByScope);
    setLeaderboardSource("fallback");
  }, [skillThree]);

  useEffect(() => {
    if (!activeTrackId || !data?.profile?.id) {
      return;
    }

    let active = true;

    async function loadLeaderboard() {
      try {
        const response = await fetch("/api/skillthree/leaderboard", {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);

        if (
          !active ||
          !response.ok ||
          !payload ||
          typeof payload !== "object" ||
          !("leaderboardByScope" in payload)
        ) {
          return;
        }

        setLeaderboardByScope(payload.leaderboardByScope);
        setLeaderboardSource(
          "source" in payload && payload.source === "live" ? "live" : "fallback",
        );
      } catch {
        // Mantem o fallback local sem quebrar a tela.
      }
    }

    void loadLeaderboard();

    return () => {
      active = false;
    };
  }, [activeTrackId, data?.profile?.id]);

  const leaderboard =
    leaderboardByScope[
      leaderboardScope === "track" && !skillThree.activeTrack ? "global" : leaderboardScope
    ];

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
               <Pill tone="primary">{"SKILLTHREE // PRIMEIRO PASSO"}</Pill>
               <h1 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-[4rem]">
                 Configure sua formação no perfil para ativar o núcleo competitivo do CodeTrail.
               </h1>
               <p className="max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
                 O SkillThree agora reflete a formação configurada em{" "}
                 <span className="text-white">Configurações &gt; Editar perfil</span>.
                 Ela define a árvore de habilidades, as conquistas, as missões prioritárias
                 e o eixo visual da sua progressão.
               </p>
             </div>
             <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
               <div className="rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.34)] sm:p-7">
                 <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">
                   CONTROLE DE PERFIL
                 </p>
                 <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                   A formação do SkillThree é configurada no seu perfil.
                 </h2>
                 <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
                   Ajuste sua formação em Configurações para atualizar a árvore de habilidades, o ranking
                   por formação e as conquistas exclusivas sem depender de um seletor dentro da feature.
                 </p>
               </div>
               <div className="flex flex-col justify-between gap-4 rounded-[28px] bg-white/[0.03] p-6">
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                     Próximo passo
                   </p>
                   <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                     Abra seu perfil, escolha entre Dev Fullstack ou Engenheiro de Dados e volte para liberar o centro de controle.
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
               <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase">Caminho de Desenvolvimento</span>
               <div className="h-px w-12 bg-primary/30" />
             </div>
             <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-white leading-none">
               ARQUITETURA DE HABILIDADES
             </h1>
           </div>
           <div className="flex gap-3 flex-shrink-0">
             <div className="bg-[#1a1a1a] border border-white/[0.05] p-4 rounded-lg flex items-center gap-4 w-[200px]">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                 <Zap size={18} className="text-primary" />
               </div>
               <div className="min-w-0">
                  <p className="text-[10px] text-[#adaaaa] font-black uppercase tracking-widest leading-tight mb-0.5">Pontos XP</p>
                 <p className="text-lg font-black text-white truncate">{formatSkillThreeXp(skillThree.totalXp)}</p>
               </div>
             </div>
             <div className="bg-[#1a1a1a] border border-white/[0.05] p-4 rounded-lg flex items-center gap-4 w-[200px]">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                 <Gauge size={18} className="text-primary" />
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] text-[#adaaaa] font-black uppercase tracking-widest leading-tight mb-0.5">Classificação</p>
                 <p className="text-lg font-black text-white truncate">Nv. {skillThree.level.level}</p>
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
                   <h2 className="font-black tracking-wide text-white uppercase text-sm">Rede de Habilidades Interativa</h2>
                 </div>
                 <div className="flex gap-2">
                   <span className="px-3 py-1.5 bg-primary/10 text-primary text-[9px] font-black rounded-full border border-primary/20 tracking-wider">
                     CAMINHO ATIVO: {skillThree.activeTrack.commandLabel}
                   </span>
                 </div>
               </div>
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#81ecff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
               <SkillThreeCanvas nodes={skillThree.skillTree} zoom={zoom} onSelectNode={setSelectedNode} />
               
               {/* FOOTER STATS */}
               <div className="p-6 bg-[#1a1a1a]/20 border-t border-white/[0.05] grid grid-cols-3 gap-4">
                 <div className="text-center border-r border-white/[0.05]">
                   <p className="text-[9px] text-[#adaaaa] uppercase font-black tracking-wider mb-2">Nós ativos</p>
                   <p className="text-xl font-black text-white">{skillThree.skillTree.filter((node) => node.status !== "locked").length} / {skillThree.formationProgress.totalNodes}</p>
                 </div>
                 <div className="text-center border-r border-white/[0.05]">
                 <p className="text-[9px] text-[#adaaaa] uppercase font-black tracking-wider mb-2">XP total</p>
                 <p className="text-xl font-black text-primary">{formatSkillThreeXp(skillThree.totalXp)}</p>
               </div>
               <div className="text-center">
                 <p className="text-[9px] text-[#adaaaa] uppercase font-black tracking-wider mb-2">Próximo Desbloqueio</p>
                 <p className="text-xl font-black text-white">
                   {skillThree.level.nextLevelXp
                      ? `${formatSkillThreeXp(skillThree.level.nextLevelXp - skillThree.totalXp)} XP`
                      : "MÁXIMO"}
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
                   <h3 className="text-sm font-black tracking-wider uppercase">Missões prioritárias</h3>
                 </div>
                 <button
                   type="button"
                   className="text-[10px] text-primary hover:text-primary/80 font-black tracking-wide"
                   onClick={() => setSelectedMission(skillThree.dailyMissions[0] ?? null)}
                 >
                   VER MISSÃO
                 </button>
               </div>
                 <div className="space-y-3">
                   {skillThree.dailyMissions.slice(0, 2).map((mission, idx) => (
                     <div key={mission.instanceId} onClick={() => setSelectedMission(mission)} className="group bg-[#1a1a1a] hover:bg-[#1f1f1e] border border-white/[0.08] hover:border-primary/30 rounded-lg p-4 transition-all flex items-center gap-3 cursor-pointer">
                       <div className="w-12 h-12 rounded-lg bg-[#262626] flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0 text-primary">
                         {renderIcon(idx === 0 ? "zap" : "cpu", 18)}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start gap-2">
                           <h4 className="text-xs font-black text-white tracking-tight truncate">{mission.title}</h4>
                          <span className={`text-[8px] font-black ${mission.completed ? 'text-primary bg-primary/10 border border-primary/30' : 'text-[#ff6b6b] bg-[#ff6b6b]/10 border border-[#ff6b6b]/30'} px-1.5 py-0.5 rounded-sm flex-shrink-0 whitespace-nowrap`}>
                            {mission.completed ? 'CONCLUÍDA' : getMissionWindowLabel(mission.window)}
                          </span>
                         </div>
                         <p className="text-[10px] text-[#adaaaa] mt-0.5 line-clamp-1">{mission.description}</p>
                         <div className="flex items-center gap-3 mt-1.5">
                           <span className="text-[9px] text-primary font-black">
                             +{mission.rewardXp} XP
                           </span>
                           <span className="text-[9px] text-[#adaaaa]">
                             {Math.round(mission.progressPercent)}% concluído
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
                 <h3 className="text-sm font-black tracking-wider uppercase mb-1">Operadores Top</h3>
                 <p className="text-[10px] text-[#adaaaa] font-medium">
                   {leaderboardSource === "live"
                     ? "Ranking real do sistema // sincronizado"
                     : "Ranking do seu perfil // aguardando sincronização global"}
                 </p>
               </div>
               <div className="p-3">
                 <div className="space-y-2">
                   {leaderboard.topThree.map((entry, index) => (
                     <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${entry.isCurrentUser ? 'bg-primary/5 border border-primary/10' : 'hover:bg-white/[0.02]'}`}>
                       <span className={`text-xs font-black ${entry.isCurrentUser ? 'text-primary' : 'text-primary/40'} w-6 text-center`}>{String(index + 1).padStart(2, '0')}</span>
                       <LeaderboardAvatar
                         entry={entry}
                         size="sm"
                         highlight={entry.isCurrentUser}
                       />
                       <div className="flex-1 min-w-0">
                         <p className="text-xs font-black text-white truncate">{entry.name}</p>
                         <p className="text-[9px] text-[#adaaaa] font-medium">{entry.isCurrentUser ? 'VOCÊ' : `Nv. ${entry.level}`}</p>
                       </div>
                       <div className="text-right flex-shrink-0">
                         <p className="text-[10px] font-black text-primary tracking-tight">{formatSkillThreeXp(entry.weeklyXp)} XP</p>
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
                 Ver Ranking Completo
               </button>
             </div>

             {/* MASTERY MEDALS */}
             <div className="bg-[#131313] border border-white/[0.05] rounded-2xl p-6">
               <h3 className="text-sm font-black tracking-wider uppercase mb-4">Medalhas de Maestria</h3>
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
         selectedMission={selectedMission}
         leaderboardScope={leaderboardScope}
         leaderboard={leaderboard}
         onCloseAchievements={() => setAchievementsOpen(false)}
         onCloseLeaderboard={() => setLeaderboardOpen(false)}
         onCloseNode={() => setSelectedNode(null)}
         onCloseMission={() => setSelectedMission(null)}
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
  const nodeLayout = useMemo(() => {
    const coreNode = nodes.find((node) => node.size === "core");
    const nonCoreNodes = nodes.filter((node) => node.size !== "core");
    const positions = new Map<string, { x: number; y: number }>();

    if (coreNode) {
      positions.set(coreNode.id, { x: 50, y: 50 });
    }

    const rings = buildNodeRings(nonCoreNodes);
      const ringCount = Math.max(rings.length, 1);
      const minRadius = ringCount === 1 ? (nonCoreNodes.length <= 4 ? 27 : 31) : ringCount === 2 ? 24 : 20;
      const maxRadius = ringCount === 1 ? 33 : 42;

    rings.forEach((ring, ringIndex) => {
      const radius =
        ringCount === 1
          ? 33
          : minRadius + ((maxRadius - minRadius) / Math.max(ringCount - 1, 1)) * ringIndex;
      ring.forEach((node, nodeIndex) => {
        const angle = (nodeIndex / ring.length) * Math.PI * 2 - Math.PI / 2;
        positions.set(node.id, {
          x: 50 + radius * Math.cos(angle),
          y: 50 + radius * Math.sin(angle),
        });
      });
    });

    const canvasHeight = 600 + Math.max(0, ringCount - 1) * 90;
    const canvasWidth = 860 + Math.max(0, ringCount - 1) * 180;

    return {
      positions,
      canvasHeight,
      canvasWidth,
    };
  }, [nodes]);

  return (
    <div className="relative overflow-hidden flex-1 flex flex-col">
      <div className="relative flex-1 overflow-x-auto overflow-y-hidden px-2 py-5">
        <div
          className="relative mx-auto origin-top transition-transform duration-200"
          style={{
            height: `${nodeLayout.canvasHeight}px`,
            minWidth: `${nodeLayout.canvasWidth}px`,
            transform: `scale(${zoom})`,
          }}
        >
          {/* Grid background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#81ecff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

          {nodes.map((node) => {
            const pos = nodeLayout.positions.get(node.id);
            if (!pos) return null;
            
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectNode(node)}
                className="absolute text-left transition-all duration-300"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <CanvasNode node={node} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function buildNodeRings(nodes: SkillThreeNodeState[]) {
  if (nodes.length <= 0) {
    return [];
  }

  const capacities = [6, 10, 14];
  const rings: number[] = [];
  let remaining = nodes.length;

  for (const capacity of capacities) {
    if (remaining <= 0) {
      break;
    }

    const size = Math.min(capacity, remaining);
    rings.push(size);
    remaining -= size;
  }

  while (remaining > 0) {
    const size = Math.min(16, remaining);
    rings.push(size);
    remaining -= size;
  }

  let cursor = 0;
  return rings.map((ringSize) => {
    const nextCursor = cursor + ringSize;
    const slice = nodes.slice(cursor, nextCursor);
    cursor = nextCursor;
    return slice;
  });
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

  const sizeClass = isCore ? "h-[120px] w-[120px] rounded-full" : "w-[190px] rounded-lg px-3 py-3";

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
                {getNodeStatusChipLabel(node.status)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold tracking-tight text-white line-clamp-2">{node.label}</h4>
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
              <span className="text-[7px] font-black uppercase text-white tracking-wider">Núcleo</span>
              <span className="max-w-[84px] text-center text-[9px] font-bold text-text-secondary line-clamp-2">
                {node.label}
              </span>
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
  selectedMission,
  leaderboardScope,
  leaderboard,
  onCloseAchievements,
  onCloseLeaderboard,
  onCloseNode,
  onCloseMission,
  onChangeScope,
}: {
  skillThree: SkillThreeExperience;
  achievementsOpen: boolean;
  leaderboardOpen: boolean;
  selectedNode: SkillThreeNodeState | null;
  selectedMission: SkillThreeMissionState | null;
  leaderboardScope: SkillThreeLeaderboardScope;
  leaderboard: SkillThreeExperience["leaderboardByScope"]["global"];
  onCloseAchievements: () => void;
  onCloseLeaderboard: () => void;
  onCloseNode: () => void;
  onCloseMission: () => void;
  onChangeScope: (scope: SkillThreeLeaderboardScope) => void;
}) {
  const router = useRouter();

  return (
    <>
       <WorkspaceModal
         open={achievementsOpen}
         onClose={onCloseAchievements}
         title="Matriz de Conquistas"
         subtitle="Catálogo vivo da sua progressão universal e da formação ativa."
         size="xl"
         eyebrow="Registro SkillThree"
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
         title="Ranking"
         subtitle="Leitura completa do ranking global, semanal e por formação."
         size="lg"
         eyebrow="Camada de Competição"
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
          title={selectedNode?.label ?? "Nó"}
          subtitle={selectedNode?.description}
          size="xl"
          eyebrow={selectedNode?.domain ?? "Árvore de Habilidades"}
          fullBleed
        >
          {selectedNode ? (
            <div className="bg-[#0e0e0e]/50 flex min-h-[500px] flex-col border-t border-white/[0.05] lg:flex-row">
               {/* Left Section: Hero (35%) */}
               <div className="w-full lg:w-[40%] bg-gradient-to-b from-[#1a1a1a] to-[#0e0e0e] border-b lg:border-b-0 lg:border-r border-white/[0.05] p-8 flex flex-col justify-between relative overflow-hidden">
                  {/* Background image with architecture/server theme */}
                  <div className="absolute inset-0 opacity-25">
                    {/* SVG pattern for architecture aesthetic */}
                    <svg className="w-full h-full" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <filter id="archGlow">
                          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      {/* Background */}
                      <rect width="400" height="600" fill="#1a1a1a"/>
                      {/* Server stacks */}
                      <g opacity="0.5">
                        <rect x="50" y="80" width="60" height="40" fill="none" stroke="#81ecff" strokeWidth="1"/>
                        <rect x="50" y="130" width="60" height="40" fill="none" stroke="#81ecff" strokeWidth="1"/>
                        <rect x="50" y="180" width="60" height="40" fill="none" stroke="#81ecff" strokeWidth="1"/>
                        <rect x="290" y="80" width="60" height="40" fill="none" stroke="#81ecff" strokeWidth="1"/>
                        <rect x="290" y="130" width="60" height="40" fill="none" stroke="#81ecff" strokeWidth="1"/>
                        <rect x="290" y="180" width="60" height="40" fill="none" stroke="#81ecff" strokeWidth="1"/>
                      </g>
                      {/* Network connections */}
                      <g opacity="0.3">
                        <line x1="110" y1="100" x2="290" y2="100" stroke="#81ecff" strokeWidth="0.5"/>
                        <line x1="110" y1="150" x2="290" y2="150" stroke="#81ecff" strokeWidth="0.5"/>
                        <line x1="110" y1="200" x2="290" y2="200" stroke="#81ecff" strokeWidth="0.5"/>
                        <circle cx="150" cy="150" r="3" fill="#81ecff"/>
                        <circle cx="250" cy="150" r="3" fill="#81ecff"/>
                      </g>
                      {/* Central hub */}
                      <circle cx="200" cy="350" r="50" fill="none" stroke="#81ecff" strokeWidth="1" opacity="0.4"/>
                      <circle cx="200" cy="350" r="35" fill="none" stroke="#00e3fd" strokeWidth="1" opacity="0.5"/>
                      <circle cx="200" cy="350" r="20" fill="#81ecff" opacity="0.2"/>
                      {/* Data flow paths */}
                      <path d="M 80 100 Q 140 200 200 350" fill="none" stroke="#81ecff" strokeWidth="0.5" opacity="0.3"/>
                      <path d="M 320 100 Q 260 200 200 350" fill="none" stroke="#81ecff" strokeWidth="0.5" opacity="0.3"/>
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/40 via-transparent to-[#0e0e0e]"></div>
                
                <div className="relative z-10 space-y-8">
                  {/* Status Badge Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/30 rounded-full text-[10px] font-black tracking-widest uppercase">
                        Protocolo: {selectedNode.domain}
                      </span>
                      <span className="px-3 py-1 bg-white/5 text-primary border border-white/10 rounded-full text-[10px] font-black tracking-widest uppercase">
                        +{selectedNode.rewardXp} XP
                      </span>
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                      {selectedNode.label}
                    </h2>
                  </div>
                  
                  {/* Status & Progress */}
                  <div className="space-y-4">
                    <div className="bg-primary/20 border border-primary/30 px-4 py-3 rounded-lg flex items-center gap-2">
                      <span className="text-primary font-black text-sm">✓</span>
                      <span className="text-primary font-black tracking-widest text-xs uppercase">
                        Status da habilidade: {selectedNode.status === "locked" ? "BLOQUEADO" : selectedNode.status === "available" ? "DISPONÍVEL" : selectedNode.status === "in_progress" ? "EM PROGRESSO" : selectedNode.status === "unlocked" ? "DESBLOQUEADO" : "DOMINADO"}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-[#adaaaa] uppercase font-black">Progressão de Maestria</span>
                        <span className="text-[10px] font-black text-primary">{Math.round(selectedNode.progressPercent)}%</span>
                      </div>
                      <div className="h-2 bg-[#262626] rounded-full overflow-hidden border border-white/[0.05]">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-[#00e3fd] shadow-[0_0_8px_rgba(129,236,255,0.8)]"
                          style={{ width: `${selectedNode.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Section: Details (65%) */}
              <div className="w-full lg:w-[60%] p-8 md:p-12 flex flex-col">
                <div className="space-y-8 flex-1">
                  {/* Description / Technical Overview */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-[1px] w-8 bg-primary"></div>
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest">Visão geral</h3>
                    </div>
                    <p className="text-[#adaaaa] leading-relaxed text-sm">
                      {selectedNode.description}
                    </p>
                  </div>

                  {/* Capability Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-[1px] w-8 bg-primary"></div>
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest">Leituras da habilidade</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {buildNodeInsightCards(selectedNode, skillThree).map((card) => (
                        <div key={card.title} className="bg-[#131313] border border-white/[0.05] rounded-lg p-4 hover:border-primary/30 transition-all group">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary flex-shrink-0 text-sm">
                              {renderIcon(card.icon, 16)}
                            </div>
                            <div>
                              <p className="text-xs font-black text-white">{card.title}</p>
                              <p className="text-[11px] text-[#adaaaa] mt-1">{card.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] border border-white/[0.05] rounded-xl p-6 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      {renderIcon(selectedNode.icon, 48)}
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">
                      {selectedNode.status === "mastered" ? "Métricas consolidadas" : "Indicadores do nó"}
                    </h3>
                    <div className="space-y-4">
                      {buildNodeMetricBars(selectedNode, skillThree).map((metric) => (
                        <div key={metric.label}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-[#adaaaa] uppercase font-black">{metric.label}</span>
                            <span className="text-xs font-black text-primary">{metric.value}%</span>
                          </div>
                          <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary shadow-[0_0_8px_rgba(129,236,255,0.8)]"
                              style={{ width: `${metric.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Linked Achievements */}
                  {selectedNode.linkedAchievementIds.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="h-[1px] w-8 bg-primary"></div>
                        <h3 className="text-xs font-black text-primary uppercase tracking-widest">Conquistas Relacionadas</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedNode.linkedAchievementIds.map((achievementId) => {
                          const achievement = skillThree.achievements.find((item) => item.id === achievementId);
                          if (!achievement) return null;
                          return (
                            <div key={achievementId} className="bg-[#131313] border border-white/[0.05] rounded-lg p-3">
                              <p className="text-xs font-black text-white mb-2">{achievement.name}</p>
                              <span className={`text-[8px] font-black inline-block px-2 py-1 rounded ${
                                achievement.status === "locked" ? 'text-[#adaaaa] bg-white/5' : 'text-primary bg-primary/10'
                              }`}>
                                {achievement.status === "locked" ? "BLOQUEADA" : "DESBLOQUEADA"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Meta Info & Action */}
                <div className="pt-8 space-y-4 border-t border-white/[0.05]">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-lg">
                      <span className="text-[9px] text-[#adaaaa] uppercase font-black">Sincronização</span>
                      <span className="text-[10px] font-mono text-white">TEMPO REAL</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-lg">
                      <span className="text-[9px] text-[#adaaaa] uppercase font-black">Camada</span>
                      <span className="text-[10px] font-mono text-white">{getNodeSizeLabel(selectedNode.size)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/workspace/tracks")}
                    className="w-full bg-gradient-to-r from-primary to-[#00e3fd] text-[#003840] py-4 rounded-lg font-black text-sm tracking-widest uppercase transition-all hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(129,236,255,0.3)] flex items-center justify-center gap-2"
                  >
                    {selectedNode.status === "mastered" ? "Revisar trilha" : "Abrir trilha"}
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </WorkspaceModal>

        {/* Mission/Kata Modal */}
        <WorkspaceModal
          open={Boolean(selectedMission)}
          onClose={onCloseMission}
          title={selectedMission?.title ?? "Missão"}
          subtitle={selectedMission?.description}
          size="xl"
          eyebrow={selectedMission?.window === "daily" ? "Série Diária de Katas" : "Missão Semanal"}
          fullBleed
        >
          {selectedMission ? (
            <MissionDetailPanel
              mission={selectedMission}
              onClose={onCloseMission}
              onOpenOrigin={() => router.push(getMissionMeta(selectedMission).href)}
            />
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
      <LeaderboardAvatar entry={entry} highlight={entry.isCurrentUser} />
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
        <p className="text-sm font-black text-primary">{formatSkillThreeXp(entry.weeklyXp)} XP</p>
        <p className="text-[11px] text-text-secondary">
          {entry.positionDelta > 0 ? `+${entry.positionDelta}` : entry.positionDelta}
        </p>
      </div>
    </div>
  );
}

function LeaderboardAvatar({
  entry,
  size = "md",
  highlight = false,
}: {
  entry: SkillThreeExperience["leaderboardByScope"]["global"]["entries"][number];
  size?: "sm" | "md";
  highlight?: boolean;
}) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-[10px]" : "h-11 w-11 text-xs";
  const highlightClass = highlight
    ? "border-primary shadow-[0_0_12px_rgba(129,236,255,0.28)]"
    : "border-white/10";

  if (entry.avatarUrl) {
    return (
      <div className={`overflow-hidden rounded-full border bg-[#101010] ${sizeClass} ${highlightClass}`}>
        <img src={entry.avatarUrl} alt={entry.name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full border bg-primary/10 font-black uppercase tracking-[0.16em] text-primary ${sizeClass} ${highlightClass}`}
    >
      {getInitials(entry.name)}
    </div>
  );
}

function buildNodeInsightCards(
  node: SkillThreeNodeState,
  skillThree: SkillThreeExperience,
) {
  const linkedAchievements = selectedNodeAchievements(node, skillThree);
  const unlockedLinked = linkedAchievements.filter(
    (achievement) => achievement.status !== "locked",
  ).length;

  return [
    {
      icon: "sparkles",
      title: "Estado atual",
      description: `${getNodeStatusLabel(node.status)} com ${Math.round(node.progressPercent)}% de evolução nesta habilidade.`,
    },
    {
      icon: "gauge",
      title: "Impacto na trilha",
      description: `Este nó entrega +${node.rewardXp} XP e faz parte da formação ${node.domain}.`,
    },
    {
      icon: "award",
      title: "Conquistas ligadas",
      description: linkedAchievements.length
        ? `${unlockedLinked} de ${linkedAchievements.length} conquistas relacionadas já foram ativadas.`
        : "Este nó ainda não possui conquistas relacionadas ativas.",
    },
    {
      icon: node.icon,
      title: "Camada de progressão",
      description: `${getNodeSizeLabel(node.size)} dentro da malha principal do SkillThree.`,
    },
  ];
}

function buildNodeMetricBars(
  node: SkillThreeNodeState,
  skillThree: SkillThreeExperience,
) {
  const maxRewardXp = Math.max(
    ...skillThree.skillTree.map((item) => item.rewardXp),
    1,
  );
  const linkedAchievements = selectedNodeAchievements(node, skillThree);
  const unlockedLinked = linkedAchievements.filter(
    (achievement) => achievement.status !== "locked",
  ).length;

  return [
    {
      label: "Domínio atual",
      value: Math.max(4, Math.round(node.progressPercent)),
    },
    {
      label: "Peso na trilha",
      value: Math.round((node.rewardXp / maxRewardXp) * 100),
    },
    {
      label: "Conexões ativas",
      value: linkedAchievements.length
        ? Math.round((unlockedLinked / linkedAchievements.length) * 100)
        : 0,
    },
  ];
}

function selectedNodeAchievements(
  node: SkillThreeNodeState,
  skillThree: SkillThreeExperience,
) {
  return node.linkedAchievementIds
    .map((achievementId) =>
      skillThree.achievements.find((item) => item.id === achievementId),
    )
    .filter(Boolean) as SkillThreeAchievementState[];
}

function getNodeStatusLabel(status: SkillThreeNodeState["status"]) {
  switch (status) {
    case "locked":
      return "Bloqueado";
    case "available":
      return "Disponível";
    case "unlocked":
      return "Desbloqueado";
    case "in_progress":
      return "Em progresso";
    case "mastered":
      return "Dominado";
    default:
      return "Ativo";
  }
}

function getNodeStatusChipLabel(status: SkillThreeNodeState["status"]) {
  switch (status) {
    case "locked":
      return "BLOQ";
    case "available":
      return "PRONTO";
    case "unlocked":
      return "ATIVO";
    case "in_progress":
      return "EM PROG";
    case "mastered":
      return "DOMINADO";
    default:
      return "ATIVO";
  }
}

function getNodeSizeLabel(size: SkillThreeNodeState["size"]) {
  switch (size) {
    case "core":
      return "Núcleo";
    case "major":
      return "Camada principal";
    case "minor":
      return "Camada complementar";
    default:
      return "Camada ativa";
  }
}

function getMissionWindowLabel(window: SkillThreeMissionState["window"]) {
  return window === "daily" ? "HOJE" : "SEMANAL";
}

function MissionDetailPanel({
  mission,
  onClose,
  onOpenOrigin,
}: {
  mission: SkillThreeMissionState;
  onClose: () => void;
  onOpenOrigin: () => void;
}) {
  const meta = getMissionMeta(mission);

  return (
    <div className="grid min-h-[520px] gap-0 border-t border-white/[0.05] bg-[#0e0e0e]/50 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="border-b border-white/[0.05] bg-[linear-gradient(180deg,rgba(19,19,19,0.96),rgba(12,12,12,0.98))] p-6 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              {renderIcon(meta.icon, 22)}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                {meta.originLabel}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-secondary">
                {meta.windowLabel}
              </p>
            </div>
          </div>

          <div>
            <span className={meta.rarityClass}>{meta.rarityLabel}</span>
            <h3 className="mt-4 text-3xl font-black tracking-tight text-white">
              {mission.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {mission.description}
            </p>
          </div>

          <div className="grid gap-3">
            <MissionStatCard label="Recompensa" value={`+${mission.rewardXp} XP`} />
            <MissionStatCard label="Origem" value={meta.originLabel} />
            <MissionStatCard label="Meta" value={String(mission.target)} />
          </div>
        </div>
      </aside>

      <section className="flex flex-col p-6 sm:p-8">
        <div className="flex-1 space-y-6">
          <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.025] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Alvo operacional
                </p>
                <p className="mt-3 break-all rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3 font-mono text-xs text-white">
                  {mission.metric}
                </p>
              </div>
              <div className="min-w-[92px] rounded-[20px] border border-primary/16 bg-primary/10 px-4 py-3 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  Alvo
                </p>
                <p className="mt-2 text-lg font-black text-white">{mission.target}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.025] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Progresso da missão
              </p>
              <p className="text-sm font-black text-white">
                {Math.round(mission.progressPercent)}%
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#81ecff,#00e3fd)] shadow-[0_0_12px_rgba(129,236,255,0.42)]"
                style={{ width: `${mission.progressPercent}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {buildMissionProgressLabel(mission)}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {meta.checklist.map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] px-4 py-4"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.05] pt-6 sm:flex-row">
          <button
            type="button"
            onClick={onOpenOrigin}
            className="workspace-button workspace-button--primary min-h-[46px] flex-1 justify-center"
          >
            {mission.completed ? meta.reviewActionLabel : meta.actionLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="workspace-button workspace-button--ghost min-h-[46px] justify-center px-5"
          >
            Fechar
          </button>
        </div>
      </section>
    </div>
  );
}

function MissionStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] px-4 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function getMissionMeta(mission: SkillThreeMissionState) {
  const rarityMap = {
    common: {
      label: "Fluxo estável",
      className:
        "inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300",
    },
    rare: {
      label: "Missão prioritária",
      className:
        "inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-300",
    },
    epic: {
      label: "Operação crítica",
      className:
        "inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300",
    },
    legendary: {
      label: "Prioridade máxima",
      className:
        "inline-flex rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-300",
    },
  } as const;

  if (mission.instanceId.startsWith("mission-review-")) {
    return {
      icon: "activity",
      href: "/workspace/reviews",
      originLabel: "Revisão programada",
      windowLabel: mission.window === "daily" ? "Ciclo diário" : "Ciclo semanal",
      actionLabel: "Abrir revisões",
      reviewActionLabel: "Revisar histórico",
      rarityLabel: rarityMap[mission.rarity].label,
      rarityClass: rarityMap[mission.rarity].className,
      checklist: [
        { label: "Fonte", value: "Memória e retenção" },
        { label: "Janela", value: mission.window === "daily" ? "Hoje" : "Esta semana" },
        { label: "Entrega", value: "Fechar a revisão no prazo" },
      ],
    };
  }

  if (mission.instanceId.startsWith("mission-project-")) {
    return {
      icon: "trophy",
      href: "/workspace/projects",
      originLabel: "Projeto aplicado",
      windowLabel: mission.window === "daily" ? "Sprint diária" : "Sprint semanal",
      actionLabel: "Abrir projetos",
      reviewActionLabel: "Revisar projeto",
      rarityLabel: rarityMap[mission.rarity].label,
      rarityClass: rarityMap[mission.rarity].className,
      checklist: [
        { label: "Fonte", value: "Entrega prática" },
        { label: "Janela", value: mission.window === "daily" ? "Hoje" : "Esta semana" },
        { label: "Entrega", value: "Mover o projeto ao próximo checkpoint" },
      ],
    };
  }

  return {
    icon: "zap",
    href: "/workspace/tasks",
    originLabel: "Tarefa do workspace",
    windowLabel: mission.window === "daily" ? "Ritmo diário" : "Ritmo semanal",
    actionLabel: "Abrir tarefas",
    reviewActionLabel: "Revisar tarefa",
    rarityLabel: rarityMap[mission.rarity].label,
    rarityClass: rarityMap[mission.rarity].className,
    checklist: [
      { label: "Fonte", value: "Fila operacional" },
      { label: "Janela", value: mission.window === "daily" ? "Hoje" : "Esta semana" },
      { label: "Entrega", value: "Concluir a ação prioritária" },
    ],
  };
}

function buildMissionProgressLabel(mission: SkillThreeMissionState) {
  if (mission.completed) {
    return "Missão concluída. A origem continua disponível para revisão e continuidade do seu fluxo.";
  }

  if (typeof mission.target === "number") {
    if (mission.progress <= 1) {
      return `${Math.round(mission.progressPercent)}% da meta atingida até agora.`;
    }

    return `${Math.round(mission.progress)} de ${mission.target} concluído(s) até agora.`;
  }

  return `Critério atual: ${mission.target}. Continue pela origem da missão para finalizar.`;
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) {
    return "CT";
  }
  return parts.map((part) => part[0]).join("").toUpperCase();
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
              {achievement.status.replace(/_/g, " ")}
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
