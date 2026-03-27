export type SkillLevel = "beginner" | "junior" | "mid_level" | "senior";
export type SessionType =
  | "theory"
  | "practice"
  | "review"
  | "project"
  | "exercises";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type ReviewStatus = "pending" | "completed" | "overdue";
export type ProjectStatus = "planned" | "active" | "blocked" | "completed";
export type FocusType =
  | "job"
  | "promotion"
  | "freelance"
  | "solid_foundation"
  | "career_transition";
export type ThemePreference = "system" | "dark" | "light";
export type BillingPlanCode = "free" | "pro" | "founding";
export type BillingCheckoutUiMode = "hosted" | "embedded";
export type BillingSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "expired"
  | "incomplete";
export type MindMapNodeShape =
  | "rectangle"
  | "rounded"
  | "ellipse"
  | "diamond";

export type WorkspaceSectionKey =
  | "dashboard"
  | "tracks"
  | "sessions"
  | "tasks"
  | "reviews"
  | "projects"
  | "notes"
  | "flashcards"
  | "mind-maps"
  | "analytics"
  | "settings"
  | "settings-billing";

export interface WorkspaceUser {
  id: string;
  email: string;
  fullName: string;
}

export interface ProfileRow {
  id: string;
  full_name: string;
  email: string | null;
  desired_area: string;
  current_level: SkillLevel;
  onboarding_completed: boolean;
  selected_track_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserGoalRow {
  id: string;
  user_id: string;
  primary_goal: string;
  desired_area: string;
  focus_type: FocusType;
  hours_per_day: number;
  days_per_week: number;
  deadline: string;
  current_level: SkillLevel;
  generated_plan: string;
  created_at: string;
  updated_at: string;
}

export interface StudyTrackRow {
  id: string;
  name: string;
  description: string;
  icon_key: string;
  color_hex: string;
  roadmap_summary: string;
  created_at: string;
  updated_at: string;
}

export interface StudySkillRow {
  id: string;
  track_id: string;
  name: string;
  description: string;
  target_level: SkillLevel;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSkillProgressRow {
  id: string;
  user_id: string;
  skill_id: string;
  progress_percent: number;
  last_studied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudyModuleRow {
  id: string;
  track_id: string;
  title: string;
  summary: string;
  estimated_hours: number;
  sort_order: number;
  is_core: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudySessionRow {
  id: string;
  user_id: string;
  track_id: string | null;
  skill_id: string | null;
  module_id: string | null;
  type: SessionType;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  notes: string;
  productivity_score: number;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  user_id: string;
  track_id: string | null;
  module_id: string | null;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  user_id: string;
  session_id: string | null;
  track_id: string | null;
  skill_id: string | null;
  title: string;
  scheduled_for: string;
  status: ReviewStatus;
  interval_label: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  user_id: string;
  track_id: string | null;
  title: string;
  scope: string;
  description: string;
  repository_url: string | null;
  documentation_url: string | null;
  video_url: string | null;
  status: ProjectStatus;
  progress_percent: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectStepRow {
  id: string;
  project_id: string;
  title: string;
  description: string;
  is_done: boolean;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudyNoteRow {
  id: string;
  user_id: string;
  folder_name: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface FlashcardRow {
  id: string;
  user_id: string;
  deck_name: string;
  question: string;
  answer: string;
  track_id: string | null;
  module_id: string | null;
  project_id: string | null;
  due_at: string;
  last_reviewed_at: string | null;
  review_count: number;
  correct_streak: number;
  ease_factor: number;
  interval_days: number;
  created_at: string;
  updated_at: string;
}

export interface MindMapRow {
  id: string;
  user_id: string;
  folder_name: string;
  title: string;
  content_json: string;
  track_id: string | null;
  module_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettingsRow {
  id: string;
  user_id: string;
  theme_preference: ThemePreference;
  notifications_enabled: boolean;
  daily_reminder_hour: number | null;
  created_at: string;
  updated_at: string;
}

export interface BillingFeatureEntitlement {
  feature_key: string;
  enabled: boolean;
  limit_value: number | null;
}

export interface BillingPlan {
  id: string;
  code: BillingPlanCode;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  interval: string;
  is_active: boolean;
  is_public: boolean;
  trial_days: number;
  metadata: Record<string, unknown> | null;
  features?: BillingFeatureEntitlement[];
}

export interface BillingCustomer {
  id: string;
  gateway_provider: string;
  gateway_customer_id: string | null;
  billing_email: string;
  full_name: string;
  tax_document: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BillingSubscription {
  id: string;
  plan_id: string;
  customer_id: string | null;
  gateway_provider: string;
  gateway_subscription_id: string | null;
  external_reference: string | null;
  status: BillingSubscriptionStatus;
  status_detail: string | null;
  billing_cycle: string;
  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_ends_at: string | null;
  grace_until: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  is_premium: boolean;
  is_trialing: boolean;
  is_in_grace_period: boolean;
  has_lost_access: boolean;
}

export interface BillingPayment {
  id: string;
  subscription_id: string | null;
  gateway_provider: string;
  gateway_payment_id: string | null;
  external_reference: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  status_detail: string | null;
  paid_at: string | null;
  invoice_url: string | null;
  receipt_url: string | null;
  metadata: Record<string, unknown> | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BillingConfig {
  billing_provider: string;
  trial_enabled: boolean;
  trial_days_default: number;
  founding_plan_enabled: boolean;
}

export interface BillingSnapshot {
  customer: BillingCustomer | null;
  subscription: BillingSubscription | null;
  current_plan: BillingPlan | null;
  available_plans: BillingPlan[];
  features: BillingFeatureEntitlement[];
  payments: BillingPayment[];
  founding_eligible: boolean;
  config: BillingConfig;
}

export interface BillingCheckoutSession {
  uiMode: BillingCheckoutUiMode;
  checkoutUrl: string | null;
  clientSecret: string | null;
  managementUrl: string | null;
  subscriptionId: string | null;
  snapshot: BillingSnapshot;
}

export interface NoteContextLink {
  trackId: string | null;
  trackLabel: string | null;
  moduleId: string | null;
  moduleLabel: string | null;
  projectId: string | null;
  projectLabel: string | null;
}

export interface NoteContentDocument {
  body: string;
  context: NoteContextLink;
  searchableText: string;
  labels: string[];
}

export interface MindMapNodeData {
  id: string;
  label: string;
  shape: MindMapNodeShape;
  colorHex: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MindMapConnectionData {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface MindMapDocument {
  nodes: MindMapNodeData[];
  connections: MindMapConnectionData[];
}

export interface ChartDatum {
  label: string;
  value: number;
}

export interface TrackBlueprint {
  track: StudyTrackRow;
  skills: StudySkillRow[];
  modules: StudyModuleRow[];
  progressBySkill: Record<string, UserSkillProgressRow>;
  progressPercent: number;
}

export interface ProjectBundle {
  project: ProjectRow;
  steps: ProjectStepRow[];
}

export interface DashboardSummary {
  hoursThisWeek: number;
  streakDays: number;
  pendingTasks: number;
  overdueReviews: number;
  activeProjects: number;
  trackProgress: number;
  nextSession: StudySessionRow | null;
  totalSessions: number;
}

export interface AnalyticsSummary {
  hoursPerDay: ChartDatum[];
  hoursPerWeek: ChartDatum[];
  byType: Record<SessionType, number>;
  skillStudyMap: Record<string, number>;
  completedTaskRate: number;
  completedReviews: number;
  completedProjects: number;
  consistencyDays: number;
  currentWeekHours: number;
  previousWeekHours: number;
  averageSessionMinutes: number;
  averageProductivityScore: number;
  focusBalancePercent: number;
  dominantStudyType: SessionType | null;
}

export interface WorkspaceFeatureAccess {
  notes: boolean;
  flashcards: boolean;
  mindMaps: boolean;
  analytics: boolean;
  aiGeneration: boolean;
  limits: {
    notes: number | null;
    projects: number | null;
    flashcards: number | null;
    mindMaps: number | null;
  };
}

export interface WorkspaceData {
  profile: ProfileRow | null;
  goal: UserGoalRow | null;
  tracks: StudyTrackRow[];
  skills: StudySkillRow[];
  progress: UserSkillProgressRow[];
  modules: StudyModuleRow[];
  sessions: StudySessionRow[];
  tasks: TaskRow[];
  reviews: ReviewRow[];
  projects: ProjectRow[];
  projectSteps: ProjectStepRow[];
  notes: StudyNoteRow[];
  flashcards: FlashcardRow[];
  mindMaps: MindMapRow[];
  settings: AppSettingsRow | null;
  billing: BillingSnapshot;
  trackBlueprints: TrackBlueprint[];
  projectBundles: ProjectBundle[];
  dashboardSummary: DashboardSummary;
  analyticsSummary: AnalyticsSummary;
  featureAccess: WorkspaceFeatureAccess;
}

export interface WorkspaceLoadResult extends WorkspaceData {
  errors: string[];
}

export interface WorkspaceOperationState {
  key: string;
  title: string;
  message: string;
}

export interface WorkspaceContextValue {
  user: WorkspaceUser;
  data: WorkspaceData | null;
  loading: boolean;
  refreshing: boolean;
  operation: WorkspaceOperationState | null;
  error: string | null;
  onboardingOpen: boolean;
  onboardingCompleted: boolean;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
  reload: () => Promise<void>;
  saveProfile: (payload: Partial<ProfileRow>) => Promise<void>;
  saveGoal: (payload: Partial<UserGoalRow>) => Promise<void>;
  saveSettings: (payload: Partial<AppSettingsRow>) => Promise<void>;
  saveSession: (payload: Partial<StudySessionRow>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  saveTask: (payload: Partial<TaskRow>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  saveReview: (payload: Partial<ReviewRow>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  saveProject: (payload: Partial<ProjectRow>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  saveProjectStep: (payload: Partial<ProjectStepRow>) => Promise<void>;
  deleteProjectStep: (id: string) => Promise<void>;
  saveNote: (payload: Partial<StudyNoteRow>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  saveFlashcard: (payload: Partial<FlashcardRow>) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
  saveMindMap: (payload: Partial<MindMapRow>) => Promise<void>;
  deleteMindMap: (id: string) => Promise<void>;
  reviewFlashcard: (
    flashcard: FlashcardRow,
    grade: "again" | "hard" | "good" | "easy",
  ) => Promise<void>;
  refreshBilling: () => Promise<void>;
  createCheckout: (planCode: BillingPlanCode) => Promise<void>;
  openPortal: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  syncBilling: () => Promise<void>;
  signOut: () => Promise<void>;
}
