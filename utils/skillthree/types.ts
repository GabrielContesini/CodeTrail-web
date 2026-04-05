export type SkillThreeLeaderboardScope = "global" | "weekly" | "track";

export type SkillThreeNodeSize = "core" | "major" | "minor";

export type SkillThreeNodeStatus =
  | "locked"
  | "available"
  | "unlocked"
  | "in_progress"
  | "mastered";

export type SkillThreeAchievementStatus =
  | "locked"
  | "in_progress"
  | "unlocked"
  | "mastered";

export type SkillThreeMissionWindow = "daily" | "weekly";

export type SkillThreeMissionRarity = "common" | "rare" | "epic" | "legendary";

export interface SkillThreeTrackSummary {
  id: string;
  name: string;
  commandLabel: string;
}

export interface SkillThreeNodeState {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  domain: string;
  icon: string;
  size: SkillThreeNodeSize;
  status: SkillThreeNodeStatus;
  progressPercent: number;
  rewardXp: number;
  linkedAchievementIds: string[];
}

export interface SkillThreeAchievementState {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: SkillThreeAchievementStatus;
  progressPercent: number;
  remainingLabel: string;
  xpBonus: number;
  recommendedLevel: number;
}

export interface SkillThreeMissionState {
  instanceId: string;
  title: string;
  description: string;
  rewardXp: number;
  progressPercent: number;
  progress: number;
  target: number | string;
  metric: string;
  completed: boolean;
  window: SkillThreeMissionWindow;
  rarity: SkillThreeMissionRarity;
}

export interface SkillThreeLeaderboardEntry {
  id: string;
  name: string;
  avatarUrl: string | null;
  badge: string;
  rankLabel: string;
  level: number;
  weeklyXp: number;
  positionDelta: number;
  isCurrentUser: boolean;
}

export interface SkillThreeLeaderboardBucket {
  topThree: SkillThreeLeaderboardEntry[];
  entries: SkillThreeLeaderboardEntry[];
}

export interface SkillThreeExperience {
  activeTrack: SkillThreeTrackSummary | null;
  totalXp: number;
  level: {
    level: number;
    nextLevelXp: number | null;
  };
  playerState: {
    sound_enabled: boolean;
  };
  formationProgress: {
    masteredNodes: number;
    totalNodes: number;
  };
  skillTree: SkillThreeNodeState[];
  dailyMissions: SkillThreeMissionState[];
  achievements: SkillThreeAchievementState[];
  unlockedAchievements: SkillThreeAchievementState[];
  leaderboardByScope: Record<
    SkillThreeLeaderboardScope,
    SkillThreeLeaderboardBucket
  >;
}
