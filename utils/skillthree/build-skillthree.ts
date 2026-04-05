import { labelForSkillLevel } from "@/utils/workspace/helpers";
import type {
  ReviewRow,
  TaskRow,
  TrackBlueprint,
  WorkspaceData,
} from "@/utils/workspace/types";
import type {
  SkillThreeAchievementState,
  SkillThreeExperience,
  SkillThreeLeaderboardBucket,
  SkillThreeLeaderboardEntry,
  SkillThreeMissionState,
  SkillThreeNodeState,
} from "@/utils/skillthree/types";

const ICON_SEQUENCE = [
  "sparkles",
  "cpu",
  "gauge",
  "zap",
  "award",
  "activity",
  "trophy",
  "flame",
] as const;

export function buildSkillThreeExperience(
  data: WorkspaceData | null,
): SkillThreeExperience {
  if (!data || data.trackBlueprints.length === 0) {
    return emptySkillThreeExperience();
  }

  const activeBlueprint =
    data.trackBlueprints.find(
      (item) => item.track.id === data.profile?.selected_track_id,
    ) ?? data.trackBlueprints[0] ?? null;

  if (!activeBlueprint) {
    return emptySkillThreeExperience();
  }

  const skillTree = buildSkillTree(activeBlueprint);
  const achievements = buildAchievements(data, activeBlueprint, skillTree);
  const dailyMissions = buildMissions(data, activeBlueprint);
  const totalXp = resolveTotalXp(data, skillTree, achievements);
  const level = resolveLevel(totalXp);
  const leaderboardByScope = buildLeaderboard(
    data,
    activeBlueprint.track.name,
    totalXp,
    level.level,
  );

  return {
    activeTrack: {
      id: activeBlueprint.track.id,
      name: activeBlueprint.track.name,
      commandLabel: activeBlueprint.track.name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_"),
    },
    totalXp,
    level,
    playerState: {
      sound_enabled: data.settings?.notifications_enabled ?? true,
    },
    formationProgress: {
      masteredNodes: skillTree.filter((node) => node.status === "mastered").length,
      totalNodes: skillTree.length,
    },
    skillTree,
    dailyMissions,
    achievements,
    unlockedAchievements: achievements.filter(
      (achievement) => achievement.status !== "locked",
    ),
    leaderboardByScope,
  };
}

function emptySkillThreeExperience(): SkillThreeExperience {
  const emptyLeaderboard = buildLeaderboardBucket([]);

  return {
    activeTrack: null,
    totalXp: 0,
    level: {
      level: 1,
      nextLevelXp: 320,
    },
    playerState: {
      sound_enabled: true,
    },
    formationProgress: {
      masteredNodes: 0,
      totalNodes: 0,
    },
    skillTree: [],
    dailyMissions: [],
    achievements: [],
    unlockedAchievements: [],
    leaderboardByScope: {
      global: emptyLeaderboard,
      weekly: emptyLeaderboard,
      track: emptyLeaderboard,
    },
  };
}

function buildSkillTree(blueprint: TrackBlueprint): SkillThreeNodeState[] {
  return blueprint.skills.slice(0, 8).map((skill, index) => {
    const progress = Math.round(
      blueprint.progressBySkill[skill.id]?.progress_percent ?? 0,
    );

    return {
      id: skill.id,
      label: skill.name,
      shortLabel: shortenLabel(skill.name),
      description: skill.description,
      domain: blueprint.track.name,
      icon: ICON_SEQUENCE[index % ICON_SEQUENCE.length],
      size: index === 0 ? "core" : index < 4 ? "major" : "minor",
      status: resolveNodeStatus(progress, index),
      progressPercent: progress,
      rewardXp: 120 + index * 35,
      linkedAchievementIds: [`achievement-${index % 4}`, `achievement-${(index + 1) % 4}`],
    };
  });
}

function buildAchievements(
  data: WorkspaceData,
  blueprint: TrackBlueprint,
  skillTree: SkillThreeNodeState[],
): SkillThreeAchievementState[] {
  const completedSessions = data.sessions.length;
  const completedTasks = data.tasks.filter((task) => task.status === "completed").length;
  const completedReviews = data.reviews.filter(
    (review) => review.status === "completed",
  ).length;
  const activeProjects = data.projects.filter(
    (project) => project.status === "active" || project.status === "completed",
  ).length;

  return [
    {
      id: "achievement-0",
      name: "Boot Sequence",
      description: "Registrar sessões suficientes para ativar a trilha principal.",
      icon: "zap",
      status: completedSessions >= 3 ? "mastered" : completedSessions > 0 ? "in_progress" : "locked",
      progressPercent: Math.min((completedSessions / 3) * 100, 100),
      remainingLabel:
        completedSessions >= 3
          ? "Sessão base consolidada"
          : `${Math.max(3 - completedSessions, 0)} sessão(ões) para liberar`,
      xpBonus: 180,
      recommendedLevel: 1,
    },
    {
      id: "achievement-1",
      name: "Task Breaker",
      description: `Converter execução em entregas dentro de ${blueprint.track.name}.`,
      icon: "award",
      status: completedTasks >= 5 ? "mastered" : completedTasks > 0 ? "in_progress" : "locked",
      progressPercent: Math.min((completedTasks / 5) * 100, 100),
      remainingLabel:
        completedTasks >= 5
          ? "Ritmo operacional estabilizado"
          : `${Math.max(5 - completedTasks, 0)} tarefa(s) para concluir`,
      xpBonus: 220,
      recommendedLevel: 2,
    },
    {
      id: "achievement-2",
      name: "Retention Loop",
      description: "Fechar revisões para sustentar retenção nas skills destravadas.",
      icon: "activity",
      status: completedReviews >= 4 ? "mastered" : completedReviews > 0 ? "in_progress" : "locked",
      progressPercent: Math.min((completedReviews / 4) * 100, 100),
      remainingLabel:
        completedReviews >= 4
          ? "Ciclo de revisão fechado"
          : `${Math.max(4 - completedReviews, 0)} revisão(ões) pendentes`,
      xpBonus: 160,
      recommendedLevel: 2,
    },
    {
      id: "achievement-3",
      name: "Project Reactor",
      description: "Transformar conhecimento em entrega prática e visível.",
      icon: "trophy",
      status:
        activeProjects >= 2
          ? "mastered"
          : activeProjects === 1 || skillTree.some((node) => node.status !== "locked")
            ? "unlocked"
            : "locked",
      progressPercent: Math.min((activeProjects / 2) * 100, 100),
      remainingLabel:
        activeProjects >= 2
          ? "Portfólio em operação"
          : `${Math.max(2 - activeProjects, 0)} projeto(s) para atingir a meta`,
      xpBonus: 260,
      recommendedLevel: 3,
    },
  ];
}

function buildMissions(
  data: WorkspaceData,
  blueprint: TrackBlueprint,
): SkillThreeMissionState[] {
  const pendingTasks = data.tasks.filter((task) => task.status !== "completed");
  const pendingReviews = data.reviews.filter((review) => review.status !== "completed");
  const activeProject = data.projects.find(
    (project) => project.status === "active" || project.status === "planned",
  );

  const taskMission = buildTaskMission(pendingTasks[0], blueprint.track.name);
  const reviewMission = buildReviewMission(pendingReviews[0], blueprint.track.name);
  const projectMission = buildProjectMission(activeProject, blueprint.track.name);

  return [taskMission, reviewMission, projectMission];
}

function buildTaskMission(
  task: TaskRow | undefined,
  trackName: string,
): SkillThreeMissionState {
  if (!task) {
    return {
      instanceId: "mission-task-standby",
      title: "Operação livre",
      description: `Nenhuma tarefa pendente em ${trackName}. Use o slot para abrir uma nova frente crítica.`,
      rewardXp: 120,
      progressPercent: 100,
      progress: 1,
      target: 1,
      metric: "task_queue == empty",
      completed: true,
      window: "daily",
      rarity: "common",
    };
  }

  const progress = task.status === "in_progress" ? 0.55 : 0.1;

  return {
    instanceId: `mission-task-${task.id}`,
    title: task.title,
    description: task.description || `Concluir a próxima entrega priorizada de ${trackName}.`,
    rewardXp: task.priority === "critical" ? 240 : task.priority === "high" ? 180 : 120,
    progressPercent: progress * 100,
    progress,
    target: 1,
    metric: `task:${task.priority}`,
    completed: false,
    window: "daily",
    rarity:
      task.priority === "critical"
        ? "legendary"
        : task.priority === "high"
          ? "epic"
          : "rare",
  };
}

function buildReviewMission(
  review: ReviewRow | undefined,
  trackName: string,
): SkillThreeMissionState {
  if (!review) {
    return {
      instanceId: "mission-review-standby",
      title: "Memória estabilizada",
      description: `Não há revisões abertas em ${trackName}. O circuito de retenção está em dia.`,
      rewardXp: 90,
      progressPercent: 100,
      progress: 1,
      target: 1,
      metric: "review_backlog == 0",
      completed: true,
      window: "weekly",
      rarity: "common",
    };
  }

  const overdue = review.status === "overdue";

  return {
    instanceId: `mission-review-${review.id}`,
    title: review.title,
    description:
      review.notes ||
      `Fechar a revisão agendada para evitar perda de retenção em ${trackName}.`,
    rewardXp: overdue ? 170 : 110,
    progressPercent: overdue ? 20 : 45,
    progress: overdue ? 0.2 : 0.45,
    target: 1,
    metric: review.interval_label,
    completed: false,
    window: "weekly",
    rarity: overdue ? "epic" : "rare",
  };
}

function buildProjectMission(
  project: WorkspaceData["projects"][number] | undefined,
  trackName: string,
): SkillThreeMissionState {
  if (!project) {
    return {
      instanceId: "mission-project-standby",
      title: "Abrir projeto aplicado",
      description: `Crie um projeto em ${trackName} para converter conhecimento em entrega real.`,
      rewardXp: 210,
      progressPercent: 0,
      progress: 0,
      target: 1,
      metric: "project_bootstrap",
      completed: false,
      window: "weekly",
      rarity: "epic",
    };
  }

  return {
    instanceId: `mission-project-${project.id}`,
    title: project.title,
    description:
      project.description || `Mover o projeto principal de ${trackName} até o próximo checkpoint.`,
    rewardXp: 220,
    progressPercent: project.progress_percent,
    progress: project.progress_percent,
    target: 100,
    metric: project.status.toUpperCase(),
    completed: project.status === "completed",
    window: "weekly",
    rarity: project.status === "planned" ? "rare" : "epic",
  };
}

function resolveTotalXp(
  data: WorkspaceData,
  skillTree: SkillThreeNodeState[],
  achievements: SkillThreeAchievementState[],
) {
  const skillXp = skillTree.reduce(
    (total, node) => total + Math.round(node.progressPercent * 18),
    0,
  );
  const achievementXp = achievements
    .filter((achievement) => achievement.status !== "locked")
    .reduce((total, achievement) => total + achievement.xpBonus, 0);

  return (
    skillXp +
    achievementXp +
    data.sessions.length * 36 +
    data.dashboardSummary.hoursThisWeek * 42 +
    data.reviews.filter((review) => review.status === "completed").length * 24
  );
}

function resolveLevel(totalXp: number) {
  const level = Math.max(1, Math.floor(totalXp / 320) + 1);
  const nextLevelXp = level >= 20 ? null : level * 320;

  return {
    level,
    nextLevelXp,
  };
}

function buildLeaderboard(
  data: WorkspaceData,
  trackName: string,
  totalXp: number,
  currentLevel: number,
): SkillThreeExperience["leaderboardByScope"] {
  const currentName =
    data.profile?.full_name?.trim() || data.profile?.email || "Operador CodeTrail";
  const rankLabel = labelForSkillLevel(
    data.profile?.current_level ?? data.goal?.current_level ?? "beginner",
  );

  const baseEntries: SkillThreeLeaderboardEntry[] = [
    {
      id: "operator-0",
      name: "Maya Vertex",
      badge: "LAB_CORE",
      rankLabel: "Arquiteta de trilha",
      level: Math.max(currentLevel + 2, 5),
      weeklyXp: totalXp + 420,
      positionDelta: 1,
      isCurrentUser: false,
    },
    {
      id: "operator-1",
      name: "Caio Pulse",
      badge: trackName.toUpperCase().slice(0, 10),
      rankLabel: "Especialista de execução",
      level: Math.max(currentLevel + 1, 4),
      weeklyXp: totalXp + 180,
      positionDelta: -1,
      isCurrentUser: false,
    },
    {
      id: "operator-current",
      name: currentName,
      badge: "VOCÊ",
      rankLabel,
      level: currentLevel,
      weeklyXp: totalXp,
      positionDelta: 2,
      isCurrentUser: true,
    },
    {
      id: "operator-3",
      name: "Iris Cache",
      badge: "SYNC",
      rankLabel: "Operadora de retenção",
      level: Math.max(currentLevel - 1, 2),
      weeklyXp: Math.max(totalXp - 120, 80),
      positionDelta: 0,
      isCurrentUser: false,
    },
    {
      id: "operator-4",
      name: "Theo Runtime",
      badge: "EDGE",
      rankLabel: "Executor de missões",
      level: Math.max(currentLevel - 1, 2),
      weeklyXp: Math.max(totalXp - 220, 60),
      positionDelta: -2,
      isCurrentUser: false,
    },
  ].sort((left, right) => right.weeklyXp - left.weeklyXp);

  const weeklyEntries = baseEntries.map((entry, index) => ({
    ...entry,
    weeklyXp: Math.max(entry.weeklyXp - index * 25, 40),
  }));

  const trackEntries = baseEntries.map((entry, index) => ({
    ...entry,
    badge: trackName.toUpperCase().slice(0, 10),
    weeklyXp: Math.max(entry.weeklyXp - index * 15, 50),
  }));

  return {
    global: buildLeaderboardBucket(baseEntries),
    weekly: buildLeaderboardBucket(weeklyEntries),
    track: buildLeaderboardBucket(trackEntries),
  };
}

function buildLeaderboardBucket(
  entries: SkillThreeLeaderboardEntry[],
): SkillThreeLeaderboardBucket {
  return {
    topThree: entries.slice(0, 3),
    entries,
  };
}

function resolveNodeStatus(progress: number, index: number): SkillThreeNodeState["status"] {
  if (progress >= 85) {
    return "mastered";
  }

  if (progress >= 45) {
    return "in_progress";
  }

  if (progress > 0) {
    return "unlocked";
  }

  if (index < 2) {
    return "available";
  }

  return "locked";
}

function shortenLabel(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "NODE";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 10).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
