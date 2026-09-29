-- WC1 (documents/whoop-integration-tasks.md): whoop_daily_metrics schema +
-- RLS. One row per WHOOP cycle-day, upserted by web/app/api/whoop/sync
-- (WC2) using the service-role client -- same posture as
-- integration_connections (WA2): the browser's anon-key client can select
-- its own rows but never write one directly.
--
-- Field roles (see references/whoop-data.md, WC4, for the full mapping):
-- recovery_score plays training_readiness_score's role, hrv_rmssd_milli
-- (compared against our own rolling 7-day average, computed at read time
-- from this table's history) plays hrv_status's role,
-- sleep_performance_percentage plays sleep_score's role, day_strain is a
-- new WHOOP-only signal with no Garmin equivalent.

create table whoop_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  athlete_id uuid not null references athletes (id) on delete cascade,

  cycle_date date not null,
  recovery_score numeric,
  hrv_rmssd_milli numeric,
  resting_heart_rate numeric,
  sleep_performance_percentage numeric,
  day_strain numeric,
  pulled_at timestamptz not null default now(),

  unique (athlete_id, cycle_date)
);

alter table whoop_daily_metrics enable row level security;

create policy "whoop_daily_metrics_self_select" on whoop_daily_metrics
  for select using (auth.uid() = athlete_id);
