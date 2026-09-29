// Mirrors supabase/migrations/20260926171317_initial_schema.sql.

export const SESSION_STATUSES = [
  "completed_as_planned",
  "completed_easier_than_planned",
  "completed_harder_than_planned",
  "failed_too_hard",
  "skipped",
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  completed_as_planned: "Completed as planned",
  completed_easier_than_planned: "Completed - felt easier than planned",
  completed_harder_than_planned: "Completed - felt harder than planned",
  failed_too_hard: "Failed - too hard, couldn't complete",
  skipped: "Skipped",
};

// B7 compliance/trend view: each FR3 status reads as one of a fixed set of
// four severity roles (good/warning/serious/critical), never a plain
// identity color, since the status inherently means "did this go well" -
// per dataviz's status-color rule. `completed_easier_than_planned` and
// `completed_as_planned` share "good" (both on-track outcomes); `skipped`
// is "serious" (a training gap) rather than "critical", which is reserved
// for an attempted-and-overreached session.
export type StatusRole = "good" | "warning" | "serious" | "critical";

export const STATUS_ROLE: Record<SessionStatus, StatusRole> = {
  completed_as_planned: "good",
  completed_easier_than_planned: "good",
  completed_harder_than_planned: "warning",
  skipped: "serious",
  failed_too_hard: "critical",
};

// Fixed status scale (light-surface steps), per the dataviz skill's palette
// reference -- never themed, always paired with the icon/label below. Values
// match the --good/--warning/--serious/--critical tokens in globals.css.
export const STATUS_ROLE_COLOR: Record<StatusRole, string> = {
  good: "#1F8A57",
  warning: "#B9790A",
  serious: "#C2542E",
  critical: "#C22B2B",
};

export const STATUS_ROLE_LABELS: Record<StatusRole, string> = {
  good: "On track (as planned / easier)",
  warning: "Harder than planned",
  serious: "Skipped",
  critical: "Failed - too hard",
};

// Segment order is fixed (never reshuffled), a mild-to-severe reading order.
export const STATUS_ROLE_ORDER: StatusRole[] = [
  "good",
  "warning",
  "serious",
  "critical",
];

export const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type Day = (typeof DAY_ORDER)[number];

export interface Plan {
  id: string;
  athlete_id: string;
  week_start_date: string;
  phase: "base" | "build" | "refine" | null;
  deload: boolean;
  focus: string;
  ftp_used: number | null;
  rider_type: string | null;
  rendered_markdown: string;
}

export interface Event {
  id: string;
  athlete_id: string;
  event_key: string | null;
  event_name: string | null;
  event_date: string;
  notes: string;
}

// A structured bike session's `target` is freeform JSON (the skill decides
// its keys per archetype, no fixed schema -- see SKILL.md Step 7 item 5), so
// it's read generically as key/value pairs. A strength/core session's
// `target` DOES follow a fixed shape (below) -- that contract is new here,
// on both the write side (SKILL.md) and this read side.
export interface PrescribedExercise {
  exercise: string;
  sets_reps: string; // e.g. "4 x 5" or "3 x 8 / leg", not split into numeric fields -- this is the plan, not a log
  load_cue: string;
  rest: string;
}

export interface StrengthWorkoutTarget {
  type: "strength";
  exercises: PrescribedExercise[];
  session_file?: string | null;
}

export type WorkoutTarget = StrengthWorkoutTarget | Record<string, unknown>;

export function isStrengthTarget(
  target: WorkoutTarget | null | undefined
): target is StrengthWorkoutTarget {
  return (
    !!target &&
    typeof target === "object" &&
    (target as StrengthWorkoutTarget).type === "strength" &&
    Array.isArray((target as StrengthWorkoutTarget).exercises)
  );
}

export interface Workout {
  id: string;
  plan_id: string;
  athlete_id: string;
  day: Day;
  archetype: string;
  target: WorkoutTarget;
  zwo_content: string | null;
  status: "planned" | "completed" | "skipped";
}

export interface WorkoutLog {
  id: string;
  workout_id: string;
  athlete_id: string;
  status: SessionStatus;
  rpe: number | null;
  notes: string;
  created_at: string;
}

export const CARB_TARGET_STATUSES = ["hit", "missed"] as const;

export type CarbTargetStatus = (typeof CARB_TARGET_STATUSES)[number];

export const CARB_TARGET_STATUS_LABELS: Record<CarbTargetStatus, string> = {
  hit: "Hit carb target",
  missed: "Missed carb target",
};

export interface NutritionLog {
  id: string;
  athlete_id: string;
  log_date: string;
  carbs_g: number | null;
  calories: number | null;
  carb_target_status: CarbTargetStatus | null;
  hydration_note: string;
  body_weight_kg: number | null;
  notes: string;
  created_at: string;
}

export interface ExerciseEntry {
  exercise: string;
  sets: number | null;
  reps: number | null;
  load_kg: number | null;
}

export interface StrengthLog {
  id: string;
  athlete_id: string;
  workout_id: string | null;
  session_name: string;
  status: SessionStatus;
  sets_reps_load: { exercises: ExerciseEntry[] };
  notes: string;
  created_at: string;
}

export interface CoachNote {
  id: string;
  athlete_id: string;
  workout_log_id: string | null;
  strength_log_id: string | null;
  meal_feedback_id: string | null;
  note: string;
  created_at: string;
}

// Issue #45: per-meal/snack feedback on the week's itemized meal plan
// (issue #46's `YYYY-Wnn-meals.md`), mirroring
// supabase/migrations/20260928090000_meal_recommendations_feedback.sql.
// `meal_recommendations` is written only by the skill (Step 7, alongside
// `workouts`); `meal_feedback` allows multiple rows per item, same
// multiplicity as `workout_logs` -- the latest one is what's shown/read back.

export interface MealRecommendation {
  id: string;
  plan_id: string;
  athlete_id: string;
  day: Day;
  slot: string;
  description: string;
  created_at: string;
}

export interface MealFeedback {
  id: string;
  athlete_id: string;
  meal_recommendation_id: string;
  rating: number | null;
  wants_changed: boolean;
  comment: string;
  source: "web-ui" | "chat";
  created_at: string;
}

export const MEAL_RATING_VALUES = [1, 2, 3, 4, 5] as const;

// B9: season macrocycle persistence, mirroring
// supabase/migrations/20260926210000_season_plans.sql and the file-based
// season-plan.json shape in references/macrocycle-model.md (A9) /
// references/trial-events.md (A10).

export const SEASON_PHASE_IDS = [
  "base",
  "deload-1",
  "build",
  "deload-2",
  "refine",
] as const;

export type SeasonSkeletonPhaseId = (typeof SEASON_PHASE_IDS)[number];

export const SEASON_PHASE_LABELS: Record<SeasonSkeletonPhaseId, string> = {
  base: "Base",
  "deload-1": "Deload",
  build: "Build",
  "deload-2": "Deload",
  refine: "Refine",
};

export interface SeasonPlanPhase {
  id: SeasonSkeletonPhaseId;
  label: string;
  start_date: string;
  end_date: string;
  deload: boolean;
  focus: string;
}

export type TrialEventCategory = "B" | "C";
export type TrialEventStatus = "planned" | "logged";

export interface TrialEventSpec {
  distance_km: number | [number, number] | null;
  elevation_m: number | [number, number] | null;
  limiters_rehearsed: string[];
  terrain_fidelity: "low" | "high";
  overnight: boolean;
  loaded_bike: boolean;
  fueling_target_gh: number | null;
  opportunistic_resupply: boolean;
}

export type TrialEventCompletionStatus =
  | "completed_comfortably"
  | "completed_as_planned"
  | "completed_with_difficulty"
  | "dnf_stopped_early"
  | "skipped";

export type TrialEventFuelingSignal =
  | "on_target"
  | "gi_distress"
  | "bonked_underfueled"
  | "not_applicable";

export interface TrialEventOutcome {
  completion_status: TrialEventCompletionStatus;
  fueling_signal: TrialEventFuelingSignal;
  notes: string;
}

export const TRIAL_EVENT_COMPLETION_STATUS_LABELS: Record<
  TrialEventCompletionStatus,
  string
> = {
  completed_comfortably: "Completed comfortably",
  completed_as_planned: "Completed as planned",
  completed_with_difficulty: "Completed with difficulty",
  dnf_stopped_early: "DNF - stopped early",
  skipped: "Skipped",
};

export const TRIAL_EVENT_FUELING_SIGNAL_LABELS: Record<
  TrialEventFuelingSignal,
  string
> = {
  on_target: "Fueling on target",
  gi_distress: "GI distress",
  bonked_underfueled: "Bonked / underfueled",
  not_applicable: "No fueling component",
};

export interface TrialEvent {
  id: string;
  category: TrialEventCategory;
  target_date: string;
  phase_id: SeasonSkeletonPhaseId;
  spec: TrialEventSpec;
  status: TrialEventStatus;
  outcome: TrialEventOutcome | null;
}

// WB2: mirrors supabase/migrations/20260927120000_integration_connections.sql.
// Only ever selected client-side (RLS grants select only, per WA2) -- token
// fields don't exist on this table at all, only Vault secret ids, so there
// is nothing sensitive in a row the browser can read.
export type IntegrationProvider = "whoop";

export interface IntegrationConnection {
  id: string;
  athlete_id: string;
  provider: IntegrationProvider;
  whoop_user_id: string | null;
  expires_at: string;
  connected_at: string;
  revoked_at: string | null;
}

// WC1: mirrors supabase/migrations/20260927120100_whoop_daily_metrics.sql.
export interface WhoopDailyMetric {
  id: string;
  athlete_id: string;
  cycle_date: string;
  recovery_score: number | null;
  hrv_rmssd_milli: number | null;
  resting_heart_rate: number | null;
  sleep_performance_percentage: number | null;
  day_strain: number | null;
  pulled_at: string;
}

export type AgeBand = "under40" | "masters40to49" | "senior50plus";

export interface SeasonPlan {
  id: string;
  athlete_id: string;
  target_event: string;
  event_date: string;
  start_date: string;
  age_band_at_generation: AgeBand;
  deload_weeks: number;
  generated_at: string;
  last_replanned_at: string | null;
  current_phase_id: SeasonSkeletonPhaseId;
  phases: SeasonPlanPhase[];
  trial_events: TrialEvent[];
}
