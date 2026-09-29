-- B2: initial schema + RLS for cycling-plan-coach
-- Tables per documents/multi-event-and-webui-plan.md's schema table, with
-- `athletes` reconciled against references/athlete-config.md's field table
-- (not the plan doc's original sketch), plus the FR3 status vocabulary and
-- FR5 coach_notes table per documents/multi-event-and-webui-tasks.md B2.
--
-- Naming: local athlete.json stays camelCase (unrelated file format); DB
-- columns use snake_case per Postgres convention. B3's skill/frontend writes
-- translate between the two.

create extension if not exists pgcrypto;

create type session_status as enum (
  'completed_as_planned',
  'completed_easier_than_planned',
  'completed_harder_than_planned',
  'failed_too_hard',
  'skipped'
);

create type workout_schedule_status as enum ('planned', 'completed', 'skipped');

create type season_phase as enum ('base', 'build', 'refine');

-- athletes -------------------------------------------------------------
-- Mirrors athlete.json's ~30 fields (references/athlete-config.md).
-- `daysToEvent` is intentionally omitted: the config doc states it's derived
-- live at each planning run, never stored.
create table athletes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name text not null,
  language text not null default 'en',
  units text not null check (units in ('metric', 'imperial')),
  style_notes text not null default '',
  goal text not null default '',

  target_event text,
  event_date date,

  cycling_years_experience numeric not null default 0,
  longest_effort_completed text not null default '',
  ultra_distance_experience text not null default 'none'
    check (ultra_distance_experience in ('finished', 'attemptedDnf', 'none')),
  current_training_status text not null default 'new'
    check (current_training_status in ('consistent', 'returningFromBreak', 'new')),
  training_break_duration text,

  physical_notes text not null default '',
  physical_notes_frequency text
    check (physical_notes_frequency in ('everyRide', 'hardEffortsOrClimbs', 'occasionally')),
  physical_notes_assessed text
    check (physical_notes_assessed in ('yes', 'no', 'planned')),

  strength_experience text not null default 'new'
    check (strength_experience in ('new', 'returning', 'experienced')),
  strength_years_experience numeric,
  strength_recent_frequency text not null default 'none'
    check (strength_recent_frequency in ('none', 'onceWeekly', 'twiceWeekly', 'threePlusWeekly')),
  strength_current_lifts text not null default '',
  strength_injury_notes text not null default '',

  dietary_restrictions text[] not null default '{}',
  fueling_notes text not null default '',
  fueling_preference text not null default 'noPreference'
    check (fueling_preference in ('gels', 'realFood', 'mixed', 'noPreference')),
  current_eating_pattern_notes text not null default '',
  current_weight_goal_direction text not null default 'notFocused'
    check (current_weight_goal_direction in ('losing', 'gaining', 'maintaining', 'notFocused')),
  body_composition_goal text not null default 'notFocused'
    check (body_composition_goal in ('significantLoss', 'modestAdjustment', 'maintain', 'notFocused')),
  body_fat_percent numeric,

  age integer not null,
  gender text not null check (gender in ('male', 'female', 'other')),
  weight_kg numeric not null,
  resting_hr integer,
  lab_testing_notes text not null default '',

  fallback_ftp integer not null,
  target_wkg numeric not null,

  group_ride_days text[] not null default '{}',
  typical_available_days text[] not null default '{}',
  typical_workout_duration_min numeric not null default 60,
  max_structured_sessions integer not null default 2,
  strength_default text not null default 'core'
    check (strength_default in ('strength+core', 'core', 'none')),
  rider_type_override text check (rider_type_override in ('sprinter', 'allrounder', 'diesel')),
  workout_format text not null default 'zwo' check (workout_format in ('zwo'))
);

-- events -----------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  athlete_id uuid not null references athletes (id) on delete cascade,
  event_key text,
  event_name text,
  event_date date not null,
  notes text not null default ''
);

-- plans --------------------------------------------------------------------
-- One row per generated week. `phase`/`deload` carry the current
-- season-macrocycle state (A9-A13's season-plan.json), wired in B6.
create table plans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  athlete_id uuid not null references athletes (id) on delete cascade,
  week_start_date date not null,
  phase season_phase,
  deload boolean not null default false,
  focus text not null default '',
  ftp_used integer,
  rider_type text,
  rendered_markdown text not null default '',
  unique (athlete_id, week_start_date)
);

-- workouts -------------------------------------------------------------
create table workouts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  plan_id uuid not null references plans (id) on delete cascade,
  athlete_id uuid not null references athletes (id) on delete cascade,
  day text not null check (day in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
  archetype text not null,
  target jsonb not null default '{}'::jsonb,
  zwo_content text,
  status workout_schedule_status not null default 'planned',
  actual jsonb
);

-- workout_logs -------------------------------------------------------------
-- FR3 five-way status vocabulary (per the tasks file's "Decisions locked in").
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  workout_id uuid not null references workouts (id) on delete cascade,
  athlete_id uuid not null references athletes (id) on delete cascade,
  status session_status not null,
  rpe numeric,
  notes text not null default '',
  actual_tss numeric,
  actual_duration_min numeric,
  source text not null default 'web-ui'
);

-- nutrition_logs -------------------------------------------------------
-- Own simpler flag (hit/missed carb target) + a hydration note, per the
-- tasks file's "Decisions locked in" (does not reuse the five-way vocabulary).
create table nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  athlete_id uuid not null references athletes (id) on delete cascade,
  log_date date not null,
  carbs_g numeric,
  calories numeric,
  carb_target_status text check (carb_target_status in ('hit', 'missed')),
  hydration_note text not null default '',
  body_weight_kg numeric,
  notes text not null default '',
  unique (athlete_id, log_date)
);

-- strength_logs --------------------------------------------------------
create table strength_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  athlete_id uuid not null references athletes (id) on delete cascade,
  workout_id uuid references workouts (id) on delete set null,
  session_name text not null,
  status session_status not null,
  sets_reps_load jsonb not null default '{}'::jsonb,
  notes text not null default ''
);

-- coach_notes (FR5) ------------------------------------------------------
-- Surfaced interpretation text, keyed to the triggering log row, visible in
-- the web UI without waiting for the next chat. Wired in B8.
create table coach_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  athlete_id uuid not null references athletes (id) on delete cascade,
  workout_log_id uuid references workout_logs (id) on delete cascade,
  strength_log_id uuid references strength_logs (id) on delete cascade,
  note text not null,
  constraint coach_notes_one_trigger check (
    (workout_log_id is not null and strength_log_id is null)
    or (workout_log_id is null and strength_log_id is not null)
  )
);

-- Row-level security -------------------------------------------------------
-- Scoped by athlete_id (kept even in single-athlete v1, per the plan's
-- future-proofing rationale). Policies key off auth.uid() = athlete_id,
-- the standard Supabase per-user pattern: an authenticated request only
-- sees/writes its own athlete's rows, and the anon role (no session) has
-- no matching policy so it is denied by default. The skill's own
-- server-side writes use the service-role key, which bypasses RLS
-- entirely, per docs/infra.md.
--
-- NOTE: no Supabase Auth user/login flow exists yet (deferred to the
-- frontend work in B3) so today there is no session that can satisfy
-- auth.uid() = athlete_id. That's expected for a schema-only migration:
-- until B3 wires real login, only the service-role key (bypassing RLS) can
-- read/write these tables, which is the correct state for infra with no
-- frontend yet.

alter table athletes enable row level security;
alter table events enable row level security;
alter table plans enable row level security;
alter table workouts enable row level security;
alter table workout_logs enable row level security;
alter table nutrition_logs enable row level security;
alter table strength_logs enable row level security;
alter table coach_notes enable row level security;

create policy "athletes_self" on athletes
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "events_self" on events
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "plans_self" on plans
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "workouts_self" on workouts
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "workout_logs_self" on workout_logs
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "nutrition_logs_self" on nutrition_logs
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "strength_logs_self" on strength_logs
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "coach_notes_self" on coach_notes
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);
