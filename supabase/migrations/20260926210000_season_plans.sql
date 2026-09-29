-- B9: season macrocycle persistence in the DB.
-- Mirrors the file-based season-plan.json schema (references/macrocycle-model.md,
-- A9) once it had shipped and been wired through B6/B8. One row per athlete's
-- *current* skeleton (a replan updates this row in place; it does not version
-- history), matching the same single-current-skeleton assumption `events`
-- already makes. `phases`/`trial_events` stay JSON columns rather than
-- normalized child tables -- both are small, fixed-shape arrays (`phases`
-- always exactly 5 entries; `trial_events` typically 4) that are always read
-- and written as a whole document, never queried by sub-field, so normalizing
-- them would add join overhead with no query benefit.
--
-- Field naming inside the JSON columns follows this repo's existing
-- precedent (strength_logs.sets_reps_load's `load_kg`): snake_case, not the
-- camelCase season-plan.json uses, since these are DB columns' contents, not
-- the local file itself. The skill's Step 7 sync translates on write, same
-- as every other camelCase-to-snake_case field mapping it already does.

create table season_plans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  athlete_id uuid not null references athletes (id) on delete cascade,

  target_event text not null,
  event_date date not null,
  start_date date not null,
  age_band_at_generation text not null
    check (age_band_at_generation in ('under40', 'masters40to49', 'senior50plus')),
  deload_weeks integer not null,
  generated_at timestamptz not null,
  last_replanned_at timestamptz,

  -- Recomputed from phases/today at every read per macrocycle-model.md's
  -- "never trust a stale stored value" rule; stored anyway (as the file
  -- format does) so a row is self-describing without a client-side
  -- recompute, and overwritten on every upsert regardless of whether a
  -- replan actually moved any boundary.
  current_phase_id text not null
    check (current_phase_id in ('base', 'deload-1', 'build', 'deload-2', 'refine')),

  -- One object per references/macrocycle-model.md's `phases[]` schema:
  -- {id, label, start_date, end_date, deload, focus}. Always exactly 5,
  -- in the fixed Base/Deload/Build/Deload/Refine order.
  phases jsonb not null
    check (jsonb_typeof(phases) = 'array' and jsonb_array_length(phases) = 5),

  -- Array per references/trial-events.md's ladder: objects shaped
  -- {id, category, target_date, phase_id, spec, status, outcome}. Empty
  -- array only for the degenerate case trial-events.md §1 describes
  -- (a target event with no discrete limiters still gets at least the
  -- single culminating rehearsal, so empty is not expected in practice,
  -- but not constrained to non-empty here since that's a content rule,
  -- not a storage invariant).
  trial_events jsonb not null default '[]'::jsonb
    check (jsonb_typeof(trial_events) = 'array'),

  unique (athlete_id)
);

alter table season_plans enable row level security;

create policy "season_plans_self" on season_plans
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);
