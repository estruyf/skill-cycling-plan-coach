# WHOOP integration — reading and using the data

Athletes who wear a WHOOP can connect their account from the web dashboard
(`/connections`) to have their daily recovery/sleep/strain and per-workout
strain/HR feed the same readiness decision logic Garmin already drives.
Unlike Garmin (`garmin-data.md`), there is no manual export step: once
connected, the web app and this skill both pull fresh data automatically on
an athlete-triggered action (opening `/plan`, or a "plan my week" run) — see
`documents/whoop-integration-plan.md` for the full architecture and
`documents/whoop-integration-tasks.md` for the task breakdown this doc is
part of (`WC4`).

## How the connection works

1. The athlete visits `/connections` in the web dashboard and clicks
   "Connect WHOOP" — this is the only manual step, done once.
2. From then on, `whoop_daily_metrics` and WHOOP-sourced `workout_logs` rows
   are populated automatically: the `/plan` page triggers a sync on load,
   and this skill's Step 1 triggers a sync (via the `/api/whoop/sync`
   endpoint) whenever `supabaseAthleteId` is set and an active connection
   exists, before reading the results back via `execute_sql` — the same
   MCP path already used for `nutrition_logs`/`workout_logs`.
3. This skill never talks to the WHOOP API or holds a WHOOP token directly
   — it only triggers a sync on the deployed web app and reads the results
   back from Supabase. If no connection exists, none of this section
   applies and behavior is byte-for-byte the same as today.

## Field mapping — WHOOP plays Garmin's readiness roles

WHOOP's `recovery_score` and `sleep_performance_percentage` are WHOOP's own
0–100 scores, the same shape as Garmin's `training_readiness_score`/
`sleep_score`, so the same threshold bands apply directly:

| WHOOP field | Plays the role of | Band (mirrors Garmin) |
|---|---|---|
| `recovery_score` | `training_readiness_score` | ≥70 primed · 40–69 normal · <40 soften the week |
| `hrv_rmssd_milli` vs. our own rolling 7-day average (computed from `whoop_daily_metrics` history) | `hrv_status` / `hrv_last_night_avg` vs. `hrv_7day_avg` | ≥10% above avg = primed · ≥10% below avg = flag fatigue |
| `sleep_performance_percentage` | `sleep_score` | <70 → add an easier day / reduce hard-session reps this week |
| `day_strain` (WHOOP's 0–21 scale) | new signal, no Garmin equivalent | 0–9 light · 10–13 moderate · 14–17 strenuous · 18–21 all-out |

> Confirm the exact `day_strain` band cut points against WHOOP's current
> published strain-scale documentation before relying on them for a
> real athlete — the table above is this plan's best-available mapping at
> write time, not a verified quote from WHOOP's docs.

**Decision tables** (identical structure to `garmin-data.md`'s, since the
underlying scores are the same shape):

Recovery (`recovery_score`):

| Score | Action |
|---|---|
| ≥ 70 | Athlete is primed. Can add one rep or 5% intensity to a hard session if load/ACWR allow. |
| 40–69 | Normal plan. No adjustment. |
| < 40 | Soften the week: convert one hard session to Z2, shorten the long ride, note the reason in the plan. |

HRV comparison (`hrv_rmssd_milli` vs. its own rolling 7-day average): this
is a **narrative flag only**, same role Garmin's `hrv_last_night_avg` vs.
`hrv_7day_avg` comparison plays there — `recovery_score` already
incorporates HRV numerically inside WHOOP's own algorithm, so the
comparison does not independently soften the plan on top of the recovery
band above. State it as a one-line call-out to the athlete when it reads
≥10% below the 7-day average (e.g. "HRV read below your 7-day average
today — worth keeping an eye on"), without a separate session change.

Sleep (`sleep_performance_percentage`):

| Score | Action |
|---|---|
| ≥ 70 | No adjustment. |
| < 70 | Add one easier day, or reduce hard-session reps this week. |

Day strain (`day_strain`, the day *before* a scheduled hard session):

| Band | Action |
|---|---|
| 0–13 (light/moderate) | No adjustment. |
| 14–21 (strenuous/all-out) | Flag to soften the next scheduled hard session, independent of the recovery score — a high-strain day can precede a still-adequate recovery score reading the next morning. |

## Per-workout data

WHOOP's Workout collection is correlated to a scheduled `workouts` row by
time-window overlap (see `whoop-integration-tasks.md` `WD1`). A matched
workout's `strain`/`average_heart_rate`/`max_heart_rate`/`kilojoule` land in
`workouts.actual`, and a `workout_logs` row with `source = 'whoop'` is
inserted. This feeds `workout-library.md`'s existing logged-outcome rule
table as an objective cross-check alongside RPE (`WD2`) — it is additive to
that table, not a parallel system.

## Conflict resolution when Garmin is also connected

Per `whoop-integration-plan.md`'s resolved decision #2, split by signal
type rather than a single most-recent-wins rule:

- **Recovery/HRV/sleep-derived plan adjustments**: WHOOP governs, full
  stop, when connected — Garmin's `training_readiness_score`/`hrv_status`/
  `sleep_score` are ignored for the *decision* in that case.
- **FTP, power zones, ACWR/CTL/ATL load metrics**: Garmin remains the sole
  source regardless of WHOOP connection status.
- **Display**: if both are connected, render both on the Readiness line,
  each explicitly labeled by source — never an unlabeled merge of numbers
  from two sources.

## Surfacing WHOOP data in the plan

WHOOP-only (no Garmin connection), add a **Readiness** line to the plan
header in the same place/format `garmin-data.md`'s Garmin-sourced line
uses:

```markdown
**Readiness (WHOOP):** Recovery 62/100 · HRV 58 ms (7-day avg 65 ms, below avg) · Sleep 71/100 · Day strain 12
```

Both Garmin and WHOOP connected, label each source explicitly rather than
merging the numbers:

```markdown
**Readiness (WHOOP):** Recovery 62/100 · Sleep 71/100 · Day strain 12 · **Load (Garmin):** CTL 58 · ATL 61 · ACWR 1.05
```

## Worked example (WC4's test)

Sample payload: `recovery_score` 62, `hrv_rmssd_milli` 58 ms vs. a 65 ms
7-day average, `sleep_performance_percentage` 71, `day_strain` 12.

Tracing the rules above:
- Recovery 62 → 40–69 band → **no adjustment**.
- HRV 58 vs. 65 ms = ~10.8% below average → **narrative flag only** ("HRV
  read below your 7-day average today"), no separate session change per
  the HRV rule's own text above.
- Sleep 71 → ≥70 → **no adjustment**.
- Day strain 12 → 0–13 band → **no adjustment**.

Net result: **no plan adjustment** — the week's design is unchanged from
what it would be without WHOOP data — plus one narrative HRV call-out in
the plan's readiness summary. This is the doc's own worked example of an
unambiguous "no adjustment" outcome, per `WC4`'s test bar.
