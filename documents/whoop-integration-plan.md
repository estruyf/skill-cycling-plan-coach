# WHOOP integration — architecture plan

Status: proposed, not yet implemented. Written against issue
[#39](https://github.com/macken04/skill-cycling-plan-coach-dm/issues/39) to
turn that brief into a concrete, buildable design — resolving its open
questions rather than leaving them for implementation time — and to record
the decisions so they don't get re-litigated per task. See
`whoop-integration-tasks.md` for the task breakdown that implements this.

This plan doc + its companion tasks doc together serve the role issue #39's
open question 5 asks about ("does this warrant a full PRD?") — same pattern
as `multi-event-and-webui-plan.md`/`-tasks.md` and `agentic-coach-prd.md`
serve for the event/web-UI and agentic-logic work. No separate PRD file is
needed.

## Background / goal

Add an **optional** WHOOP integration so athletes who wear a WHOOP can
connect their account from the web UI, have the coach pull WHOOP's daily
recovery/strain/sleep metrics into the same readiness decision logic Garmin
already drives, have per-workout WHOOP data (strain, HR) correlated back to
the specific logged training session, and have all of it feed plan
adjustments the same way Garmin readiness does today — not just be
displayed. Athletes without WHOOP see zero behavior change.

## Current state (verified against this repo)

- **Garmin** (`references/garmin-data.md`): manual only — the athlete pastes
  a Garmin Coach JSON export in chat. No OAuth, no stored token, no live
  pull, no persistence — the data is read live, used for that one planning
  session, and not written to Supabase anywhere.
- **Strava** (`references/strava-pull.md`): OAuth exists but entirely as a
  Claude-native connector inside the athlete's own Claude runtime — no
  Strava OAuth code in this repo, no token table.
- **Web UI** (`web/`): Next.js 16 App Router + Supabase JS client, auth via
  magic-link OTP only (`web/app/login/page.tsx`). **There are zero
  server-side API routes anywhere in `web/app` today** (`find web/app -iname
  route.ts` returns nothing) — every page is a client component talking
  directly to Supabase with the public anon key, relying entirely on RLS for
  safety. This matters: a WHOOP OAuth flow is the **first feature that needs
  a server-side secret** (the WHOOP client secret) and the first feature
  that needs code running with elevated (service-role) privilege inside the
  deployed web app rather than only inside a Claude Code session. Vercel
  currently holds no `SUPABASE_SERVICE_ROLE_KEY` at all — that key exists
  only as a Claude Code environment variable per `docs/infra.md`, used by
  the *skill's* Supabase MCP calls, never by the deployed frontend.
- **Supabase schema** (`supabase/migrations/20260926171317_initial_schema.sql`,
  `20260926210000_season_plans.sql`): `athletes`, `events`, `plans`,
  `workouts` (has an unused `actual jsonb` column), `workout_logs` (has
  `source text default 'web-ui'`, a `session_status` enum, `actual_tss`,
  `actual_duration_min`), `nutrition_logs`, `strength_logs`, `coach_notes`,
  `season_plans`. Every table is RLS-scoped `auth.uid() = athlete_id` (or
  `= id` on `athletes`). **No `integrations`/OAuth-token table exists.**
- **Readiness → plan logic** (`references/garmin-data.md`): mechanical
  decision tables already exist — training-readiness bands, `hrv_status`,
  `sleep_score` threshold, ACWR bands, `recovery_time_hours` blackout
  window — and the plan header renders a **Readiness** line combining them.
- **Logged-outcome interpretation** (`references/workout-library.md`,
  `documents/agentic-coach-prd.md` FR3/FR4, shipped as tasks A8/B8): a
  `workout_logs`/`strength_logs` row's `session_status`
  (`completed_as_planned` / `completed_easier_than_planned` /
  `completed_harder_than_planned` / `failed_too_hard` / `skipped`) already
  drives a mechanical progression adjustment, read back by `SKILL.md` Step 1
  and written to `coach_notes`. WHOOP per-workout data should feed this same
  pipeline as an objective signal alongside RPE, not a parallel system.
- **Hard architectural constraint** (`documents/agentic-coach-prd.md` §4,
  non-goal): *"No scheduled job, cron, or timer-based process is
  introduced."* Every code path runs only in direct response to a chat
  message or a web UI request. Any WHOOP sync design must respect this.

## Resolved decisions (issue #39's open questions)

**1. Webhooks vs. the no-timer constraint.** Adopt the issue's own
recommendation: a WHOOP webhook delivery is allowed to **write** raw data,
but nothing may **interpret** it (apply a coaching adjustment) until the
athlete's own next trigger (opening `/plan`, or the skill's next planning
run) reads it back. The webhook receiver is intentionally "dumb" — it never
calls the coaching-logic path itself. This is scoped as an optional,
deferred task (`WF1`) since it needs its own WHOOP app configuration and
signature verification and isn't required to close the loop end-to-end;
lazy pull-on-athlete-action covers the MVP.

**2. Conflict resolution (Garmin + WHOOP both connected).** Split by signal
type rather than a single most-recent-wins rule, since the two devices
don't actually measure the same things:
   - **Recovery/HRV/sleep-derived plan adjustments**: WHOOP governs when
     connected, full stop — it's the newer, purpose-built signal and the
     athlete explicitly chose to connect it. Garmin's readiness/HRV/sleep
     fields are ignored for the *decision* in that case (but see below).
   - **FTP, power zones, ACWR/CTL/ATL load metrics**: Garmin remains the
     sole source regardless of WHOOP connection status — WHOOP has no power
     meter data and doesn't compute these.
   - **Display**: if both are connected, the plan header's Readiness line
     shows both, each explicitly labeled by source (`WHOOP recovery: …` /
     `Garmin load: …`), so nothing is silently dropped — only the
     *decision* input is WHOOP-preferred, never the display.

**3. Token encryption.** Supabase Vault (`vault.create_secret` /
`vault.decrypted_secrets`), which is `service_role`-only by default —
consistent with `docs/infra.md`'s existing RLS-first posture and avoids
hand-rolled app-level crypto. This forces a corollary decision: **all WHOOP
API calls (OAuth exchange, refresh, revoke, and the actual data pulls) live
in Next.js Route Handlers under `web/app/api/whoop/`**, the only place in
this codebase that will hold both the WHOOP client secret and a
service-role Supabase key. The skill (Claude Code) never touches a WHOOP
token or the WHOOP API directly — it only (a) calls one authenticated sync
endpoint on the deployed web app to trigger a fresh pull, and (b) reads the
*results* back from Supabase via the same `execute_sql`-via-MCP pattern it
already uses for `nutrition_logs`/`workout_logs`/`strength_logs`. This
keeps the trust boundary identical to what already exists — no new secret
class for Claude Code to hold beyond one shared internal key (below).

**4. Personal HRV/RHR baselines.** Use WHOOP's own `recovery_score` directly
as the primary decision-table input (it's already 0–100 and baseline-
normalized by WHOOP internally — same role as Garmin's
`training_readiness_score`). For the "primed vs. fatigued" comparison
Garmin's `hrv_last_night_avg` vs. `hrv_7day_avg` currently does, **compute
our own rolling 7-day average** from the `hrv_rmssd_milli` values already
stored in `whoop_daily_metrics` (below) rather than depend on WHOOP's own
undocumented baseline window — this needs no extra WHOOP API surface and
keeps the comparison mechanically identical to the Garmin path.

**5. Full PRD?** No — this plan + its tasks doc is the PRD-equivalent,
matching how `multi-event-and-webui-plan.md`/`agentic-coach-prd.md` already
cover comparably-sized work in this repo.

## Proposed architecture

```
Athlete's browser (web/)                    Claude Code (SKILL.md, Step 1)
        │  visits /plan or /connections             │  "plan my week" (athlete-triggered)
        ▼                                            ▼
  Next.js Route Handlers (web/app/api/whoop/*)  ◄── curl + WHOOP_INTERNAL_SYNC_SECRET
  (server-side only: WHOOP client secret,            (POST /api/whoop/sync {athlete_id})
   SUPABASE_SERVICE_ROLE_KEY, vault access)
        │
        ├── OAuth exchange/refresh/revoke ──► WHOOP API (api.prod.whoop.com)
        │
        └── upserts whoop_daily_metrics,
            workouts.actual, workout_logs(source='whoop')
        ▼
  Supabase (RLS-scoped tables + Vault)
        ▲
        │  execute_sql via Supabase MCP connector (same path B4/B8 already use)
        │
  Claude Code reads back whoop_daily_metrics / workout_logs to build the
  Readiness line and apply logged-outcome rules — never talks to WHOOP or a
  token directly.
```

### 1. Connect flow (web UI)

- New authenticated page, `web/app/connections/page.tsx`, linked from the
  existing nav alongside `/plan`/`/nutrition`/`/strength`/`/season`/
  `/compliance` (`web/app/components/AppShell.tsx`). Shows a "Connect WHOOP"
  card when no active connection exists, or "Connected · Disconnect" with
  `connected_at` when one does. Not on `/login` — that page is pre-auth and
  doesn't know `athlete_id` yet; the issue's cited `FEATURE_CHIPS` visual
  pattern is reused stylistically, not literally on that page.
- Standard OAuth 2.0 authorization-code flow against WHOOP API v2:
  - Authorize: `https://api.prod.whoop.com/oauth/oauth2/auth`
  - Token: `https://api.prod.whoop.com/oauth/oauth2/token`
  - Scopes: `read:recovery`, `read:cycles`, `read:sleep`, `read:workout`,
    `read:profile` (verify the exact refresh-token/`offline_access`-style
    scope name against WHOOP's current developer dashboard at
    implementation time — not confirmed by the docs fetch this plan is
    based on).
  - `web/app/api/whoop/authorize/route.ts`: redirects to WHOOP with a
    signed `state` (CSRF) param encoding the authenticated athlete's id.
  - `web/app/api/whoop/callback/route.ts`: verifies `state`, exchanges
    `code` for tokens server-side (client secret never leaves this route
    handler), stores tokens via Vault, upserts `integration_connections`.
  - `web/app/api/whoop/disconnect/route.ts`: revokes with WHOOP, deletes
    the Vault secrets, deletes the `integration_connections` row (not a
    soft flag, per the issue).
- New table `integration_connections` (`athlete_id`, `provider` — future-
  proofs beyond WHOOP without building a plugin framework now, per the
  issue's own non-goal — `whoop_user_id`, `access_token_id`/
  `refresh_token_id` referencing Vault secret ids, `expires_at`,
  `connected_at`, `revoked_at`). RLS: athletes can `select` their own row
  (so the UI can render connection state) but have **no** insert/update/
  delete grant — all writes go through the service-role-holding route
  handlers above, never the browser's anon-key client.

### 2. Daily/cycle-level pull

- `web/app/api/whoop/sync/route.ts`: given an athlete (from a valid
  Supabase Auth session when called by the browser, or from an explicit
  `athlete_id` + `WHOOP_INTERNAL_SYNC_SECRET` bearer header when called by
  the skill), refreshes the WHOOP token if it's near `expires_at`, pulls the
  Recovery, Sleep, and Cycle collections since the last successful sync,
  and upserts one row per WHOOP cycle-day into a new `whoop_daily_metrics`
  table (`athlete_id`, `cycle_date`, `recovery_score`, `hrv_rmssd_milli`,
  `resting_heart_rate`, `sleep_performance_percentage`, `day_strain`,
  `pulled_at`), unique on `(athlete_id, cycle_date)`.
- Two athlete-triggered call sites, both hitting this same endpoint:
  1. `web/app/plan/page.tsx` calls it (with the browser's own session) on
     mount when a connection exists — "opening the web app" is itself an
     explicit athlete-triggered moment per the issue's non-goals section.
  2. `SKILL.md` Step 1 calls it via `curl` (with the shared internal
     secret) when `supabaseAthleteId` is set and a connection exists,
     before reading `whoop_daily_metrics` back via `execute_sql` — mirrors
     how Step 1 already reads `nutrition_logs`/`workout_logs` back.
- `references/whoop-data.md` (new, mirrors `garmin-data.md`'s structure)
  maps WHOOP fields onto the same decision roles Garmin fields already
  play, reusing Garmin's exact threshold bands where the scales are
  directly comparable (both `recovery_score` and `sleep_performance_
  percentage` are WHOOP's own 0–100 scores, same shape as Garmin's
  `training_readiness_score`/`sleep_score`):

  | WHOOP field | Plays the role of | Band (mirrors Garmin) |
  |---|---|---|
  | `recovery_score` | `training_readiness_score` | ≥70 primed · 40–69 normal · <40 soften the week |
  | `hrv_rmssd_milli` vs. our own rolling 7-day avg | `hrv_status` | ≥10% above avg = primed · ≥10% below = flag fatigue (same rule as Garmin's `hrv_last_night_avg` check) |
  | `sleep_performance_percentage` | `sleep_score` | <70 → add an easier day / reduce hard-session reps |
  | `day_strain` (WHOOP's 0–21 scale) | new signal, no Garmin equivalent | 0–9 light · 10–13 moderate · 14–17 strenuous · 18–21 all-out — high day strain *before* a scheduled hard session is a flag to soften it, independent of recovery score |

  Confirm the exact band cut points against WHOOP's current published
  strain-scale documentation at implementation time (`WC4`) — the table
  above is this plan's best-available mapping, not scraped verbatim from a
  WHOOP source.
- Extend the plan header's Readiness line to render WHOOP-sourced values
  (labeled `WHOOP recovery: …`) using the same one-line format
  `garmin-data.md` already uses for Garmin.

### 3. Per-workout sync

- The same `/api/whoop/sync` handler also pulls the WHOOP Workout
  collection for the sync window and correlates each entry to a `workouts`
  row by time-window overlap (`start`/`end` vs. the workout's scheduled day
  ± a tolerance), for workouts that don't already have a `workout_logs` row
  with `source = 'whoop'`.
- On a match: write WHOOP's `strain`, `average_heart_rate`,
  `max_heart_rate`, `kilojoule` into the existing unused `workouts.actual`
  jsonb column, and insert a `workout_logs` row with `source = 'whoop'` (no
  schema break — `source` already defaults to `'web-ui'`).
- Feeds `references/workout-library.md`'s existing logged-outcome rule
  table as an objective cross-check alongside RPE — e.g. "planned Z2, but
  WHOOP strain/HR reads as a hard effort" nudges a `completed_harder_than_
  planned` interpretation even if the athlete didn't separately log RPE for
  it. This is additive to A8's table (`WD2`), not a new parallel system.

### 4. Feeding into coaching logic

- `SKILL.md` Step 1 gains: when `supabaseAthleteId` is set and an active
  WHOOP connection exists, trigger a sync, then read `whoop_daily_metrics`
  and any WHOOP-sourced `workout_logs` back via `execute_sql`, apply the
  precedence rules from decision #2 above, and state the WHOOP-driven
  adjustment explicitly in the plan's Readiness line and last-week summary
  — same standard this repo already holds Garmin/logged-outcome
  interpretation to (`agentic-coach-prd.md` FR8).

## Non-goals (unchanged from the issue)

- Not a scheduled/cron-based sync — every pull traces to an athlete action
  (opening `/plan`, connecting/disconnecting, or a chat planning run).
- Not required — athletes with no WHOOP connection see zero behavior
  change, and the connect flow is fully skippable.
- Not replacing Garmin or Strava — additive third data source.
- Not building a general multi-provider wearables framework now —
  `integration_connections.provider` future-proofs the column, nothing
  more.
- Not multi-athlete-specific work — inherits the existing single-athlete-v1
  posture; schema still keys everything by `athlete_id`.

## New infra this introduces (beyond `docs/infra.md`'s current state)

This is the first feature needing secrets in **Vercel**, not just Claude
Code:

| Env var | Where | Why |
|---|---|---|
| `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET` | Vercel (server-only) | OAuth exchange in the route handlers |
| `WHOOP_REDIRECT_URI` | Vercel (server-only) | must exactly match the WHOOP app's registered redirect |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server-only) — **new**, doesn't exist there today | Route handlers need it to write `integration_connections`/Vault secrets past RLS |
| `WHOOP_INTERNAL_SYNC_SECRET` | Vercel (server-only) **and** Claude Code environment | Shared bearer secret so the skill can call `/api/whoop/sync` for an explicit `athlete_id` without a browser session, without leaving the endpoint open to anyone |

Manual, user-side steps (parallel to B1's "create a Supabase/Vercel
project"): register a WHOOP developer application to get a client id/secret
and register the production redirect URI.

See `whoop-integration-tasks.md` for the sequenced task breakdown.
