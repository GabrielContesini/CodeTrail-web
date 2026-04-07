import { describe, expect, it } from "vitest";
import { buildSkillThreeExperience } from "@/utils/skillthree/build-skillthree";
import {
  createSkillThreeProgressSnapshot,
  resolveSkillThreeProgressToast,
} from "@/utils/skillthree/progression";
import type { SkillThreeExperience } from "@/utils/skillthree/types";
import type { WorkspaceData } from "@/utils/workspace/types";

const now = "2026-04-06T12:00:00.000Z";

function createWorkspaceFixture(): WorkspaceData {
  return {
    profile: {
      id: "user-1",
      full_name: "Gabriel",
      avatar_url: null,
      email: "gabriel@codetrail.site",
      desired_area: "Backend",
      current_level: "mid_level",
      onboarding_completed: true,
      selected_track_id: "track-1",
      created_at: now,
      updated_at: now,
    },
    goal: null,
    tracks: [
      {
        id: "track-1",
        name: "Backend Timeline",
        description: "Roadmap de backend com módulos encadeados.",
        icon_key: "layers",
        color_hex: "#12C3FF",
        roadmap_summary: "Fundamentos, APIs e entrega operacional.",
        created_at: now,
        updated_at: now,
      },
    ],
    skills: [
      {
        id: "skill-1",
        track_id: "track-1",
        name: "HTTP",
        description: "Protocolos e contratos.",
        target_level: "junior",
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: "skill-2",
        track_id: "track-1",
        name: "Postgres",
        description: "Persistência e consultas.",
        target_level: "mid_level",
        sort_order: 2,
        created_at: now,
        updated_at: now,
      },
    ],
    progress: [
      {
        id: "progress-1",
        user_id: "user-1",
        skill_id: "skill-1",
        progress_percent: 100,
        last_studied_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: "progress-2",
        user_id: "user-1",
        skill_id: "skill-2",
        progress_percent: 50,
        last_studied_at: now,
        created_at: now,
        updated_at: now,
      },
    ],
    modules: [
      {
        id: "module-1",
        track_id: "track-1",
        title: "Fundamentos",
        summary: "Base inicial da trilha.",
        estimated_hours: 6,
        sort_order: 1,
        is_core: true,
        created_at: now,
        updated_at: now,
      },
    ],
    trackStates: [
      {
        id: "track-state-1",
        user_id: "user-1",
        track_id: "track-1",
        status: "in_progress",
        current_module_id: "module-1",
        progress_percent: 50,
        started_at: now,
        paused_at: null,
        completed_at: null,
        last_activity_at: now,
        created_at: now,
        updated_at: now,
      },
    ],
    trackModuleStates: [],
    sessions: [
      {
        id: "session-1",
        user_id: "user-1",
        track_id: "track-1",
        skill_id: "skill-1",
        module_id: "module-1",
        type: "practice",
        start_time: "2026-03-20T10:00:00.000Z",
        end_time: "2026-03-20T11:00:00.000Z",
        duration_minutes: 60,
        notes: "Sessão prática.",
        productivity_score: 4,
        created_at: now,
        updated_at: now,
      },
      {
        id: "session-2",
        user_id: "user-1",
        track_id: "track-1",
        skill_id: "skill-2",
        module_id: "module-1",
        type: "project",
        start_time: "2026-03-28T10:00:00.000Z",
        end_time: "2026-03-28T11:30:00.000Z",
        duration_minutes: 90,
        notes: "Sessão de projeto.",
        productivity_score: 5,
        created_at: now,
        updated_at: now,
      },
    ],
    tasks: [
      {
        id: "task-1",
        user_id: "user-1",
        track_id: "track-1",
        module_id: "module-1",
        title: "Implementar endpoint",
        description: "Fechar contrato da API.",
        priority: "high",
        status: "completed",
        due_date: null,
        completed_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: "task-2",
        user_id: "user-1",
        track_id: "track-1",
        module_id: "module-1",
        title: "Escrever testes",
        description: "Cobrir casos principais.",
        priority: "medium",
        status: "completed",
        due_date: null,
        completed_at: now,
        created_at: now,
        updated_at: now,
      },
    ],
    reviews: [
      {
        id: "review-1",
        user_id: "user-1",
        session_id: "session-1",
        track_id: "track-1",
        skill_id: "skill-1",
        title: "Revisão HTTP",
        scheduled_for: now,
        status: "completed",
        interval_label: "D+1",
        notes: null,
        completed_at: now,
        created_at: now,
        updated_at: now,
      },
    ],
    projects: [
      {
        id: "project-1",
        user_id: "user-1",
        track_id: "track-1",
        title: "API de autenticação",
        scope: "Projeto da trilha",
        description: "Entrega prática.",
        repository_url: null,
        documentation_url: null,
        video_url: null,
        status: "active",
        progress_percent: 50,
        created_at: now,
        updated_at: now,
      },
    ],
    projectSteps: [],
    notes: [],
    flashcards: [],
    mindMaps: [],
    notifications: [],
    settings: {
      id: "settings-1",
      user_id: "user-1",
      notifications_enabled: true,
      theme_preference: "dark",
      daily_reminder_hour: null,
      created_at: now,
      updated_at: now,
    },
    billing: {
      customer: null,
      subscription: null,
      current_plan: null,
      available_plans: [],
      features: [],
      payments: [],
      founding_eligible: false,
      config: {
        billing_provider: "stripe",
        trial_enabled: true,
        trial_days_default: 7,
        founding_plan_enabled: true,
      },
    },
    trackBlueprints: [
      {
        track: {
          id: "track-1",
          name: "Backend Timeline",
          description: "Roadmap de backend com módulos encadeados.",
          icon_key: "layers",
          color_hex: "#12C3FF",
          roadmap_summary: "Fundamentos, APIs e entrega operacional.",
          created_at: now,
          updated_at: now,
        },
        skills: [
          {
            id: "skill-1",
            track_id: "track-1",
            name: "HTTP",
            description: "Protocolos e contratos.",
            target_level: "junior",
            sort_order: 1,
            created_at: now,
            updated_at: now,
          },
          {
            id: "skill-2",
            track_id: "track-1",
            name: "Postgres",
            description: "Persistência e consultas.",
            target_level: "mid_level",
            sort_order: 2,
            created_at: now,
            updated_at: now,
          },
        ],
        modules: [
          {
            id: "module-1",
            track_id: "track-1",
            title: "Fundamentos",
            summary: "Base inicial da trilha.",
            sort_order: 1,
            estimated_hours: 6,
            is_core: true,
            created_at: now,
            updated_at: now,
          },
        ],
        progressBySkill: {
          "skill-1": {
            id: "progress-1",
            user_id: "user-1",
            skill_id: "skill-1",
            progress_percent: 100,
            last_studied_at: now,
            created_at: now,
            updated_at: now,
          },
          "skill-2": {
            id: "progress-2",
            user_id: "user-1",
            skill_id: "skill-2",
            progress_percent: 50,
            last_studied_at: now,
            created_at: now,
            updated_at: now,
          },
        },
        progressPercent: 75,
        isCompleted: false,
      },
    ],
    projectBundles: [],
    dashboardSummary: {
      hoursThisWeek: 0,
      streakDays: 3,
      pendingTasks: 0,
      overdueReviews: 0,
      activeProjects: 1,
      trackProgress: 50,
      nextSession: null,
      totalSessions: 2,
    },
    analyticsSummary: {
      hoursPerDay: [],
      hoursPerWeek: [],
      byType: {
        theory: 0,
        practice: 1,
        review: 0,
        project: 1.5,
        exercises: 0,
      },
      skillStudyMap: {},
      completedTaskRate: 1,
      completedReviews: 1,
      completedProjects: 0,
      consistencyDays: 2,
      currentWeekHours: 0,
      previousWeekHours: 2.5,
      averageSessionMinutes: 75,
      averageProductivityScore: 4.5,
      focusBalancePercent: 100,
      dominantStudyType: "project",
    },
    featureAccess: {
      notes: true,
      flashcards: true,
      mindMaps: true,
      analytics: true,
      aiGeneration: true,
      limits: {
        notes: null,
        projects: null,
        flashcards: null,
        mindMaps: null,
      },
    },
  };
}

function createExperienceSnapshot(overrides: Partial<SkillThreeExperience> = {}) {
  return createSkillThreeProgressSnapshot({
    activeTrack: { id: "track-1", name: "Backend", commandLabel: "Backend" },
    totalXp: 1200,
    level: { level: 4, nextLevelXp: 1280 },
    playerState: { sound_enabled: true },
    formationProgress: { masteredNodes: 1, totalNodes: 3 },
    skillTree: [],
    dailyMissions: [],
    achievements: [],
    unlockedAchievements: [],
    leaderboardByScope: {
      global: { topThree: [], entries: [] },
      weekly: { topThree: [], entries: [] },
      track: { topThree: [], entries: [] },
    },
    ...overrides,
  });
}

describe("SkillThree progression", () => {
  it("keeps XP cumulative across sessions, tasks, reviews, projects and track progress", () => {
    const data = createWorkspaceFixture();

    const experience = buildSkillThreeExperience(data);

    expect(experience.totalXp).toBe(4222);
    expect(experience.level.level).toBe(14);
    expect(experience.level.nextLevelXp).toBe(4480);
  });

  it("builds toast payloads only when progress actually increases", () => {
    const previous = createExperienceSnapshot({
      unlockedAchievements: [
        {
          id: "achievement-1",
          name: "Boot Sequence",
          description: "",
          icon: "zap",
          status: "unlocked",
          progressPercent: 0,
          remainingLabel: "",
          xpBonus: 180,
          recommendedLevel: 1,
        },
      ],
    });
    const current = {
      xp: 1430,
      level: 5,
      unlocked: 2,
    };

    expect(resolveSkillThreeProgressToast(previous, current)).toEqual({
      xpDelta: 230,
      levelUpTo: 5,
      unlockedDelta: 1,
    });
    expect(resolveSkillThreeProgressToast(current, current)).toBeNull();
  });
});
