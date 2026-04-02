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
   const [selectedMission, setSelectedMission] = useState<SkillThreeMissionState | null>(null);
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
               ARQUITETURA_HABILIDADES
             </h1>
           </div>
           <div className="flex gap-3 flex-shrink-0">
             <div className="bg-[#1a1a1a] border border-white/[0.05] p-4 rounded-lg flex items-center gap-4 w-[200px]">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                 <Zap size={18} className="text-primary" />
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] text-[#adaaaa] font-black uppercase tracking-widest leading-tight mb-0.5">Pontos XP</p>
                 <p className="text-lg font-black text-white truncate">{formatXp(skillThree.totalXp)}</p>
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
                     CAMINHO_ATIVO: {skillThree.activeTrack.commandLabel}
                   </span>
                 </div>
               </div>
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#81ecff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
               <SkillThreeCanvas nodes={skillThree.skillTree} zoom={zoom} onSelectNode={setSelectedNode} />
               
               {/* FOOTER STATS */}
               <div className="p-6 bg-[#1a1a1a]/20 border-t border-white/[0.05] grid grid-cols-3 gap-4">
                 <div className="text-center border-r border-white/[0.05]">
                   <p className="text-[9px] text-[#adaaaa] uppercase font-black tracking-wider mb-2">Nós Desbloqueados</p>
                   <p className="text-xl font-black text-white">{skillThree.formationProgress.masteredNodes} / {skillThree.formationProgress.totalNodes}</p>
                 </div>
                 <div className="text-center border-r border-white/[0.05]">
                   <p className="text-[9px] text-[#adaaaa] uppercase font-black tracking-wider mb-2">Pontos de Maestria</p>
                   <p className="text-xl font-black text-primary">{formatXp(skillThree.totalXp)}</p>
                 </div>
                 <div className="text-center">
                   <p className="text-[9px] text-[#adaaaa] uppercase font-black tracking-wider mb-2">Próximo Desbloqueio</p>
                   <p className="text-xl font-black text-white">
                     {skillThree.level.nextLevelXp
                       ? `${formatXp(skillThree.level.nextLevelXp - skillThree.totalXp)} XP`
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
                   <h3 className="text-sm font-black tracking-wider uppercase">Katas Diárias</h3>
                 </div>
                 <button type="button" className="text-[10px] text-primary hover:text-primary/80 font-black tracking-wide" onClick={() => setAchievementsOpen(true)}>
                   VER_TUDO
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
                             {mission.completed ? 'CONCLUÍDA' : 'DIFÍCIL'}
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
                 <p className="text-[10px] text-[#adaaaa] font-medium">Ranking Global do Sistema // V_2.0</p>
               </div>
               <div className="p-3">
                 <div className="space-y-2">
                   {leaderboard.topThree.map((entry, index) => (
                     <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${entry.isCurrentUser ? 'bg-primary/5 border border-primary/10' : 'hover:bg-white/[0.02]'}`}>
                       <span className={`text-xs font-black ${entry.isCurrentUser ? 'text-primary' : 'text-primary/40'} w-6 text-center`}>{String(index + 1).padStart(2, '0')}</span>
                       <div className={`w-8 h-8 rounded-full border flex-shrink-0 ${entry.isCurrentUser ? 'border-primary shadow-[0_0_10px_rgba(129,236,255,0.3)]' : 'border-white/10'} bg-primary/10`} />
                       <div className="flex-1 min-w-0">
                         <p className="text-xs font-black text-white truncate">{entry.name}</p>
                         <p className="text-[9px] text-[#adaaaa] font-medium">{entry.isCurrentUser ? 'VOCÊ' : `Nv. ${entry.level}`}</p>
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
  // Calcular posições circulares para os nodes
  const calculateCircularPositions = useMemo(() => {
    const coreNode = nodes.find(n => n.size === "core");
    const nonCoreNodes = nodes.filter(n => n.size !== "core");
    
    const centerX = 50;
    const centerY = 50;
    const radius = 35; // Raio do círculo em percentuais
    
    const positions = new Map<string, { x: number; y: number }>();
    
    // Core node no centro
    if (coreNode) {
      positions.set(coreNode.id, { x: centerX, y: centerY });
    }
    
    // Nodes ao redor em círculo
    nonCoreNodes.forEach((node, index) => {
      const angle = (index / nonCoreNodes.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      positions.set(node.id, { x, y });
    });
    
    return positions;
  }, [nodes]);

  return (
    <div className="relative overflow-hidden flex-1 flex flex-col">
      <div className="relative flex-1 overflow-x-auto overflow-y-hidden px-2 py-5">
        <div
          className="mx-auto h-[600px] min-w-[860px] origin-top transition-transform duration-200 relative"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Grid background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#81ecff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

          {nodes.map((node) => {
            const pos = calculateCircularPositions.get(node.id);
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
        >
          {selectedNode ? (
            <div className="bg-[#0e0e0e]/50 -m-8 p-0 flex flex-col lg:flex-row min-h-[500px] border-t border-white/[0.05]">
              {/* Left Section: Hero (35%) */}
              <div className="w-full lg:w-[40%] bg-gradient-to-b from-[#1a1a1a] to-[#0e0e0e] border-b lg:border-b-0 lg:border-r border-white/[0.05] p-8 flex flex-col justify-between relative overflow-hidden">
                {/* Background gradient effect */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #81ecff 0%, transparent 60%)' }} />
                
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
                        Status do Hábil: {selectedNode.status === "locked" ? "BLOQUEADO" : selectedNode.status === "available" ? "DISPONÍVEL" : selectedNode.status === "in_progress" ? "EM PROGRESSO" : selectedNode.status === "unlocked" ? "DESBLOQUEADO" : "DOMINADO"}
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
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest">Visão Técnica Geral</h3>
                    </div>
                    <p className="text-[#adaaaa] leading-relaxed text-sm">
                      {selectedNode.description}
                    </p>
                  </div>

                  {/* Capabilities Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-[1px] w-8 bg-primary"></div>
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest">Capacidades Desbloqueadas</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { icon: "hub", title: "Arquitetura Distribuída", desc: "Distribuir operações com 99.9% de eficiência." },
                        { icon: "security", title: "Operações Seguras", desc: "Implementar filtragem em todos os nós de entrada." },
                        { icon: "database", title: "Escalabilidade Horizontal", desc: "Dimensionar através de 10+ regiões em paralelo." },
                        { icon: "speed", title: "Otimização de Latência", desc: "Afinar tempos de resposta sub-milissegundo." }
                      ].map((cap, idx) => (
                        <div key={idx} className="bg-[#131313] border border-white/[0.05] rounded-lg p-4 hover:border-primary/30 transition-all group">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary flex-shrink-0 text-sm">
                              {renderIcon(cap.icon, 16)}
                            </div>
                            <div>
                              <p className="text-xs font-black text-white">{cap.title}</p>
                              <p className="text-[11px] text-[#adaaaa] mt-1">{cap.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mastery Metrics */}
                  {selectedNode.status === "mastered" && (
                    <div className="bg-[#1a1a1a] border border-white/[0.05] rounded-xl p-6 space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        {renderIcon(selectedNode.icon, 48)}
                      </div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Métricas de Maestria</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-[#adaaaa] uppercase font-black">Retenção de Conhecimento</span>
                            <span className="text-xs font-black text-primary">100%</span>
                          </div>
                          <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
                            <div className="h-full w-full bg-primary shadow-[0_0_8px_rgba(129,236,255,0.8)]" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-[#adaaaa] uppercase font-black">Aplicação Prática</span>
                            <span className="text-xs font-black text-primary">88%</span>
                          </div>
                          <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
                            <div className="h-full w-[88%] bg-primary shadow-[0_0_8px_rgba(129,236,255,0.8)]" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-[#adaaaa] uppercase font-black">Sucesso em Implementação</span>
                            <span className="text-xs font-black text-primary">95%</span>
                          </div>
                          <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
                            <div className="h-full w-[95%] bg-primary shadow-[0_0_8px_rgba(129,236,255,0.8)]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                      <span className="text-[9px] text-[#adaaaa] uppercase font-black">Último Update</span>
                      <span className="text-[10px] font-mono text-white">2024.04.02</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-lg">
                      <span className="text-[9px] text-[#adaaaa] uppercase font-black">Profundidade</span>
                      <span className="text-[10px] font-mono text-white">LAYER_{selectedNode.size === "core" ? "00" : "07"}</span>
                    </div>
                  </div>
                  <button className="w-full bg-gradient-to-r from-primary to-[#00e3fd] text-[#003840] py-4 rounded-lg font-black text-sm tracking-widest uppercase transition-all hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(129,236,255,0.3)] flex items-center justify-center gap-2">
                    Revisar Conteúdo
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
        >
          {selectedMission ? (
            <div className="bg-[#0e0e0e]/50 -m-8 p-0 flex flex-col lg:flex-row min-h-[500px] border-t border-white/[0.05]">
              {/* Left Section: Visual & Header (40%) */}
              <div className="w-full lg:w-[40%] relative min-h-[300px] flex flex-col justify-end p-8 bg-[#131313] border-b lg:border-b-0 lg:border-r border-white/[0.05] overflow-hidden">
                {/* Background visual */}
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/40 to-transparent"></div>
                
                <div className="relative z-10">
                  {/* Difficulty Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-[#ff6b6b]/10 text-[#ff6b6b] text-[10px] font-black uppercase tracking-widest rounded border border-[#ff6b6b]/30">
                      Dificuldade: {selectedMission.rarity === "common" ? "Fácil" : selectedMission.rarity === "rare" ? "Média" : selectedMission.rarity === "epic" ? "Difícil" : "Extremo"}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h2 className="text-3xl font-black tracking-tighter text-white mb-3 leading-none uppercase">
                    {selectedMission.title}
                  </h2>
                  <p className="text-[#adaaaa] text-sm mb-6">{selectedMission.description}</p>
                  
                  {/* Reward & Time */}
                  <div className="flex gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-primary uppercase tracking-widest font-black mb-1">Recompensa</span>
                      <span className="text-2xl font-black text-white">+{selectedMission.rewardXp} XP</span>
                    </div>
                    <div className="w-px h-12 bg-white/[0.1]"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-primary uppercase tracking-widest font-black mb-1">Tempo Est.</span>
                      <span className="text-2xl font-black text-white">15 MIN</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section: Details & Action (60%) */}
              <div className="w-full lg:w-[60%] p-8 md:p-12 flex flex-col">
                <div className="space-y-8 flex-1">
                  {/* Mission Objective */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-[1px] w-8 bg-primary"></div>
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest">Objetivo da Missão</h3>
                    </div>
                    <p className="text-[#adaaaa] leading-relaxed text-sm">
                      Complete a tarefa proposta para ganhar experiência e desbloquear novas habilidades. Esta missão foi designada com base no seu nível de maestria e progressão atual no sistema.
                    </p>
                  </div>

                  {/* Requirements & Tech Stack */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Requirements */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest">Requisitos</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-xs text-white">
                          <span className="text-primary font-black">✓</span>
                          Aplicação prática
                        </li>
                        <li className="flex items-center gap-2 text-xs text-white">
                          <span className="text-primary font-black">✓</span>
                          Implementação completa
                        </li>
                        <li className="flex items-center gap-2 text-xs text-white">
                          <span className="text-primary font-black">✓</span>
                          Validação de resultado
                        </li>
                      </ul>
                    </div>

                    {/* Tech Stack / Metric */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest">Alvo</h3>
                      <div className="space-y-2">
                        <div className="px-3 py-2 bg-[#1a1a1a] border border-white/[0.05] rounded text-[10px] text-white font-mono">
                          {selectedMission.metric}
                        </div>
                        <p className="text-xs text-[#adaaaa]">
                          Meta: <span className="text-white font-black">{selectedMission.target}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="bg-[#1a1a1a] border border-white/[0.05] rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-[#adaaaa] uppercase tracking-widest">Seu Progresso</span>
                      <span className="text-xs font-black text-primary">{Math.round(selectedMission.progressPercent)}%</span>
                    </div>
                    <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-[#00e3fd] shadow-[0_0_8px_rgba(129,236,255,0.8)]"
                        style={{ width: `${selectedMission.progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[#adaaaa]">
                      {selectedMission.completed ? "CONCLUÍDA" : `${Math.round(selectedMission.progress)} de ${selectedMission.target} itens`}
                    </p>
                  </div>
                </div>

                {/* Status & Action */}
                <div className="pt-8 space-y-4 border-t border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#adaaaa] uppercase font-black tracking-widest">Status do Operador</span>
                      <span className="text-xs text-white font-bold flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        {selectedMission.completed ? "COMPLETADA" : "PRONTO"}
                      </span>
                    </div>
                  </div>
                  <button className="w-full px-6 py-4 bg-gradient-to-r from-primary to-[#00e3fd] text-[#003840] font-black tracking-widest uppercase rounded-lg shadow-[0px_0px_20px_rgba(129,236,255,0.4)] hover:shadow-[0px_0px_30px_rgba(129,236,255,0.6)] active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
                    {selectedMission.completed ? "REVISAR RESULTADO" : "INICIAR MISSÃO"}
                    <span>→</span>
                  </button>
                </div>
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
