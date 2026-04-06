import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { calculateSkillThreeLevel } from "@/utils/skillthree/progression";
import { labelForSkillLevel } from "@/utils/workspace/helpers";
import { createClient } from "@/utils/supabase/server";
import type {
  SkillLevel,
  ProfileRow,
} from "@/utils/workspace/types";
import type {
  SkillThreeLeaderboardBucket,
  SkillThreeLeaderboardEntry,
  SkillThreeLeaderboardScope,
} from "@/utils/skillthree/types";

const MAX_PROFILES = 36;
const MAX_ENTRIES = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

type LeaderboardProfileRow = Pick<
  ProfileRow,
  "id" | "full_name" | "email" | "avatar_url" | "current_level" | "selected_track_id"
>;

type TrackRow = {
  id: string;
  name: string;
};

type SkillProgressRow = {
  user_id: string;
  progress_percent: number;
};

type SessionRow = {
  user_id: string;
  duration_minutes: number;
  start_time: string;
};

type ReviewRow = {
  user_id: string;
  status: string;
  completed_at: string | null;
};

type TaskRow = {
  user_id: string;
  status: string;
  completed_at: string | null;
};

type ProjectRow = {
  user_id: string;
  track_id: string | null;
  status: string;
  progress_percent: number;
  updated_at: string;
};

type UserTrackProgressRow = {
  user_id: string;
  track_id: string;
  progress_percent: number;
};

type ComputedLeaderboardEntry = SkillThreeLeaderboardEntry & {
  badgeKey: string | null;
  globalScore: number;
  weeklyScore: number;
  trackScore: number;
};

export interface SkillThreeLeaderboardPayload {
  leaderboardByScope: Record<
    SkillThreeLeaderboardScope,
    SkillThreeLeaderboardBucket
  >;
  source: "live" | "fallback";
}

export async function loadSkillThreeLeaderboard(): Promise<SkillThreeLeaderboardPayload> {
  const sessionClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser();

  if (userError || !user) {
    throw new Error("Faça login para consultar o ranking do SkillThree.");
  }

  const currentProfile = await loadCurrentProfile(sessionClient, user.id);
  const currentEntry = await loadCurrentUserLeaderboardEntry(
    sessionClient,
    currentProfile,
    user.id,
  );

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.PRODUCT_SUPABASE_URL?.trim();
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.PRODUCT_SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      leaderboardByScope: buildFallbackBuckets(currentEntry),
      source: "fallback",
    };
  }

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: rawProfiles, error: profilesError } = await adminClient
    .from("profiles")
    .select("id, full_name, email, avatar_url, current_level, selected_track_id")
    .order("updated_at", { ascending: false })
    .limit(MAX_PROFILES);

  if (profilesError || !rawProfiles?.length) {
    return {
      leaderboardByScope: buildFallbackBuckets(currentEntry),
      source: "fallback",
    };
  }

  const profiles = ensureCurrentProfile(
    rawProfiles as LeaderboardProfileRow[],
    currentProfile,
  );
  const userIds = profiles.map((profile) => profile.id);
  const now = Date.now();
  const weeklyCutoff = new Date(now - 7 * DAY_MS).toISOString();
  const recentCutoff = new Date(now - 90 * DAY_MS).toISOString();

  const [
    { data: tracks },
    { data: skillProgress },
    { data: sessions },
    { data: reviews },
    { data: tasks },
    { data: projects },
    { data: trackProgress },
  ] = await Promise.all([
    adminClient.from("study_tracks").select("id, name"),
    adminClient
      .from("user_skill_progress")
      .select("user_id, progress_percent")
      .in("user_id", userIds),
    adminClient
      .from("study_sessions")
      .select("user_id, duration_minutes, start_time")
      .in("user_id", userIds)
      .gte("start_time", recentCutoff),
    adminClient
      .from("reviews")
      .select("user_id, status, completed_at")
      .in("user_id", userIds)
      .or(`completed_at.gte.${recentCutoff},status.eq.completed`),
    adminClient
      .from("tasks")
      .select("user_id, status, completed_at")
      .in("user_id", userIds)
      .or(`completed_at.gte.${recentCutoff},status.eq.completed`),
    adminClient
      .from("projects")
      .select("user_id, track_id, status, progress_percent, updated_at")
      .in("user_id", userIds),
    adminClient
      .from("user_track_progress")
      .select("user_id, track_id, progress_percent")
      .in("user_id", userIds),
  ]);

  const trackNameById = new Map<string, string>(
    ((tracks ?? []) as TrackRow[]).map((track) => [track.id, track.name]),
  );

  const computedEntries = profiles
    .map((profile) =>
      buildLeaderboardEntry({
        profile,
        currentUserId: user.id,
        trackNameById,
        skillProgress: filterByUser(skillProgress ?? [], profile.id),
        sessions: filterByUser(sessions ?? [], profile.id),
        reviews: filterByUser(reviews ?? [], profile.id),
        tasks: filterByUser(tasks ?? [], profile.id),
        projects: filterByUser(projects ?? [], profile.id),
        trackProgress: filterByUser(trackProgress ?? [], profile.id),
        weeklyCutoff,
      }),
    )
    .slice(0, MAX_PROFILES);

  const currentTrackId = currentProfile.selected_track_id;
  const globalEntries = [...computedEntries]
    .sort((left, right) => right.globalScore - left.globalScore || right.level - left.level)
    .slice(0, MAX_ENTRIES);
  const weeklyEntries = [...computedEntries]
    .sort((left, right) => right.weeklyScore - left.weeklyScore || right.level - left.level)
    .slice(0, MAX_ENTRIES);

  const trackEntries = currentTrackId
    ? computedEntries
        .filter((entry) => entry.badgeKey === currentTrackId)
        .sort((left, right) => right.trackScore - left.trackScore || right.level - left.level)
        .slice(0, MAX_ENTRIES)
    : [computedEntries.find((entry) => entry.isCurrentUser) ?? currentEntry];

  return {
    leaderboardByScope: {
      global: buildBucket(
        withPositionDelta(
          globalEntries.map((entry) => ({
            ...entry,
            weeklyXp: entry.globalScore,
          })),
        ),
      ),
      weekly: buildBucket(
        withPositionDelta(
          weeklyEntries.map((entry) => ({
            ...entry,
            weeklyXp: entry.weeklyScore,
          })),
          globalEntries.map((entry) => ({
            ...entry,
            weeklyXp: entry.globalScore,
          })),
        ),
      ),
      track: buildBucket(
        withPositionDelta(
          (trackEntries.length
            ? trackEntries
            : [computedEntries.find((entry) => entry.isCurrentUser) ?? currentEntry]
          ).map((entry) => ({
            ...entry,
            weeklyXp: entry.trackScore,
          })),
          globalEntries.map((entry) => ({
            ...entry,
            weeklyXp: entry.globalScore,
          })),
        ),
      ),
    },
    source: "live",
  };
}

async function loadCurrentProfile(
  sessionClient: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data } = await sessionClient
    .from("profiles")
    .select("id, full_name, email, avatar_url, current_level, selected_track_id")
    .eq("id", userId)
    .maybeSingle();

  const row = data as LeaderboardProfileRow | null;

  return (
    row ?? {
      id: userId,
      full_name: "",
      email: null,
      avatar_url: null,
      current_level: "beginner" as SkillLevel,
      selected_track_id: null,
    }
  );
}

async function loadCurrentUserLeaderboardEntry(
  sessionClient: Awaited<ReturnType<typeof createClient>>,
  currentProfile: LeaderboardProfileRow,
  currentUserId: string,
) {
  const now = Date.now();
  const weeklyCutoff = new Date(now - 7 * DAY_MS).toISOString();
  const recentCutoff = new Date(now - 90 * DAY_MS).toISOString();

  const [
    { data: tracks },
    { data: skillProgress },
    { data: sessions },
    { data: reviews },
    { data: tasks },
    { data: projects },
    { data: trackProgress },
  ] = await Promise.all([
    sessionClient.from("study_tracks").select("id, name"),
    sessionClient
      .from("user_skill_progress")
      .select("user_id, progress_percent")
      .eq("user_id", currentUserId),
    sessionClient
      .from("study_sessions")
      .select("user_id, duration_minutes, start_time")
      .eq("user_id", currentUserId)
      .gte("start_time", recentCutoff),
    sessionClient
      .from("reviews")
      .select("user_id, status, completed_at")
      .eq("user_id", currentUserId)
      .or(`completed_at.gte.${recentCutoff},status.eq.completed`),
    sessionClient
      .from("tasks")
      .select("user_id, status, completed_at")
      .eq("user_id", currentUserId)
      .or(`completed_at.gte.${recentCutoff},status.eq.completed`),
    sessionClient
      .from("projects")
      .select("user_id, track_id, status, progress_percent, updated_at")
      .eq("user_id", currentUserId),
    sessionClient
      .from("user_track_progress")
      .select("user_id, track_id, progress_percent")
      .eq("user_id", currentUserId),
  ]);

  const trackNameById = new Map<string, string>(
    ((tracks ?? []) as TrackRow[]).map((track) => [track.id, track.name]),
  );

  return buildLeaderboardEntry({
    profile: currentProfile,
    currentUserId,
    trackNameById,
    skillProgress: (skillProgress ?? []) as SkillProgressRow[],
    sessions: (sessions ?? []) as SessionRow[],
    reviews: (reviews ?? []) as ReviewRow[],
    tasks: (tasks ?? []) as TaskRow[],
    projects: (projects ?? []) as ProjectRow[],
    trackProgress: (trackProgress ?? []) as UserTrackProgressRow[],
    weeklyCutoff,
  });
}

function buildFallbackBuckets(
  currentEntry: ComputedLeaderboardEntry,
) {
  const fallbackEntry = {
    ...currentEntry,
    badge: currentEntry.badgeKey ? "TRILHA" : "VOCÊ",
  };

  const bucket = buildBucket([fallbackEntry]);

  return {
    global: bucket,
    weekly: bucket,
    track: bucket,
  };
}

function ensureCurrentProfile(
  profiles: LeaderboardProfileRow[],
  currentProfile: LeaderboardProfileRow,
) {
  if (profiles.some((profile) => profile.id === currentProfile.id)) {
    return profiles;
  }

  return [currentProfile, ...profiles].slice(0, MAX_PROFILES);
}

function buildLeaderboardEntry(args: {
  profile: LeaderboardProfileRow;
  currentUserId: string;
  trackNameById: Map<string, string>;
  skillProgress: SkillProgressRow[];
  sessions: SessionRow[];
  reviews: ReviewRow[];
  tasks: TaskRow[];
  projects: ProjectRow[];
  trackProgress: UserTrackProgressRow[];
  weeklyCutoff: string;
}) {
  const skillXp = args.skillProgress.reduce(
    (total, row) => total + Math.round(Number(row.progress_percent || 0) * 18),
    0,
  );
  const sessionCount = args.sessions.length;
  const sessionHours = args.sessions.reduce(
    (total, row) => total + Number(row.duration_minutes || 0) / 60,
    0,
  );
  const completedReviews = args.reviews.filter(
    (review) => review.status === "completed",
  ).length;
  const completedTasks = args.tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const projectXp = args.projects.reduce((total, project) => {
    const progress = Number(project.progress_percent || 0);
    const completionBonus = project.status === "completed" ? 140 : 0;
    return total + Math.round(progress * 1.3) + completionBonus;
  }, 0);
  const trackXp = args.trackProgress.reduce(
    (total, row) => total + Math.round(Number(row.progress_percent || 0) * 8),
    0,
  );

  const totalXp = Math.round(
    skillXp +
      sessionCount * 36 +
      sessionHours * 42 +
      completedReviews * 24 +
      completedTasks * 18 +
      projectXp +
      trackXp,
  );

  const weeklyXp = Math.round(
    args.sessions
      .filter((session) => session.start_time >= args.weeklyCutoff)
      .reduce(
        (total, session) =>
          total + 36 + Number(session.duration_minutes || 0) / 60 * 18,
        0,
      ) +
      args.reviews.filter(
        (review) =>
          review.status === "completed" &&
          review.completed_at &&
          review.completed_at >= args.weeklyCutoff,
      ).length *
        24 +
      args.tasks.filter(
        (task) =>
          task.status === "completed" &&
          task.completed_at &&
          task.completed_at >= args.weeklyCutoff,
      ).length *
        18 +
      args.projects.filter((project) => project.updated_at >= args.weeklyCutoff).reduce(
        (total, project) => total + Math.round(Number(project.progress_percent || 0) * 0.45),
        0,
      ),
  );

  const selectedTrackName = args.profile.selected_track_id
    ? args.trackNameById.get(args.profile.selected_track_id) ?? null
    : null;

  const trackScore = args.profile.selected_track_id
    ? Math.round(
        args.trackProgress
          .filter((row) => row.track_id === args.profile.selected_track_id)
          .reduce((total, row) => total + Number(row.progress_percent || 0) * 20, 0) +
          args.projects
            .filter((project) => project.track_id === args.profile.selected_track_id)
            .reduce((total, project) => total + Number(project.progress_percent || 0) * 1.1, 0),
      )
    : totalXp;

  return {
    id: args.profile.id,
    name: resolveProfileName(args.profile),
    avatarUrl: args.profile.avatar_url,
    badge: selectedTrackName
      ? selectedTrackName.toUpperCase().slice(0, 10)
      : "TRILHA",
    badgeKey: args.profile.selected_track_id,
    rankLabel: labelForSkillLevel(args.profile.current_level ?? "beginner"),
    level: resolveLevel(totalXp),
    weeklyXp: totalXp,
    positionDelta: 0,
    isCurrentUser: args.profile.id === args.currentUserId,
    globalScore: totalXp,
    weeklyScore: weeklyXp,
    trackScore,
  };
}

function withPositionDelta(
  entries: ComputedLeaderboardEntry[],
  reference: ComputedLeaderboardEntry[] = entries,
) {
  const referencePositions = new Map(
    reference.map((entry, index) => [entry.id, index + 1]),
  );

  return entries.map((entry, index) => ({
    ...entry,
    positionDelta: (referencePositions.get(entry.id) ?? index + 1) - (index + 1),
  }));
}

function buildBucket(
  entries: ComputedLeaderboardEntry[],
): SkillThreeLeaderboardBucket {
  return {
    topThree: entries.slice(0, 3),
    entries,
  };
}

function resolveProfileName(profile: LeaderboardProfileRow) {
  const fullName = profile.full_name?.trim();
  if (fullName) {
    return fullName;
  }

  if (profile.email?.trim()) {
    return profile.email.trim().split("@")[0]!;
  }

  return "Operador CodeTrail";
}

function resolveLevel(totalXp: number) {
  return calculateSkillThreeLevel(totalXp).level;
}

function filterByUser<T extends { user_id: string }>(rows: T[], userId: string) {
  return rows.filter((row) => row.user_id === userId);
}
