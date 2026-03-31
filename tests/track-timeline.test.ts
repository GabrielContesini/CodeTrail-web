import { describe, expect, it } from "vitest";
import { buildTrackTimelineDetail } from "@/utils/workspace/helpers";
import type { WorkspaceData } from "@/utils/workspace/types";

const now = "2026-03-28T12:00:00.000Z";

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
      {
        id: "skill-3",
        track_id: "track-1",
        name: "Observabilidade",
        description: "Logs e diagnóstico.",
        target_level: "mid_level",
        sort_order: 3,
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
        progress_percent: 64,
        last_studied_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: "progress-3",
        user_id: "user-1",
        skill_id: "skill-3",
        progress_percent: 12,
        last_studied_at: null,
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
      {
        id: "module-2",
        track_id: "track-1",
        title: "APIs",
        summary: "Modelagem e contratos da aplicação.",
        estimated_hours: 8,
        sort_order: 2,
        is_core: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: "module-3",
        track_id: "track-1",
        title: "Operação",
        summary: "Logs, métricas e entrega.",
        estimated_hours: 5,
        sort_order: 3,
        is_core: false,
        created_at: now,
        updated_at: now,
      },
    ],
    trackStates: [
      {
        id: "track-state-1",
        user_id: "user-1",
        track_id: "track-1",
        status: "paused",
        current_module_id: "module-2",
        progress_percent: 33.33,
        started_at: now,
        paused_at: now,
        completed_at: null,
        last_activity_at: now,
        created_at: now,
        updated_at: now,
      },
    ],
    trackModuleStates: [
      {
        id: "module-state-1",
        user_id: "user-1",
        track_id: "track-1",
        module_id: "module-1",
        status: "completed",
        started_at: now,
        paused_at: null,
        completed_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: "module-state-2",
        user_id: "user-1",
        track_id: "track-1",
        module_id: "module-2",
        status: "paused",
        started_at: now,
        paused_at: now,
        completed_at: null,
        created_at: now,
        updated_at: now,
      },
    ],
    sessions: [
      {
        id: "session-1",
        user_id: "user-1",
        track_id: "track-1",
        skill_id: "skill-2",
        module_id: "module-2",
        type: "practice",
        start_time: now,
        end_time: now,
        duration_minutes: 45,
        notes: "Sessão prática.",
        productivity_score: 4,
        created_at: now,
        updated_at: now,
      },
    ],
    tasks: [
      {
        id: "task-1",
        user_id: "user-1",
        track_id: "track-1",
        module_id: "module-2",
        title: "Implementar endpoint",
        description: "Fechar contrato da API.",
        priority: "high",
        status: "in_progress",
        due_date: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
      },
    ],
    reviews: [],
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
        progress_percent: 48,
        created_at: now,
        updated_at: now,
      },
    ],
    projectSteps: [],
    notes: [],
    flashcards: [],
    mindMaps: [],
    settings: null,
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
    notifications: [],
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
          {
            id: "skill-3",
            track_id: "track-1",
            name: "Observabilidade",
            description: "Logs e diagnóstico.",
            target_level: "mid_level",
            sort_order: 3,
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
            estimated_hours: 20,
            is_core: true,
            created_at: now,
            updated_at: now,
          },
          {
            id: "module-2",
            track_id: "track-1",
            title: "APIs REST",
            summary: "Construção de APIs.",
            sort_order: 2,
            estimated_hours: 30,
            is_core: true,
            created_at: now,
            updated_at: now,
          },
          {
            id: "module-3",
            track_id: "track-1",
            title: "Deploy",
            summary: "Entrega operacional.",
            sort_order: 3,
            estimated_hours: 15,
            is_core: false,
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
            progress_percent: 64,
            last_studied_at: now,
            created_at: now,
            updated_at: now,
          },
          "skill-3": {
            id: "progress-3",
            user_id: "user-1",
            skill_id: "skill-3",
            progress_percent: 12,
            last_studied_at: null,
            created_at: now,
            updated_at: now,
          },
        },
        progressPercent: 58,
        isCompleted: false,
      },
    ],
    projectBundles: [],
    dashboardSummary: {
      hoursThisWeek: 0,
      streakDays: 0,
      pendingTasks: 0,
      overdueReviews: 0,
      activeProjects: 0,
      trackProgress: 0,
      nextSession: null,
      totalSessions: 0,
    },
    analyticsSummary: {
      hoursPerDay: [],
      hoursPerWeek: [],
      byType: {
        theory: 0,
        practice: 0,
        review: 0,
        project: 0,
        exercises: 0,
      },
      skillStudyMap: {},
      completedTaskRate: 0,
      completedReviews: 0,
      completedProjects: 0,
      consistencyDays: 0,
      currentWeekHours: 0,
      previousWeekHours: 0,
      averageSessionMinutes: 0,
      averageProductivityScore: 0,
      focusBalancePercent: 0,
      dominantStudyType: "practice" as const,
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

describe("buildTrackTimelineDetail", () => {
  it("derives paused timelines with the next blocked step", () => {
    const data = createWorkspaceFixture();

    const timeline = buildTrackTimelineDetail({ data, trackId: "track-1" });

    expect(timeline).not.toBeNull();
    expect(timeline?.status).toBe("paused");
    expect(timeline?.currentStepId).toBe("module-2");
    expect(timeline?.completedSteps).toBe(1);
    expect(timeline?.unlockedSteps).toBe(2);
    expect(timeline?.selectedSuggestedStepId).toBe("module-2");
    expect(timeline?.steps.map((step) => step.status)).toEqual([
      "completed",
      "paused",
      "blocked",
    ]);
    expect(timeline?.steps[1]?.tasks).toHaveLength(1);
    expect(timeline?.steps[1]?.isAccessible).toBe(true);
    expect(timeline?.steps[2]?.isAccessible).toBe(false);
  });

  it("marks every step as completed when the track is finished", () => {
    const data = createWorkspaceFixture();
    data.trackStates[0] = {
      ...data.trackStates[0],
      status: "completed",
      current_module_id: null,
      progress_percent: 100,
      paused_at: null,
      completed_at: now,
    };
    data.trackModuleStates.push({
      id: "module-state-3",
      user_id: "user-1",
      track_id: "track-1",
      module_id: "module-3",
      status: "completed",
      started_at: now,
      paused_at: null,
      completed_at: now,
      created_at: now,
      updated_at: now,
    });

    const timeline = buildTrackTimelineDetail({ data, trackId: "track-1" });

    expect(timeline?.status).toBe("completed");
    expect(timeline?.progressPercent).toBe(100);
    expect(timeline?.unlockedSteps).toBe(3);
    expect(timeline?.steps.every((step) => step.status === "completed")).toBe(true);
    expect(timeline?.selectedSuggestedStepId).toBe("module-1");
  });
});
