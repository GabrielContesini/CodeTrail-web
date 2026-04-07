import type { SkillThreeExperience } from "@/utils/skillthree/types";

const SKILLTHREE_LEVEL_XP_STEP = 320;
const SKILLTHREE_MAX_LEVEL = 20;

export interface SkillThreeTotalXpInput {
  skillXp: number;
  achievementXp: number;
  sessionCount: number;
  sessionHours: number;
  completedReviews: number;
  completedTasks: number;
  projectXp: number;
  trackXp: number;
}

export interface SkillThreeProgressSnapshot {
  xp: number;
  level: number;
  nextLevelXp: number | null;
  unlocked: number;
}

export interface SkillThreeProgressToastState {
  xpDelta: number;
  levelUpTo: number | null;
  unlockedDelta: number;
  currentXp: number;
  nextLevelXp: number | null;
}

export function calculateSkillThreeTotalXp(input: SkillThreeTotalXpInput) {
  return Math.round(
    input.skillXp +
      input.achievementXp +
      input.sessionCount * 36 +
      input.sessionHours * 42 +
      input.completedReviews * 24 +
      input.completedTasks * 18 +
      input.projectXp +
      input.trackXp,
  );
}

export function calculateSkillThreeLevel(totalXp: number) {
  const level = Math.max(1, Math.floor(totalXp / SKILLTHREE_LEVEL_XP_STEP) + 1);

  return {
    level,
    nextLevelXp: level >= SKILLTHREE_MAX_LEVEL ? null : level * SKILLTHREE_LEVEL_XP_STEP,
  };
}

export function createSkillThreeProgressSnapshot(
  experience: SkillThreeExperience,
): SkillThreeProgressSnapshot {
  return {
    xp: experience.totalXp,
    level: experience.level.level,
    nextLevelXp: experience.level.nextLevelXp,
    unlocked: experience.unlockedAchievements.length,
  };
}

export function resolveSkillThreeProgressToast(
  previous: SkillThreeProgressSnapshot,
  current: SkillThreeProgressSnapshot,
): SkillThreeProgressToastState | null {
  const xpDelta = current.xp - previous.xp;
  const unlockedDelta = current.unlocked - previous.unlocked;
  const levelUpTo = current.level > previous.level ? current.level : null;

  if (xpDelta <= 0 && unlockedDelta <= 0 && !levelUpTo) {
    return null;
  }

  return {
    xpDelta: Math.max(xpDelta, 0),
    levelUpTo,
    unlockedDelta: Math.max(unlockedDelta, 0),
    currentXp: current.xp,
    nextLevelXp: current.nextLevelXp,
  };
}

export function formatSkillThreeXp(value: number) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}
