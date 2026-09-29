-- Issue #45: per-meal/snack feedback on the week's itemized meal plan
-- (issue #46's `YYYY-Wnn-meals.md`). Mirrors the `workouts`/`workout_logs`
-- shape: the skill is the sole writer of `meal_recommendations` (deleted and
-- re-inserted per plan, same as `workouts` in SKILL.md Step 7 item 5); the
-- web UI and the `/nutrition-feedback` Claude Code command are the only
-- writers of `meal_feedback` (multiple rows per item allowed, same
-- multiplicity as `workout_logs` -- the latest one read back wins, per
-- SKILL.md Step 1's B8 pattern -- rather than a single-row upsert like
-- `nutrition_logs`, since a web-ui rating and a later `/nutrition-feedback`
-- narrative comment on the same item are both worth keeping).

create table meal_recommendations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  plan_id uuid not null references plans (id) on delete cascade,
  athlete_id uuid not null references athletes (id) on delete cascade,
  day text not null check (day in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
  slot text not null,
  description text not null
);

-- meal_feedback ------------------------------------------------------------
-- `rating` is optional: a `/nutrition-feedback` chat entry may carry only a
-- narrative `comment` with no numeric rating, while a web-ui entry always
-- sets one (per the rating control) and may also add a comment.
create table meal_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  athlete_id uuid not null references athletes (id) on delete cascade,
  meal_recommendation_id uuid not null references meal_recommendations (id) on delete cascade,
  rating integer check (rating between 1 and 5),
  wants_changed boolean not null default false,
  comment text not null default '',
  source text not null check (source in ('web-ui', 'chat'))
);

-- coach_notes gains a third possible trigger (FR5-style visibility for an
-- interpreted meal_feedback row, mirroring workout_log_id/strength_log_id).
alter table coach_notes add column meal_feedback_id uuid references meal_feedback (id) on delete cascade;

alter table coach_notes drop constraint coach_notes_one_trigger;
alter table coach_notes add constraint coach_notes_one_trigger check (
  (workout_log_id is not null)::int
  + (strength_log_id is not null)::int
  + (meal_feedback_id is not null)::int
  = 1
);

-- Row-level security ---------------------------------------------------
alter table meal_recommendations enable row level security;
alter table meal_feedback enable row level security;

create policy "meal_recommendations_self" on meal_recommendations
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "meal_feedback_self" on meal_feedback
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);
