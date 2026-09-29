# Infra (Milestone B)

Provisioned per `documents/multi-event-and-webui-tasks.md` task **B1**. This
records what exists and what future sessions (or the deployed skill/web UI)
need as environment variables. No schema exists yet — that's B2.

> **⚠️ Action needed from David:** `SUPABASE_SERVICE_ROLE_KEY` is not yet set.
> Grab it from the Supabase dashboard (Project Settings → API,
> `cycling-plan-coach` project) and add it as an environment variable in
> this Claude Code environment's settings, then start a new session. See
> the Supabase section below for the exact steps. Until this is done, B1's
> full end-to-end test (a 200 using the service-role key) isn't passing,
> and **B3**'s skill-side writes (which need the service-role key to bypass
> RLS from the coaching side) can't be built. **B2 turned out not to need
> it** — see below.

## Supabase

- **Project:** `cycling-plan-coach` (org: `davidmacken@gmail.com's Org`)
- **Project ref:** `gurxzxcdxxxezwyatwlf`
- **Region:** `eu-west-1`
- **API URL:** `https://gurxzxcdxxxezwyatwlf.supabase.co`

Env vars a client or the skill's API calls need:

| Variable | Value | Safe to commit? |
|---|---|---|
| `SUPABASE_URL` | `https://gurxzxcdxxxezwyatwlf.supabase.co` | Yes |
| `SUPABASE_ANON_KEY` | `sb_publishable_56rCR16TJJwyA8KVpmO-iw_1xtkI3HU` (or the legacy JWT anon key, same project) | Yes — client-side/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | *(not committed — see below)* | **No, never** |

The service-role key bypasses RLS and is required for the skill's own
server-side writes (posting generated plans/workouts, per B3). It is
intentionally **not** retrievable through the Supabase MCP connector for
security reasons. To make it available to a Claude Code session:

1. In the Supabase dashboard: Project Settings → API → reveal the
   `service_role` secret key for the `cycling-plan-coach` project.
2. In this Claude Code environment's settings (the cloud environment menu →
   Edit), add it as an environment variable named `SUPABASE_SERVICE_ROLE_KEY`.
3. Start a new session — environment variables are read at session start.

**Verified (this session):** the REST endpoint is reachable — a GET to
`{SUPABASE_URL}/rest/v1/` returns a 401 with `apikey` alone (expected: that
introspection route requires `service_role` specifically), confirming
network path and API key both resolve correctly. Full B1 test (a 200 using
the service-role key) is pending until the key above is added to the
environment.

## Vercel

- **Project:** `cycling-plan-coach`
- **Project ID:** `prj_r5kLLrVY9bfKsuZP16ain1cPIXJG`
- **Linked repo:** `macken04/skill-cycling-plan-coach-dm` (auto-deploys on
  push to the production branch once there's a frontend to deploy — none
  yet; that starts at B3)
- **Team/account:** personal account (`davidmacken-3000`, no team created)

No environment variables needed on Vercel yet — those get added once B3's
frontend exists and needs `SUPABASE_URL`/`SUPABASE_ANON_KEY` client-side.

## Schema + RLS (B2 — done)

Migration: `supabase/migrations/20260926171317_initial_schema.sql`, applied
via the Supabase MCP connector's `apply_migration` tool. Creates the seven
tables from the plan doc plus `coach_notes` (FR5); `athletes` columns are
reconciled against `references/athlete-config.md`'s current ~30-field table,
not the plan doc's original sketch (see the migration's header comment).
`workout_logs`/`strength_logs` get the FR3 five-way `session_status` enum;
`nutrition_logs` gets its own `carb_target_status` ('hit'/'missed') +
`hydration_note` instead of reusing that vocabulary.

**On the service-role key:** the B1 blocker callout above assumed applying
migrations and verifying RLS both needed `SUPABASE_SERVICE_ROLE_KEY` as a
local env var. That turned out to be wrong — `apply_migration`/`execute_sql`
authenticate via the Supabase MCP connector's own project-scoped access
token, independent of that env var, and RLS enforcement can be verified from
outside using the already-known, publicly-safe `SUPABASE_ANON_KEY` (no
service-role key needed to prove the *anon* role is denied). So B2 shipped
without waiting on it.

**RLS design:** every table has `athlete_id` (or `id` on `athletes` itself)
and one `for all using (auth.uid() = athlete_id)` policy — the standard
Supabase per-user pattern. No Supabase Auth login flow exists yet (that's
part of B3's frontend work), so today `auth.uid()` never matches anything
for an anon/unauthenticated request — reads return an empty set and writes
are rejected with a `42501` RLS violation, which is the correct state for
infra with no frontend yet. The service-role key (once added) bypasses RLS
entirely for the skill's own server-side writes, per the design above.

**Verified this session** (`gurxzxcdxxxezwyatwlf`, all via MCP + the anon
key, no service-role key needed):
- All 8 tables created, RLS enabled on all 8, zero rows left behind.
- `get_advisors(type: security)` returns zero lint findings.
- All five `session_status` values insert cleanly on `workout_logs`; an
  invalid value (`'not_a_real_status'`) is rejected by the enum type.
- The `coach_notes` "exactly one of workout_log_id/strength_log_id" check
  constraint rejects a row with both (or neither) set.
- With two dummy athlete rows and populated child rows present server-side,
  an unauthenticated REST call with the anon key to `GET /athletes` and
  `GET /workout_logs` both return `200 []` (not just filtered — zero
  visibility), and an unauthenticated `POST /nutrition_logs` returns
  `401` / `42501 row violates row-level security policy`.
- **Not yet verified:** two different *authenticated* users seeing only
  their own rows (the literal B2 test scenario) — that needs a real
  Supabase Auth session per athlete, which doesn't exist until B3 wires up
  login. The zero-visibility-for-anon test above is the strongest check
  available before then, and confirms the policies are live and scoped to
  `auth.uid() = athlete_id` rather than merely declared with no effect.

## Core loop (B3 — done)

Shipped in `web/`: a bare-bones Next.js app (App Router, TypeScript) with
Supabase Auth magic-link sign-in (`app/login`), and `app/plan` listing the
current week's workouts (most recent `plans` row with `week_start_date <=`
today, for `athlete_id = auth.uid()`) with a five-way status picker per
workout that writes to `workout_logs`. No password flow, no server-side
auth callback route needed — `supabase-js`'s `detectSessionInUrl` picks the
session up from the magic-link redirect automatically.

The skill's side (per `SKILL.md`'s new "Step 7 - sync to Supabase"): after
producing the weekly plan/workout files, if `athlete.json`'s
`supabaseAthleteId` is set, it upserts `plans`/`workouts` for the week. **It
turned out not to need `SUPABASE_SERVICE_ROLE_KEY` either** (same shape of
surprise as B2): inside a Claude Code session with the Supabase MCP
connector attached, `execute_sql` authenticates with its own project-scoped
token and isn't subject to RLS, so it can upsert `plans`/`workouts` without
that key. The `curl` + service-role-key path documented below is kept as
the fallback for a hypothetical deployment of this skill outside Claude
Code/MCP, where that shortcut isn't available.

**Vercel project reconfigured for the frontend:** `rootDirectory: "web"`,
`framework: "nextjs"`; `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` added as project env vars (production/
preview/development) — same values as `web/.env.example`, safe to expose
client-side per the table above. The project has Vercel's SSO/Deployment
Protection on (`ssoProtection.deploymentType: all_except_custom_domains`,
set before this session, not changed), so the `*.vercel.app` URL only
opens for someone logged into the `davidmackengmailcoms-projects` Vercel
account — expected for a single-athlete v1 with no custom domain, but
worth knowing if David wants Badlands-training-buddy or future athletes to
reach it directly.

**Linking bootstrap — needs one action from David, not scriptable from
here:** `athlete.json`'s new `supabaseAthleteId` field starts `null`
(`references/athlete-config.md`). The chicken-and-egg: the skill can only
upsert an `athletes`/`plans`/`workouts` row once it knows David's Supabase
Auth user id, and that id doesn't exist until he's signed in at the web app
at least once (there's no admin API call available here — no service-role
key — to create it ahead of time). So:

0. **One-time Supabase Auth config fix, found when this was actually tried:**
   the project's Auth **Site URL** was still the default `localhost:3000`
   (nothing in B1-B3 had set it, since no real email round-trip had been
   tested before). A magic-link email always resolves to the Site URL
   unless the requested redirect is in the **Redirect URLs** allow-list, so
   the link David received pointed at `localhost` instead of the deployed
   app. Not fixable via the Supabase MCP connector (Auth config isn't a
   Postgres table `execute_sql` can reach) — fix once in the dashboard:
   [Auth → URL Configuration](https://supabase.com/dashboard/project/gurxzxcdxxxezwyatwlf/auth/url-configuration)
   for the `cycling-plan-coach` project — set **Site URL** to
   `https://cycling-plan-coach.vercel.app` and add
   `https://cycling-plan-coach.vercel.app/**` to **Redirect URLs**. Any
   magic-link email sent *before* this fix still points at `localhost` and
   won't work even after saving — request a fresh one.
1. David visits the deployed `web/` app (`https://cycling-plan-coach.vercel.app`,
   logged into the right Vercel account per the SSO note above) and signs
   in with his email via the magic link.
2. In a Claude Code session with the Supabase MCP connector attached, look
   up `select id from auth.users where email = 'davidmacken@gmail.com'`
   and set the result as `supabaseAthleteId` in his `athlete.json`.
3. From then on, Step 7 syncs every generated week automatically.

**Note (post-3.1.1):** steps 1-2 used to be something only whoever read this
file would know to do — the coaching conversation itself said nothing about
the web dashboard while `supabaseAthleteId` stayed `null`. `SKILL.md`'s Step
7 now tells the athlete this in-conversation (once per unlinked run) and, if
they confirm they've already done step 1 and the current session has
Supabase access, completes step 2 on the spot rather than requiring a
separate developer-side session to notice and do it later.

**Verified this session** (dummy athletes, not David's real account —
cleaned up afterward, same pattern as B2): created two athletes + one plan
+ one workout each; via `set_config('request.jwt.claims', ...)` (the same
mechanism PostgREST itself uses, so this exercises the *authenticated*
path B2 explicitly deferred, not just the anon-key path) confirmed athlete
A's `select` on `plans` scoped by `athlete_id` returns only their own row,
a direct `select count(*)` against athlete B's `plans` row returns `0` for
athlete A, athlete A's `insert` into `workout_logs` against their own
workout succeeds, and athlete A's `insert` into `workout_logs` against
athlete B's workout is rejected with `42501` (RLS violation) — the literal
two-different-authenticated-athletes test B2 left open. All test rows
deleted afterward (cascade from deleting the two athlete rows).

**Not yet verified end-to-end with a real browser session:** the actual
magic-link email round-trip (this session has no access to David's inbox)
and the skill's live `execute_sql` upsert against a real `athletes` row
with a real `supabaseAthleteId` — both need the linking bootstrap above
first. `npm run build` and `npm run lint` both pass clean in `web/`, and
the unauthenticated `/login` and `/plan` routes were smoke-tested against
a local dev server.

## Nutrition logging UI (B4 — done)

Shipped in `web/app/nutrition/page.tsx`: a daily entry form + history view
writing to `nutrition_logs`, upserting on the table's existing
`(athlete_id, log_date)` unique constraint (re-logging a day edits it, no
duplicates). `SKILL.md` Step 1 now reads the last 7-14 days of
`nutrition_logs` back (same `execute_sql`-via-MCP path as Step 7's writes)
when `supabaseAthleteId` is set, and folds the hit/missed split and any
hydration/notes text into that run's fueling guidance.

**Verified this session** (dummy athletes, same pattern as B2/B3, cleaned up
afterward): the upsert path correctly updates-in-place rather than
duplicating a re-logged day; RLS scoping holds for `nutrition_logs` the same
way it does for `plans`/`workout_logs` (a second authenticated athlete sees
zero of the first's rows and a cross-athlete write is rejected `42501`); the
`carb_target_status` check constraint rejects an invalid value. `npm run
build`/`npm run lint` pass in `web/`.

**Not yet verified end-to-end with a real browser session** — same blocker
as B3: needs the linking bootstrap above (David signed in once,
`supabaseAthleteId` set) before a real UI entry can be read back by a real
skill run and checked against the resulting plan summary.

## S&C logging UI (B5 — done)

Shipped in `web/app/strength/page.tsx`: a session entry form (session name,
the full five-way FR3 status vocabulary, a repeatable exercise row of
exercise/sets/reps/load-kg, notes) + history view, inserting into
`strength_logs` (`sets_reps_load` stored as `{ exercises: [...] }`). Unlike
`workout_logs`, this is a standalone entry not tied to a specific scheduled
`workouts` row — `workout_id` is left null, same shape as `nutrition_logs`.

**Verified this session** (dummy athletes, same pattern as B2/B3/B4, cleaned
up afterward): an authenticated insert of a `failed_too_hard` session with
two exercises round-trips the exact `sets_reps_load` JSON shape the UI
sends; a second authenticated athlete sees zero of the first's
`strength_logs` rows; an insert impersonating the first athlete's
`athlete_id` while authenticated as the second is rejected `42501`. `npm run
build`/`npm run lint` pass in `web/`.

**Not yet verified end-to-end with a real browser session** — same blocker
as B3/B4: needs the linking bootstrap above (David signed in once,
`supabaseAthleteId` set) before a real UI entry can be checked against the
history view for real.

B6 (events table + season-phase columns on `plans`), B7 (frontend polish —
event countdown, compliance/trend, taper/race-week views), and B8 (signal
interpretation wired into coach_notes) shipped since; see
`documents/multi-event-and-webui-tasks.md` for their full writeups.

## Season macrocycle persistence (B9 — done)

Per `documents/season-macrocycle-prd.md` §3.3/§5 and
`documents/multi-event-and-webui-tasks.md`'s B9: the file-based
`season-plan.json` (A9) now has a DB counterpart, `season_plans`
(`supabase/migrations/20260926210000_season_plans.sql`) — one row per
athlete's *current* skeleton (`unique (athlete_id)`, upserted in place on
replan, mirroring the single-file-per-athlete assumption `season-plan.json`
already makes, the same pattern `events` uses). `phases` (always exactly 5
entries — enforced by a `jsonb_array_length(phases) = 5` check constraint)
and `trial_events` are JSONB columns rather than normalized child tables:
both are small, fixed-shape documents always read/written as a whole, never
queried by sub-field, so normalizing them would add join overhead with no
query benefit. Field names inside the JSON follow this repo's existing
`strength_logs.sets_reps_load` precedent — snake_case, not the camelCase
`season-plan.json` itself uses — since these are DB column contents, not
the local file; `SKILL.md` Step 7 item 3 translates on write.

`SKILL.md`'s Step 7 gained item 3 (upsert `season_plans` whenever a
`season-plan.json` was resolved this run) and quality check 13. The
frontend gained `web/app/season/page.tsx`: the header block, 5-row phase
table (current phase highlighted), and trial-event ladder table, mirroring
`references/season-plan-format.md`'s rendering — linked from `/plan`'s nav
whenever an `events` row exists. `web/lib/types.ts` gained the
`SeasonPlan`/`SeasonPlanPhase`/`TrialEvent` family of types.

**Verified this session** (one dummy athlete with a full Badlands-Ultra-shaped
skeleton — the same 48-week worked example from `macrocycle-model.md`/
`trial-events.md`/`season-plan-format.md` — plus a second dummy athlete for
the cross-athlete checks, all cleaned up after): the `jsonb_array_length(phases)
= 5` check constraint rejects a malformed (1-entry) skeleton; athlete A's
authenticated `select` returns their own row; athlete B's authenticated
`select` returns `0` rows; an insert impersonating athlete A's `athlete_id`
while authenticated as athlete B is rejected `42501`; an `insert ... on
conflict (athlete_id) do update` (the shape of a real replan) updates the
existing row in place — row count for the athlete stays `1`, and the
updated `phases`/`last_replanned_at` are the new values, not a second row.
`get_advisors(type: security)` shows no new lint findings from this
migration. `npm run build`/`npm run lint` pass in `web/`; `/season` and
`/plan` were smoke-tested unauthenticated against a local prod server (both
200, rendering the client-side loading/sign-in state, same pattern as
B3-B7).

**Still open, same blocker as B3-B8:** the literal test as B9 originally
scoped it — migrate one *real* athlete's existing `season-plan.json` into
this table and confirm `/season` matches the source file with no loss of
information — needs a real signed-in, linked athlete who has actually run
the skill with a `targetEvent`/`eventDate` set, which is still blocked on
the linking bootstrap above. David has now completed step 1 of that
bootstrap (signed in for real — `auth.users` has his row as of this
session), but steps 2-3 (setting `supabaseAthleteId`, then a real weekly
planning run) still need a real onboarding conversation in his own Claude
client, not this dev-repo session — see the linking bootstrap section
above.

## WHOOP integration (Milestone W-A through W-D — schema/code done, WA1 blocked on manual action)

Per `documents/whoop-integration-plan.md`/`-tasks.md`. Optional per-athlete
WHOOP connection feeding the same readiness decision logic Garmin already
drives, plus per-workout strain/HR correlation. Athletes with no WHOOP
connection see zero behavior change.

**Schema (WA2/WC1 — done, verified this session):** two new tables,
`integration_connections` (`supabase/migrations/20260927120000_integration_connections.sql`)
and `whoop_daily_metrics` (`supabase/migrations/20260927120100_whoop_daily_metrics.sql`).
Both are RLS `select`-only for `authenticated` (no insert/update/delete
policy at all — verified this session that an authenticated insert attempt
is rejected `42501` on both tables, not just scoped away) — all writes go
through the service-role client inside `web/app/api/whoop/*`.
`get_advisors(type: security)` shows no new findings from either migration.

**Vault-backed token storage (WB1 — done, verified this session):** a third
migration, `20260927130000_whoop_vault_functions.sql`, adds three
`security definer` RPC functions (`whoop_store_tokens`/`whoop_get_tokens`/
`whoop_disconnect`) that are the only way to create/read/delete a WHOOP
token — wrapping `vault.create_secret`/`vault.update_secret`/
`vault.decrypted_secrets` (the `supabase_vault` extension was already
installed on this project). Explicitly revoked from `anon`/`authenticated`,
granted only to `service_role`. Verified this session with a dummy athlete:
store → get (decrypts correctly) → simulated refresh (same secret ids
updated in place, `whoop_user_id` preserved via `coalesce`) → disconnect
(confirmed both the `integration_connections` row **and** both Vault
secrets are gone afterward, not just the row).

**Route handlers (WB1/WC2/WD1 — code done, untested live):**
`web/app/api/whoop/{authorize,callback,disconnect,sync}/route.ts` and
`web/lib/whoopServer.ts` (all WHOOP API calls + the service-role Supabase
client — the only file in this codebase that ever holds a WHOOP token or
`SUPABASE_SERVICE_ROLE_KEY`). Endpoint paths
(`/oauth/oauth2/{auth,token}` for OAuth, `/developer/v2/*` for every data +
revoke endpoint) and the `offline` scope (required specifically to receive
a refresh token) were confirmed against `developer.whoop.com`'s live docs
during this session, not assumed. `state` is a signed, stateless HMAC
payload (keyed on `WHOOP_CLIENT_SECRET`) rather than a DB-backed nonce, so
it works across Vercel's independent serverless invocations. `npm run
build`/`npm run lint` pass; unauthenticated smoke test against a local prod
server confirms all four routes correctly reject a missing/bad
Authorization header or `state` (401/307), and the internal-secret sync
path fails past that gate only on the placeholder `SUPABASE_SERVICE_ROLE_KEY`
below — expected until a real key is set.

**UI (WB2/WC3 — done):** `web/app/connections/page.tsx` (linked from
`AppShell.tsx`'s nav), `web/app/plan/page.tsx` gained a non-blocking sync
trigger on load, gated on an existing connection row (checked first —
no sync call fires at all for an unconnected athlete).

**Skill-side (WC5/WD2/WD3 — done):** `SKILL.md` Step 1 gained a WHOOP
paragraph (checks for a connection, triggers `/api/whoop/sync` via `curl` +
the shared secret, reads `whoop_daily_metrics` back, applies
`references/whoop-data.md`'s rules/precedence). `references/workout-library.md`'s
logged-outcome table gained the WHOOP objective-cross-check rule and the
explicit severity-precedence rule for when both a `web-ui` and `whoop` log
exist for the same session.

**⚠️ Action needed from David (WA1, blocked — nothing above can be tested
live without this):**

1. Register a WHOOP developer application at the WHOOP developer dashboard;
   register the production callback URL
   `https://cycling-plan-coach.vercel.app/api/whoop/callback`.
2. Generate a random `WHOOP_INTERNAL_SYNC_SECRET` (e.g. `openssl rand -hex 32`).
3. Add these as **server-only** (no `NEXT_PUBLIC_` prefix) Vercel project
   environment variables: `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`,
   `WHOOP_REDIRECT_URI` (the callback URL above),
   `WHOOP_INTERNAL_SYNC_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` (this is
   the first feature that needs the service-role key in Vercel at all — it
   exists today only as a Claude Code environment variable, per this file's
   intro section; confirm this is a deliberate, reviewed step).
4. Add `WHOOP_INTERNAL_SYNC_SECRET` to this Claude Code environment too
   (same secret value as Vercel's), so Step 1's `curl` call can authenticate.

Until this is done, `whoop_get_tokens`/`whoop_store_tokens` calls from a
real route handler fail with an "Invalid API key" error from the
placeholder key used for this session's local build/smoke test (see
`web/.env.example` for the full var list) — expected, not a bug in the code
above.

**Not yet verified (needs a real WHOOP developer account + sandbox/test
user, once WA1 unblocks):** the live authorize → callback → connected →
disconnect cycle against WHOOP's actual API; the exact response field
nesting (`score.recovery_score` etc.) `web/app/api/whoop/sync/route.ts`
assumes, based on this session's reading of WHOOP's public v2 docs rather
than a live payload; the workout-correlation time-overlap matching against
a real WHOOP workout entry.

## Per-meal feedback (issue #45 — done)

Two new tables, `meal_recommendations` and `meal_feedback`
(`supabase/migrations/20260928090000_meal_recommendations_feedback.sql`),
plus a third optional `coach_notes` trigger column, `meal_feedback_id`,
alongside the existing `workout_log_id`/`strength_log_id` (the three-way
"exactly one set" check constraint was dropped and recreated to cover all
three). `meal_recommendations` is written only by the skill (Step 7,
delete-and-reinsert per `plan_id`, same as `workouts`); `meal_feedback` is
written by `web/app/nutrition/page.tsx`'s new per-item rating control
(`source: 'web-ui'`) and the new `/nutrition-feedback` Claude Code command
(`source: 'chat'`) — multiple rows per item allowed, same multiplicity as
`workout_logs`, with the latest row per item read back.

**Verified this session** (two dummy athletes, one plan + one meal item
each, same pattern as B2-B9, cleaned up afterward): `meal_feedback.rating`
rejects a value outside 1-5; `meal_feedback.source` rejects a value other
than `web-ui`/`chat`; the rebuilt `coach_notes_one_trigger` constraint
rejects a row with two triggers set (e.g. both `meal_feedback_id` and a
fabricated `workout_log_id`) and a row with none set, and accepts a row
with exactly `meal_feedback_id` set; an authenticated athlete A sees their
own `meal_recommendations`/`meal_feedback`/meal-linked `coach_notes` rows;
authenticated athlete B sees zero of them; an authenticated athlete B
inserting a `meal_feedback` row against athlete A's `meal_recommendation_id`
with athlete A's `athlete_id` is rejected `42501`. `get_advisors(type:
security)` shows no new findings from this migration (the one existing
WARN, leaked-password protection, predates this change). `npm run
build`/`npm run lint` pass in `web/` (new `MealItemRow` component in
`web/app/nutrition/page.tsx`, new `MealRecommendation`/`MealFeedback` types
in `web/lib/types.ts`).

**Not yet verified end-to-end with a real browser session** — same blocker
as every other logging UI in this app: needs the linking bootstrap above
(David signed in once, `supabaseAthleteId` set) and a real
`mealPlanEnabled: true` weekly run to produce real `meal_recommendations`
before a real per-item rating or `/nutrition-feedback` entry can be checked
against a real next-week swap.
