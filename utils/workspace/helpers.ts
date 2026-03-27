import type {
  AnalyticsSummary,
  AppSettingsRow,
  BillingFeatureEntitlement,
  BillingPlanCode,
  BillingSnapshot,
  ChartDatum,
  DashboardSummary,
  FlashcardRow,
  MindMapConnectionData,
  MindMapDocument,
  MindMapNodeData,
  MindMapNodeShape,
  NoteContentDocument,
  NoteContextLink,
  ProjectBundle,
  ProjectRow,
  ProjectStepRow,
  SessionType,
  StudyModuleRow,
  StudyNoteRow,
  StudySessionRow,
  StudySkillRow,
  StudyTrackRow,
  TaskRow,
  TrackBlueprint,
  UserSkillProgressRow,
  WorkspaceData,
  WorkspaceFeatureAccess,
  WorkspaceSectionKey,
} from "@/utils/workspace/types";

export interface NavigationItem {
  label: string;
  section: WorkspaceSectionKey;
  href: string;
  icon: string;
}

export interface RouteMeta {
  title: string;
  subtitle: string;
}

const NOTE_CONTEXT_HEADER = "[codetrail_context]";
const NOTE_CONTEXT_FOOTER = "[/codetrail_context]";
const BILLING_FEATURE_KEYS = {
  notes: "notes_access",
  flashcards: "flashcards_access",
  mindMaps: "mind_maps_access",
  analytics: "analytics_access",
  aiGeneration: "ai_generation",
  notesLimit: "notes_limit",
  projectsLimit: "projects_limit",
  flashcardsLimit: "flashcards_limit",
  mindMapsLimit: "mind_maps_limit",
} as const;

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    section: "dashboard",
    href: "/workspace/dashboard",
    icon: "dashboard",
  },
  {
    label: "Trilhas",
    section: "tracks",
    href: "/workspace/tracks",
    icon: "layers",
  },
  {
    label: "Sessões",
    section: "sessions",
    href: "/workspace/sessions",
    icon: "timer",
  },
  {
    label: "Tarefas",
    section: "tasks",
    href: "/workspace/tasks",
    icon: "checklist",
  },
  {
    label: "Revisões",
    section: "reviews",
    href: "/workspace/reviews",
    icon: "rotate",
  },
  {
    label: "Projetos",
    section: "projects",
    href: "/workspace/projects",
    icon: "folder",
  },
  {
    label: "Notas",
    section: "notes",
    href: "/workspace/notes",
    icon: "notes",
  },
  {
    label: "Flashcards",
    section: "flashcards",
    href: "/workspace/flashcards",
    icon: "cards",
  },
  {
    label: "Mind Maps",
    section: "mind-maps",
    href: "/workspace/mind-maps",
    icon: "mindmap",
  },
  {
    label: "Analytics",
    section: "analytics",
    href: "/workspace/analytics",
    icon: "analytics",
  },
  {
    label: "Config.",
    section: "settings",
    href: "/workspace/settings",
    icon: "settings",
  },
];

export const routeMetaBySection: Record<WorkspaceSectionKey, RouteMeta> = {
  dashboard: {
    title: "Dashboard",
    subtitle:
      "Resumo executivo do estudo, da execução e das próximas ações.",
  },
  tracks: {
    title: "Trilhas",
    subtitle: "Roadmaps, skills e módulos para orientar sua evolução.",
  },
  sessions: {
    title: "Sessões",
    subtitle: "Cronômetro, histórico e blocos de foco com contexto real.",
  },
  tasks: {
    title: "Tarefas",
    subtitle: "Transforme planejamento em execução com prazos e prioridade.",
  },
  reviews: {
    title: "Revisões",
    subtitle: "Retenção do conteúdo com ciclos D+1, D+7, D+15 e D+30.",
  },
  projects: {
    title: "Projetos",
    subtitle: "Portfólio prático com etapas, links e ritmo de entrega.",
  },
  notes: {
    title: "Notas",
    subtitle: "Base viva de resumos, comandos, snippets e checkpoints.",
  },
  flashcards: {
    title: "Flashcards",
    subtitle: "Revisão ativa com decks, fila do dia e repetição espaçada.",
  },
  "mind-maps": {
    title: "Mind Maps",
    subtitle: "Canvas visual para conectar conceitos, módulos e projetos.",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Consistência, volume e evolução da trilha em números.",
  },
  settings: {
    title: "Configurações",
    subtitle: "Conta, preferências e manutenção do workspace web.",
  },
  "settings-billing": {
    title: "Plano e Cobrança",
    subtitle: "Assinatura, trial e recursos premium do workspace.",
  },
};

export function resolveSection(slug: string[] | undefined): WorkspaceSectionKey {
  const path = (slug ?? []).join("/");
  if (!path || path === "dashboard") return "dashboard";
  if (path === "tracks") return "tracks";
  if (path === "sessions") return "sessions";
  if (path === "tasks") return "tasks";
  if (path === "reviews") return "reviews";
  if (path === "projects") return "projects";
  if (path === "notes") return "notes";
  if (path === "flashcards") return "flashcards";
  if (path === "mind-maps" || path.startsWith("mind-maps/")) return "mind-maps";
  if (path === "analytics") return "analytics";
  if (path === "settings") return "settings";
  if (path === "settings/billing" || path.startsWith("settings/billing/")) return "settings-billing";
  return "dashboard";
}

export function sectionHref(section: WorkspaceSectionKey) {
  switch (section) {
    case "settings-billing":
      return "/workspace/settings/billing";
    case "dashboard":
      return "/workspace/dashboard";
    default:
      return `/workspace/${section}`;
  }
}

export function getInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "CT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function labelForFocusType(value: string) {
  switch (value) {
    case "job":
      return "Conseguir vaga";
    case "promotion":
      return "Promoção";
    case "freelance":
      return "Freelas";
    case "solid_foundation":
      return "Base sólida";
    case "career_transition":
      return "Transição";
    default:
      return "Sem foco";
  }
}

export function labelForSkillLevel(value: string) {
  switch (value) {
    case "beginner":
      return "Iniciante";
    case "junior":
      return "Júnior";
    case "mid_level":
      return "Pleno";
    case "senior":
      return "Sênior";
    default:
      return value;
  }
}

export function labelForSessionType(value: SessionType) {
  switch (value) {
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
      return value;
  }
}

export function labelForTaskPriority(value: string) {
  switch (value) {
    case "low":
      return "Baixa";
    case "medium":
      return "Média";
    case "high":
      return "Alta";
    case "critical":
      return "Crítica";
    default:
      return value;
  }
}

export function labelForTaskStatus(value: string) {
  switch (value) {
    case "pending":
      return "Pendente";
    case "in_progress":
      return "Em andamento";
    case "completed":
      return "Concluída";
    default:
      return value;
  }
}

export function labelForProjectStatus(value: string) {
  switch (value) {
    case "planned":
      return "Planejado";
    case "active":
      return "Ativo";
    case "blocked":
      return "Bloqueado";
    case "completed":
      return "Concluído";
    default:
      return value;
  }
}

export function labelForReviewStatus(value: string) {
  switch (value) {
    case "pending":
      return "Pendente";
    case "completed":
      return "Concluída";
    case "overdue":
      return "Atrasada";
    default:
      return value;
  }
}

export function themeLabel(value: string) {
  switch (value) {
    case "system":
      return "Sistema";
    case "dark":
      return "Escuro";
    case "light":
      return "Claro";
    default:
      return value;
  }
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Sem data";
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDate(value?: string | null) {
  if (!value) return "Sem data";
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatDayHour(value?: string | null) {
  if (!value) return "Sem data";
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCurrencyBrl(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function billingIntervalLabel(interval: string) {
  switch (interval) {
    case "year":
      return "/ano";
    case "one_time":
    case "lifetime":
      return "/único";
    case "month":
    default:
      return "/mês";
  }
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

export function formatHours(value: number) {
  return `${value.toFixed(1)}h`;
}

export function formatRelativeDue(value?: string | null) {
  if (!value) return "Sem prazo";
  const target = new Date(value);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Disponível agora";
  const minutes = Math.round(diffMs / 60000);
  const hours = Math.round(diffMs / 3600000);
  const days = Math.round(diffMs / 86400000);
  if (days >= 1) return `Em ${days}d`;
  if (hours >= 1) return `Em ${hours}h`;
  return `Em ${Math.max(minutes, 1)}min`;
}

export function emptyBillingSnapshot(): BillingSnapshot {
  return {
    customer: null,
    subscription: null,
    current_plan: {
      id: "free",
      code: "free",
      name: "Free",
      description: "Acesso básico ao produto.",
      price_cents: 0,
      currency: "BRL",
      interval: "month",
      is_active: true,
      is_public: true,
      trial_days: 0,
      metadata: { badge: "Free" },
      features: [
        { feature_key: BILLING_FEATURE_KEYS.notes, enabled: true, limit_value: null },
        {
          feature_key: BILLING_FEATURE_KEYS.flashcards,
          enabled: false,
          limit_value: 0,
        },
        {
          feature_key: BILLING_FEATURE_KEYS.mindMaps,
          enabled: false,
          limit_value: 0,
        },
        {
          feature_key: BILLING_FEATURE_KEYS.analytics,
          enabled: false,
          limit_value: null,
        },
        {
          feature_key: BILLING_FEATURE_KEYS.aiGeneration,
          enabled: false,
          limit_value: null,
        },
        {
          feature_key: BILLING_FEATURE_KEYS.notesLimit,
          enabled: true,
          limit_value: 40,
        },
        {
          feature_key: BILLING_FEATURE_KEYS.projectsLimit,
          enabled: true,
          limit_value: 3,
        },
        {
          feature_key: BILLING_FEATURE_KEYS.flashcardsLimit,
          enabled: false,
          limit_value: 0,
        },
        {
          feature_key: BILLING_FEATURE_KEYS.mindMapsLimit,
          enabled: false,
          limit_value: 0,
        },
      ],
    },
    available_plans: [],
    features: [],
    payments: [],
    founding_eligible: false,
    config: {
      billing_provider: "stripe",
      trial_enabled: false,
      trial_days_default: 0,
      founding_plan_enabled: false,
    },
  };
}

export function entitlementFor(
  billing: BillingSnapshot | null,
  featureKey: string,
): BillingFeatureEntitlement {
  const features =
    billing?.features.length
      ? billing.features
      : billing?.current_plan?.features ?? emptyBillingSnapshot().current_plan!.features ?? [];

  return (
    features.find((item) => item.feature_key === featureKey) ?? {
      feature_key: featureKey,
      enabled: false,
      limit_value: null,
    }
  );
}

export function planCode(billing: BillingSnapshot | null): BillingPlanCode {
  return billing?.current_plan?.code ?? "free";
}

export function featureAccess(billing: BillingSnapshot | null): WorkspaceFeatureAccess {
  return {
    notes: entitlementFor(billing, BILLING_FEATURE_KEYS.notes).enabled,
    flashcards: entitlementFor(billing, BILLING_FEATURE_KEYS.flashcards).enabled,
    mindMaps: entitlementFor(billing, BILLING_FEATURE_KEYS.mindMaps).enabled,
    analytics: entitlementFor(billing, BILLING_FEATURE_KEYS.analytics).enabled,
    aiGeneration: entitlementFor(billing, BILLING_FEATURE_KEYS.aiGeneration).enabled,
    limits: {
      notes: entitlementFor(billing, BILLING_FEATURE_KEYS.notesLimit).limit_value,
      projects: entitlementFor(billing, BILLING_FEATURE_KEYS.projectsLimit).limit_value,
      flashcards: entitlementFor(billing, BILLING_FEATURE_KEYS.flashcardsLimit).limit_value,
      mindMaps: entitlementFor(billing, BILLING_FEATURE_KEYS.mindMapsLimit).limit_value,
    },
  };
}

export function sortByIsoDesc<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
) {
  return [...items].sort((left, right) => {
    const leftValue = String(left[field] ?? "");
    const rightValue = String(right[field] ?? "");
    return new Date(rightValue).getTime() - new Date(leftValue).getTime();
  });
}

export function buildTrackBlueprints(
  tracks: StudyTrackRow[],
  skills: StudySkillRow[],
  modules: StudyModuleRow[],
  progress: UserSkillProgressRow[],
) {
  return tracks.map<TrackBlueprint>((track) => {
    const trackSkills = skills
      .filter((skill) => skill.track_id === track.id)
      .sort((left, right) => left.sort_order - right.sort_order);
    const trackModules = modules
      .filter((module) => module.track_id === track.id)
      .sort((left, right) => left.sort_order - right.sort_order);
    const progressBySkill = Object.fromEntries(
      progress
        .filter((item) => trackSkills.some((skill) => skill.id === item.skill_id))
        .map((item) => [item.skill_id, item]),
    );
    const totalProgress = trackSkills.reduce((sum, skill) => {
      return sum + (progressBySkill[skill.id]?.progress_percent ?? 0);
    }, 0);

    return {
      track,
      skills: trackSkills,
      modules: trackModules,
      progressBySkill,
      progressPercent: trackSkills.length ? totalProgress / trackSkills.length : 0,
    };
  });
}

export function buildProjectBundles(
  projects: ProjectRow[],
  steps: ProjectStepRow[],
) {
  return projects.map<ProjectBundle>((project) => ({
    project,
    steps: steps
      .filter((step) => step.project_id === project.id)
      .sort((left, right) => left.sort_order - right.sort_order),
  }));
}

export function buildDashboardSummary(
  sessions: StudySessionRow[],
  tasks: TaskRow[],
  reviews: { scheduled_for: string; status: string }[],
  projectBundles: ProjectBundle[],
  trackBlueprints: TrackBlueprint[],
): DashboardSummary {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const hoursThisWeek =
    sessions
      .filter((item) => new Date(item.start_time).getTime() >= weekStart.getTime())
      .reduce((sum, item) => sum + item.duration_minutes, 0) / 60;
  const streakDays = new Set(
    sessions.map((item) => {
      const date = new Date(item.start_time);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }),
  ).size;
  const pendingTasks = tasks.filter((task) => task.status !== "completed").length;
  const overdueReviews = reviews.filter((review) => {
    return (
      review.status !== "completed" &&
      new Date(review.scheduled_for).getTime() < now.getTime()
    );
  }).length;
  const activeProjects = projectBundles.filter(
    (item) => item.project.status !== "completed",
  ).length;
  const trackProgress =
    trackBlueprints.reduce((sum, item) => sum + item.progressPercent, 0) /
    (trackBlueprints.length || 1);
  const nextSession = [...sessions].sort((left, right) => {
    return (
      new Date(right.start_time).getTime() - new Date(left.start_time).getTime()
    );
  })[0] ?? null;

  return {
    hoursThisWeek,
    streakDays,
    pendingTasks,
    overdueReviews,
    activeProjects,
    trackProgress,
    nextSession,
    totalSessions: sessions.length,
  };
}

export function buildAnalyticsSummary(
  sessions: StudySessionRow[],
  tasks: TaskRow[],
  reviews: { status: string }[],
  projectBundles: ProjectBundle[],
): AnalyticsSummary {
  const now = new Date();
  const currentWeek = startOfWeek(now);
  const previousWeek = new Date(currentWeek);
  previousWeek.setDate(previousWeek.getDate() - 7);

  const dayBuckets = new Map<string, number>();
  const weekBuckets = new Map<string, number>();
  const byType: Record<SessionType, number> = {
    theory: 0,
    practice: 0,
    review: 0,
    project: 0,
    exercises: 0,
  };
  const bySkill: Record<string, number> = {};
  let totalMinutes = 0;
  let totalProductivity = 0;

  for (const session of sessions) {
    const date = new Date(session.start_time);
    const dayKey = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }).format(date);
    const weekKey = `S${weekOfYear(date)}`;
    const hours = session.duration_minutes / 60;
    totalMinutes += session.duration_minutes;
    totalProductivity += session.productivity_score;
    dayBuckets.set(dayKey, (dayBuckets.get(dayKey) ?? 0) + hours);
    weekBuckets.set(weekKey, (weekBuckets.get(weekKey) ?? 0) + hours);
    byType[session.type] += hours;
    if (session.skill_id) {
      bySkill[session.skill_id] = (bySkill[session.skill_id] ?? 0) + hours;
    }
  }

  const currentWeekHours = sessions
    .filter((session) => new Date(session.start_time).getTime() >= currentWeek.getTime())
    .reduce((sum, session) => sum + session.duration_minutes / 60, 0);
  const previousWeekHours = sessions
    .filter((session) => {
      const time = new Date(session.start_time).getTime();
      return time >= previousWeek.getTime() && time < currentWeek.getTime();
    })
    .reduce((sum, session) => sum + session.duration_minutes / 60, 0);

  const handsOnHours = byType.practice + byType.project + byType.exercises;
  const totalHours = Object.values(byType).reduce((sum, value) => sum + value, 0);
  let dominantStudyType: SessionType | null = null;
  let dominantStudyHours = -1;
  for (const [type, hours] of Object.entries(byType) as [SessionType, number][]) {
    if (hours > dominantStudyHours) {
      dominantStudyHours = hours;
      dominantStudyType = type;
    }
  }

  return {
    hoursPerDay: Array.from(dayBuckets.entries()).map<ChartDatum>(([label, value]) => ({
      label,
      value,
    })),
    hoursPerWeek: Array.from(weekBuckets.entries()).map<ChartDatum>(
      ([label, value]) => ({
        label,
        value,
      }),
    ),
    byType,
    skillStudyMap: bySkill,
    completedTaskRate: tasks.length
      ? tasks.filter((task) => task.status === "completed").length / tasks.length
      : 0,
    completedReviews: reviews.filter((review) => review.status === "completed").length,
    completedProjects: projectBundles.filter(
      (bundle) => bundle.project.status === "completed",
    ).length,
    consistencyDays: new Set(
      sessions
        .filter((session) => {
          return (
            new Date(session.start_time).getTime() >=
            now.getTime() - 30 * 24 * 60 * 60 * 1000
          );
        })
        .map((session) => {
          const date = new Date(session.start_time);
          return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        }),
    ).size,
    currentWeekHours,
    previousWeekHours,
    averageSessionMinutes: sessions.length ? totalMinutes / sessions.length : 0,
    averageProductivityScore: sessions.length
      ? totalProductivity / sessions.length
      : 0,
    focusBalancePercent: totalHours ? (handsOnHours / totalHours) * 100 : 0,
    dominantStudyType,
  };
}

export function composeWorkspaceData(args: {
  profile: WorkspaceData["profile"];
  goal: WorkspaceData["goal"];
  tracks: WorkspaceData["tracks"];
  skills: WorkspaceData["skills"];
  progress: WorkspaceData["progress"];
  modules: WorkspaceData["modules"];
  sessions: WorkspaceData["sessions"];
  tasks: WorkspaceData["tasks"];
  reviews: WorkspaceData["reviews"];
  projects: WorkspaceData["projects"];
  projectSteps: WorkspaceData["projectSteps"];
  notes: WorkspaceData["notes"];
  flashcards: WorkspaceData["flashcards"];
  mindMaps: WorkspaceData["mindMaps"];
  settings: WorkspaceData["settings"];
  billing: WorkspaceData["billing"];
}): WorkspaceData {
  const trackBlueprints = buildTrackBlueprints(
    args.tracks,
    args.skills,
    args.modules,
    args.progress,
  );
  const projectBundles = buildProjectBundles(args.projects, args.projectSteps);

  return {
    ...args,
    billing: args.billing ?? emptyBillingSnapshot(),
    trackBlueprints,
    projectBundles,
    dashboardSummary: buildDashboardSummary(
      args.sessions,
      args.tasks,
      args.reviews,
      projectBundles,
      trackBlueprints,
    ),
    analyticsSummary: buildAnalyticsSummary(
      args.sessions,
      args.tasks,
      args.reviews,
      projectBundles,
    ),
    featureAccess: featureAccess(args.billing),
  };
}

export function buildDefaultSettings(userId: string): AppSettingsRow {
  const now = new Date().toISOString();
  return {
    id: userId,
    user_id: userId,
    theme_preference: "dark",
    notifications_enabled: true,
    daily_reminder_hour: 20,
    created_at: now,
    updated_at: now,
  };
}

export function decodeNoteContent(rawContent: string): NoteContentDocument {
  const normalized = rawContent.replace(/\r\n/g, "\n").trim();
  if (!normalized.startsWith(`${NOTE_CONTEXT_HEADER}\n`)) {
    return {
      body: normalized,
      context: emptyNoteContext(),
      searchableText: normalized,
      labels: [],
    };
  }

  const footerIndex = normalized.indexOf(`\n${NOTE_CONTEXT_FOOTER}`);
  if (footerIndex === -1) {
    return {
      body: normalized,
      context: emptyNoteContext(),
      searchableText: normalized,
      labels: [],
    };
  }

  const metadataBlock = normalized.slice(NOTE_CONTEXT_HEADER.length + 1, footerIndex);
  const bodyStart = footerIndex + NOTE_CONTEXT_FOOTER.length + 2;
  const values = new Map<string, string>();

  for (const line of metadataBlock.split("\n")) {
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key && value) values.set(key, value);
  }

  const context = {
    trackId: values.get("track_id") ?? null,
    trackLabel: values.get("track_label") ?? null,
    moduleId: values.get("module_id") ?? null,
    moduleLabel: values.get("module_label") ?? null,
    projectId: values.get("project_id") ?? null,
    projectLabel: values.get("project_label") ?? null,
  };

  const body = normalized.slice(bodyStart).trim();
  const labels = noteContextLabels(context);
  return {
    body,
    context,
    labels,
    searchableText: [body, ...labels].join(" ").trim(),
  };
}

export function encodeNoteContent(body: string, context: NoteContextLink) {
  const normalizedBody = body.trim();
  const values = [
    maybeContextLine("track_id", context.trackId),
    maybeContextLine("track_label", context.trackLabel),
    maybeContextLine("module_id", context.moduleId),
    maybeContextLine("module_label", context.moduleLabel),
    maybeContextLine("project_id", context.projectId),
    maybeContextLine("project_label", context.projectLabel),
  ].filter(Boolean) as string[];

  if (!values.length) {
    return normalizedBody;
  }

  return [NOTE_CONTEXT_HEADER, ...values, NOTE_CONTEXT_FOOTER, "", normalizedBody].join(
    "\n",
  );
}

export function emptyNoteContext(): NoteContextLink {
  return {
    trackId: null,
    trackLabel: null,
    moduleId: null,
    moduleLabel: null,
    projectId: null,
    projectLabel: null,
  };
}

export function noteContextLabels(context: NoteContextLink) {
  return [context.trackLabel, context.moduleLabel, context.projectLabel].filter(
    (value): value is string => Boolean(value?.trim()),
  );
}

function maybeContextLine(key: string, value: string | null) {
  if (!value?.trim()) return null;
  return `${key}=${value.trim()}`;
}

export function initialMindMapDocument(rootLabel = "Tema central"): MindMapDocument {
  return {
    nodes: [
      {
        id: "root-node",
        label: rootLabel,
        shape: "rounded",
        colorHex: "#2EC5FF",
        x: 320,
        y: 260,
        width: 220,
        height: 116,
      },
    ],
    connections: [],
  };
}

export function encodeMindMap(document: MindMapDocument) {
  return JSON.stringify({
    schema_version: 1,
    nodes: document.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      shape: node.shape,
      color_hex: node.colorHex,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    })),
    connections: document.connections.map((connection) => ({
      id: connection.id,
      source_id: connection.sourceId,
      target_id: connection.targetId,
    })),
  });
}

export function decodeMindMap(raw: string | null | undefined, fallbackLabel = "Tema central") {
  if (!raw?.trim()) {
    return initialMindMapDocument(fallbackLabel);
  }

  try {
    const decoded = JSON.parse(raw) as {
      nodes?: Array<Record<string, unknown>>;
      connections?: Array<Record<string, unknown>>;
    };
    const nodes = (decoded.nodes ?? [])
      .map((item) => decodeMindMapNode(item))
      .filter((item): item is MindMapNodeData => Boolean(item));
    if (!nodes.length) {
      return initialMindMapDocument(fallbackLabel);
    }

    const nodeIds = new Set(nodes.map((item) => item.id));
    const connections = (decoded.connections ?? [])
      .map((item) => decodeMindMapConnection(item))
      .filter((item): item is MindMapConnectionData => Boolean(item))
      .filter((item) => {
        return (
          item.sourceId !== item.targetId &&
          nodeIds.has(item.sourceId) &&
          nodeIds.has(item.targetId)
        );
      });
    return { nodes, connections };
  } catch {
    return initialMindMapDocument(fallbackLabel);
  }
}

function decodeMindMapNode(item: Record<string, unknown>) {
  const shapeName = String(item.shape ?? "rounded");
  const shape: MindMapNodeShape =
    shapeName === "rectangle" ||
    shapeName === "rounded" ||
    shapeName === "ellipse" ||
    shapeName === "diamond"
      ? shapeName
      : "rounded";
  return {
    id: String(item.id ?? ""),
    label: String(item.label ?? "Novo conceito"),
    shape,
    colorHex: String(item.color_hex ?? "#2EC5FF"),
    x: Number(item.x ?? 320),
    y: Number(item.y ?? 260),
    width: Number(item.width ?? 220),
    height: Number(item.height ?? 116),
  };
}

function decodeMindMapConnection(item: Record<string, unknown>) {
  return {
    id: String(item.id ?? ""),
    sourceId: String(item.source_id ?? ""),
    targetId: String(item.target_id ?? ""),
  };
}

export function colorFromHex(value: string) {
  const normalized = value.replace("#", "");
  const hex = normalized.length === 6 ? normalized : normalized.slice(-6);
  return `#${hex}`;
}

export function applyFlashcardReview(
  flashcard: FlashcardRow,
  grade: "again" | "hard" | "good" | "easy",
) {
  const now = new Date();
  const baseEase = Math.max(1.3, flashcard.ease_factor);
  let nextIntervalDays = 0;
  let nextStreak = 0;
  let nextEaseFactor = baseEase;
  let nextDueAt = now;

  if (grade === "again") {
    nextIntervalDays = 0;
    nextStreak = 0;
    nextEaseFactor = roundEase(Math.max(1.3, baseEase - 0.2));
    nextDueAt = new Date(now.getTime() + 10 * 60 * 1000);
  }

  if (grade === "hard") {
    const baseInterval = Math.max(1, flashcard.interval_days);
    nextIntervalDays =
      flashcard.review_count === 0 ? 1 : Math.max(1, Math.round(baseInterval * 1.2));
    nextStreak = Math.max(0, flashcard.correct_streak - 1);
    nextEaseFactor = roundEase(Math.max(1.3, baseEase - 0.1));
    nextDueAt = new Date(now.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000);
  }

  if (grade === "good") {
    const baseInterval = Math.max(1, flashcard.interval_days);
    nextIntervalDays =
      flashcard.review_count === 0
        ? 1
        : Math.max(baseInterval + 1, Math.round(baseInterval * baseEase));
    nextStreak = flashcard.correct_streak + 1;
    nextEaseFactor = roundEase(baseEase);
    nextDueAt = new Date(now.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000);
  }

  if (grade === "easy") {
    const baseInterval = Math.max(2, flashcard.interval_days);
    nextIntervalDays =
      flashcard.review_count === 0
        ? 3
        : Math.max(baseInterval + 2, Math.round(baseInterval * (baseEase + 0.35)));
    nextStreak = flashcard.correct_streak + 1;
    nextEaseFactor = roundEase(baseEase + 0.15);
    nextDueAt = new Date(now.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000);
  }

  return {
    ...flashcard,
    due_at: nextDueAt.toISOString(),
    last_reviewed_at: now.toISOString(),
    review_count: flashcard.review_count + 1,
    correct_streak: nextStreak,
    ease_factor: nextEaseFactor,
    interval_days: nextIntervalDays,
    updated_at: now.toISOString(),
  };
}

function roundEase(value: number) {
  return Number(value.toFixed(2));
}

function startOfWeek(value: Date) {
  const local = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  local.setDate(local.getDate() - (local.getDay() === 0 ? 6 : local.getDay() - 1));
  return local;
}

function weekOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((date.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export function normalizedDeckName(value: string) {
  const normalized = value.trim();
  return normalized || "Geral";
}

export function noteWordCount(note: StudyNoteRow) {
  return decodeNoteContent(note.content).body
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function noteReadingMinutes(note: StudyNoteRow) {
  const count = noteWordCount(note);
  return count ? Math.ceil(count / 180) : 0;
}

export function projectCompletion(bundle: ProjectBundle) {
  if (!bundle.steps.length) return bundle.project.progress_percent;
  return (
    (bundle.steps.filter((step) => step.is_done).length / bundle.steps.length) * 100
  );
}

export function uniqueFolders(rows: Array<{ folder_name: string }>) {
  return ["Todas", ...new Set(["Geral", ...rows.map((item) => item.folder_name).filter(Boolean)])];
}

export function uniqueDecks(rows: Array<{ deck_name: string }>) {
  return ["Todas", ...new Set(["Geral", ...rows.map((item) => normalizedDeckName(item.deck_name))])];
}
