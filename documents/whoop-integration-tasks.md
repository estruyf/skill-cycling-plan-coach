# WHOOP integration — task breakdown

Companion to `whoop-integration-plan.md`. Implements issue
[#39](https://github.com/macken04/skill-cycling-plan-coach-dm/issues/39).
Each task is independently implementable and testable; sequenced so every
task can be verified before the next depends on it.

**Status:** `W-A` through `W-E` are built and verified with dummy data
server-side (schema/RLS/Vault functions applied and tested via the Supabase
MCP connector; `npm run build`/`npm run lint` pass in `web/`) — see
`docs/infra.md`'s "WHOOP integration" section for the full verification
notes. **`WA1` is the one item still genuinely open**: it's a manual,
user-side step (register a WHOOP developer application, set the resulting
secrets as Vercel/Claude Code environment variables) that nothing else can
be tested live against until it's done. `W-F` remains fully optional/
deferred, as originally scoped.

## Decisions locked in (see the plan doc's "Resolved decisions" for the full rationale)

- **Webhooks:** deferred, optional (`WF1`) — MVP uses athlete-triggered lazy
  sync only, per the "no scheduled/cron process" constraint.
- **Conflict resolution:** WHOOP governs recovery/HRV/sleep decisions when
  connected; Garmin remains sole source for FTP/power/ACWR; both display
  when both connected, labeled by source.
- **Token storage:** Supabase Vault, `service_role`-only decrypt, confined
  to Next.js Route Handlers in `web/app/api/whoop/`. The skill never holds a
  WHOOP token — only a shared internal secret to trigger a sync.
- **Baselines:** use WHOOP's own `recovery_score` directly; compute our own
  rolling 7-day HRV average from stored `whoop_daily_metrics` history for
  the primed/fatigued comparison (mirrors Garmin's `hrv_7day_avg` pattern).
- **No separate PRD** — this doc pair is it.

## Milestone W-A — Infra & schema (security-critical foundation)

- [ ] **WA1. WHOOP developer app registration + shared secrets**
  - Manual (user): register a WHOOP developer application; record client
    id/secret and register the production callback URL
    (`https://cycling-plan-coach.vercel.app/api/whoop/callback`, per
    `docs/infra.md`'s existing Vercel project).
  - Generate a random `WHOOP_INTERNAL_SYNC_SECRET`.
  - Add `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `WHOOP_REDIRECT_URI`,
    `WHOOP_INTERNAL_SYNC_SECRET` as **server-only** (not `NEXT_PUBLIC_`)
    Vercel project env vars. Add a `SUPABASE_SERVICE_ROLE_KEY` copy to
    Vercel too — it does not exist there today (only in the Claude Code
    environment, per `docs/infra.md`); confirm this is a deliberate,
    reviewed step since it's a new place this secret now lives. Add
    `WHOOP_INTERNAL_SYNC_SECRET` to the Claude Code environment as well.
  - Extend `docs/infra.md` with a new "WHOOP (Milestone W-A)" section
    documenting all of the above (mirrors how that file already documents
    Supabase/Vercel secrets and env vars).
  - **Test:** confirm each Vercel env var is set and scoped server-only (no
    `NEXT_PUBLIC_` prefix, not readable from a client bundle); confirm
    `docs/infra.md` states where each secret lives and why, matching its
    existing style for the Supabase service-role key.
  - Depends on: none (blocked on user action for the WHOOP app + Vercel
    dashboard edits).

- [x] **WA2. `integration_connections` schema + RLS**
  - New migration creating `integration_connections`: `id`, `athlete_id
    references athletes(id) on delete cascade`, `provider text not null
    check (provider = 'whoop')` (future-proofs the column without building
    a provider framework now), `whoop_user_id text`, `access_token_id uuid`,
    `refresh_token_id uuid` (both referencing Vault secret ids, not the
    tokens themselves), `expires_at timestamptz not null`, `connected_at
    timestamptz not null default now()`, `revoked_at timestamptz`, `unique
    (athlete_id, provider)`.
  - RLS: `for select using (auth.uid() = athlete_id)` only — no insert/
    update/delete policy for `anon`/`authenticated`, so the browser's
    anon-key client can read connection *state* (for the UI) but can never
    write a row; all writes flow through the service-role-holding route
    handlers in `WB1`.
  - Enable the `vault` extension/schema (Supabase-provided) and confirm
    `vault.decrypted_secrets` is unreachable except via `service_role`.
  - **Test:** confirm the table + RLS policy exist via `list_tables`; using
    two dummy athletes and `set_config('request.jwt.claims', ...)` (same
    technique `docs/infra.md` uses throughout), confirm athlete A's
    authenticated `select` sees only their own row, athlete B sees `0`, and
    an authenticated (non-service-role) insert attempt is rejected — there
    is no policy permitting it at all, not just a scoping mismatch. Confirm
    `get_advisors(type: security)` shows no new findings.
  - Depends on: none.

## Milestone W-B — OAuth connect/disconnect flow (web UI)

- [x] **WB1. Route handlers: authorize / callback / disconnect**
  - `web/app/api/whoop/authorize/route.ts`: requires an authenticated
    Supabase session (reject otherwise); builds the WHOOP authorization URL
    (`https://api.prod.whoop.com/oauth/oauth2/auth`) with the required
    scopes (`read:recovery`, `read:cycles`, `read:sleep`, `read:workout`,
    `read:profile`, plus whatever grants refresh tokens — confirm the exact
    scope name against WHOOP's current dashboard) and a signed `state`
    param encoding the athlete's id + a CSRF nonce; redirects the browser.
  - `web/app/api/whoop/callback/route.ts`: verifies `state`, exchanges
    `code` for tokens at `https://api.prod.whoop.com/oauth/oauth2/token`
    using `WHOOP_CLIENT_ID`/`WHOOP_CLIENT_SECRET` (server-side only, never
    sent to the browser), stores the access/refresh tokens via
    `vault.create_secret`, and upserts the `integration_connections` row
    (`WA2`) using the Supabase service-role client. Redirects back to
    `/connections` with a success/error state.
  - `web/app/api/whoop/disconnect/route.ts`: requires the authenticated
    athlete to match the row's `athlete_id`; calls WHOOP's revoke endpoint,
    deletes both Vault secrets, deletes the `integration_connections` row
    (hard delete, not a soft flag, per the plan).
  - **Test:** using a WHOOP developer sandbox/test account (or, if
    unavailable, a stubbed token response in a local test), walk the full
    authorize → callback → connected state → disconnect → revoked state
    cycle; confirm the client secret never appears in any response sent to
    the browser (inspect network tab); confirm a `state` mismatch or replay
    is rejected; confirm disconnect actually deletes the Vault secrets, not
    just the row (query `vault.decrypted_secrets` before/after as
    service_role and confirm the row is gone).
  - Depends on: WA1, WA2.

- [x] **WB2. "Connect WHOOP" UI**
  - New page `web/app/connections/page.tsx`, linked from
    `web/app/components/AppShell.tsx`'s nav alongside the existing
    `/plan`/`/nutrition`/`/strength`/`/season`/`/compliance` links.
  - Not-connected state: a card describing what connecting unlocks
    (recovery/sleep/strain feeding the plan, per-workout strain/HR
    matching), stylistically consistent with the `FEATURE_CHIPS` treatment
    on `web/app/login/page.tsx` (not literally on that pre-auth page,
    per the plan doc), with a "Connect WHOOP" button linking to
    `/api/whoop/authorize`.
  - Connected state: "Connected · since {connected_at}" plus a "Disconnect"
    button posting to `/api/whoop/disconnect`. Sourced from an
    authenticated `select` on `integration_connections` (safe under
    `WA2`'s RLS — no token fields are ever fetched client-side, only
    `connected_at`/`whoop_user_id`/`provider`).
  - `web/lib/types.ts` gains an `IntegrationConnection` type.
  - **Test:** manual walkthrough — visiting `/connections` unauthenticated
    redirects to sign-in (same pattern as `/plan`); once signed in with no
    connection, the "Connect WHOOP" card renders and the button reaches
    `/api/whoop/authorize`; once connected (via `WB1`'s test), the page
    shows the connected state and disconnecting returns it to the
    not-connected state without a page-breaking error. `npm run build`/
    `npm run lint` pass in `web/`.
  - Depends on: WB1.

## Milestone W-C — Daily/cycle readiness pull

- [x] **WC1. `whoop_daily_metrics` schema**
  - New migration: `whoop_daily_metrics` (`athlete_id`, `cycle_date date`,
    `recovery_score`, `hrv_rmssd_milli`, `resting_heart_rate`,
    `sleep_performance_percentage`, `day_strain`, `pulled_at timestamptz
    not null default now()`), `unique (athlete_id, cycle_date)`. RLS: `for
    select using (auth.uid() = athlete_id)`, no client-side write grant
    (writes only via the service-role sync route, `WC2`).
  - **Test:** same pattern as `WA2` — table/RLS exist, two-dummy-athlete
    scoping check, `get_advisors(type: security)` clean, and confirm a
    direct authenticated insert attempt is rejected (no policy permits it).
  - Depends on: none (parallel to WB).

- [x] **WC2. `/api/whoop/sync` route handler — daily pull**
  - Accepts either an authenticated Supabase session (browser call) or a
    `WHOOP_INTERNAL_SYNC_SECRET` bearer header + explicit `athlete_id` body
    param (skill call, `WC5`) — reject any request satisfying neither.
  - Looks up the athlete's `integration_connections` row; if the token is
    within a safety margin of `expires_at`, refreshes it first and updates
    the Vault secrets + `expires_at`.
  - Pulls the Recovery, Sleep, and Cycle collections for the window since
    the last `pulled_at` (or a fixed lookback, e.g. 7 days, on first sync);
    upserts one row per cycle date into `whoop_daily_metrics` (`WC1`).
  - Returns the latest daily metrics row as JSON in the response (so the
    calling `/plan` page or the skill's curl call can use it immediately
    without a second round trip).
  - **Test:** with a connected sandbox/test WHOOP account, call the
    endpoint via both auth modes and confirm both succeed and produce
    identical stored rows; call it with neither auth mode and confirm a
    401; call it with an expired token and confirm the refresh path runs
    and `expires_at` advances; call it twice in a row and confirm the
    second call doesn't duplicate rows (upsert, not insert).
  - Depends on: WA2, WB1, WC1.

- [x] **WC3. `/plan` page triggers sync on load**
  - `web/app/plan/page.tsx`: when the athlete has an active WHOOP
    connection (from `WB2`'s connection state), call `/api/whoop/sync` with
    the browser's own session on mount, non-blocking (the page still
    renders the existing plan data immediately; the WHOOP-sourced readiness
    display updates once the call resolves).
  - **Test:** with a connected test account, load `/plan` and confirm a
    sync call fires and `whoop_daily_metrics` gains a fresh row with
    `pulled_at` close to "now"; with no connection, confirm no call fires
    (no behavior change for unconnected athletes, per the plan's
    non-goals).
  - Depends on: WC2.

- [x] **WC4. `references/whoop-data.md`**
  - New reference file mirroring `garmin-data.md`'s structure: how the
    connect flow works from the athlete's perspective (link to
    `/connections`, no manual export needed unlike Garmin), the field
    mapping table from the plan doc's "Daily/cycle-level pull" section
    (`recovery_score` ↔ readiness role, `hrv_rmssd_milli` + our own rolling
    7-day average ↔ `hrv_status` role, `sleep_performance_percentage` ↔
    `sleep_score` role, `day_strain` as WHOOP's own new signal), and the
    conflict-resolution precedence rule (decision #2 in the plan doc) for
    when both Garmin and WHOOP are connected.
  - Confirm the `day_strain` band cut points (0–9/10–13/14–17/18–21) against
    WHOOP's current published strain-scale documentation before finalizing
    — the plan doc flags these as its best-available mapping, not a
    verified quote.
  - **Test:** same bar as `garmin-data.md`'s own — for a sample WHOOP
    payload (recovery 62, HRV 58ms vs. a 65ms 7-day avg, sleep 71, day
    strain 12), hand-trace the doc's rules to a concrete plan adjustment
    (or explicit "no adjustment") and confirm it's unambiguous.
  - Depends on: none (documentation, can be written in parallel with WC1-3).

- [x] **WC5. `SKILL.md` Step 1: WHOOP pull + Readiness line**
  - Edit Step 1 (`references/strava-pull.md`/`garmin-data.md`'s existing
    sibling step): when `supabaseAthleteId` is set, check for an active
    WHOOP connection (via `execute_sql` against `integration_connections`,
    same MCP path already used for `nutrition_logs`/`workout_logs`); if
    connected, call `/api/whoop/sync` via `curl` with
    `WHOOP_INTERNAL_SYNC_SECRET` and the athlete's id, then read
    `whoop_daily_metrics` back via `execute_sql`.
  - Apply `whoop-data.md`'s rules and the plan doc's conflict-resolution
    precedence (WHOOP governs recovery/HRV/sleep decisions when connected;
    Garmin still supplies FTP/power/ACWR); render both sources on the
    Readiness line, labeled, when both are present.
  - **Test:** dry-run "plan my week" for an athlete with only Garmin, only
    WHOOP, both, and neither connected — confirm each of the four cases
    produces the Readiness line and adjustment the precedence rule
    predicts, and the neither-connected case is byte-for-byte unchanged
    from current behavior (regression check, per the plan's non-goals).
  - Depends on: WA2, WC2, WC4.

## Milestone W-D — Per-workout sync

- [x] **WD1. Workout correlation in `/api/whoop/sync`**
  - Extend `WC2`'s handler: also pull the WHOOP Workout collection for the
    sync window; for each `workouts` row without an existing `workout_logs`
    row where `source = 'whoop'`, look for a WHOOP workout whose `start`/
    `end` overlaps that workout's scheduled day (± a tolerance window); on
    a match, write `strain`/`average_heart_rate`/`max_heart_rate`/
    `kilojoule` into `workouts.actual` and insert a `workout_logs` row with
    `source = 'whoop'` and a `session_status` inferred from strain vs. the
    workout's planned intensity (see `WD2`).
  - Dedup: check-before-insert on `(workout_id, source)`, same pattern
    `coach_notes` already uses to avoid double-writing on a re-sync.
  - **Test:** with a connected test account and a `workouts` row scheduled
    for a day with a matching WHOOP workout, confirm one sync call
    populates `workouts.actual` and inserts exactly one `workout_logs` row;
    confirm a second sync call is a no-op (row count unchanged); confirm a
    `workouts` row with no time-overlapping WHOOP workout is left
    untouched.
  - Depends on: WC2.

- [x] **WD2. Extend logged-outcome rules for WHOOP strain/HR**
  - Edit `references/workout-library.md`'s existing "Logged-outcome rules"
    table (A8/B8's table): add a rule for a WHOOP-sourced log where
    strain/HR reads meaningfully harder than the session's planned
    zone/intensity (e.g. planned Z2 but WHOOP strain lands in a hard-effort
    band) — treat as `completed_harder_than_planned` even absent a
    separate RPE entry, stated as an explicit objective-cross-check rule,
    not a silent override of an athlete-entered RPE if one also exists (if
    both a `web-ui` RPE log and a `whoop` strain log exist for the same
    session, the more severe of the two status classifications wins,
    stated explicitly to avoid ambiguity).
  - **Test:** same bar as A8/B8's own — for a sample WHOOP-only log and a
    sample case with both an RPE log and a WHOOP log disagreeing, confirm
    the rule table gives an unambiguous resulting status.
  - Depends on: WD1.

- [x] **WD3. Confirm Step 1's existing read-back covers `source='whoop'`**
  - `SKILL.md` Step 1's B8-era `workout_logs` read-back should already
    include WHOOP-sourced rows (it isn't filtered by `source` today) — this
    task is a verification pass, not new logic: confirm the query and the
    interpretation step apply `WD2`'s new rule correctly for a WHOOP-sourced
    row, and that the plan's last-week summary states the WHOOP-driven
    adjustment the same way it already states a web-UI-logged one.
  - **Test:** dry-run a planning session where the only signal for a given
    archetype's last occurrence is a WHOOP-sourced `workout_logs` row (no
    separate RPE log) and confirm the progression rule from `WD2` is
    applied and stated in the summary.
  - Depends on: WD1, WD2.

## Milestone W-E — Docs, version bump, changelog

- [x] **WE1. Version bump + changelog**
  - Bump `package.json`/`SKILL.md` version (additive feature → minor bump,
    e.g. current version + 1 minor).
  - Add a `CHANGELOG.md` entry describing optional WHOOP support: connect
    flow, daily readiness feeding the plan, per-workout strain/HR
    correlation.
  - Update `README.md`/`SKILL.md` descriptions to mention WHOOP alongside
    Garmin/Strava as a supported (optional) data source.
  - **Test:** `npm run build` produces the packaged skill with the bumped
    version stamped in `SKILL.md`'s frontmatter; `CHANGELOG.md` has the new
    entry at the top.
  - Depends on: WC5, WD2 (bump happens once the behavior behind it exists).

## Milestone W-F — Polish / deferred

- [ ] **WF1. WHOOP webhooks (optional)**
  - Verify WHOOP v2's current webhook support before starting (the API
    docs consulted for this plan state v1 webhooks were removed; v2 support
    needs reconfirming against WHOOP's current developer docs).
  - If supported: `web/app/api/whoop/webhook/route.ts` verifies the
    delivery signature and, on a "new recovery/sleep/workout available"
    event, does nothing more than mark the athlete's connection as having
    fresher data waiting (or simply calls the same sync path opportunistically) —
    it must never itself apply a coaching adjustment, per the plan's
    resolved decision #1. The next athlete-triggered `/plan` load or
    planning run is what actually interprets the data.
  - **Test:** simulate a webhook delivery and confirm the raw data lands in
    `whoop_daily_metrics`/`workout_logs` but no `coach_notes` row or
    plan-adjustment is produced until a separate, explicit athlete-
    triggered sync/read-back runs afterward.
  - Depends on: WC2, WD1.

- [ ] **WF2. Compliance view: WHOOP overlay**
  - Extend `web/app/compliance/page.tsx` (from `multi-event-and-webui-
    tasks.md`'s B7) to show WHOOP-sourced strain/HR alongside the existing
    FR3 status buckets, so a `failed_too_hard` cluster can be cross-checked
    against actual strain data where available.
  - **Test:** with mixed `web-ui` and `whoop` sourced logs for a test
    athlete, confirm the compliance view distinguishes the two sources
    (legend/label, not color alone, per the dataviz skill's status-color
    rule already followed elsewhere on this page).
  - Depends on: WD1.

- [ ] **WF3. Multi-source display note**
  - When both Garmin and WHOOP are connected in the same planning session,
    make sure the plan's Readiness line explicitly labels which source
    drove the decision (per the plan doc's decision #2), not just which
    numbers are shown — a one-line addition to the rendering rule in
    `whoop-data.md`/`garmin-data.md` plus `plan-format.md`'s Readiness-line
    example.
  - **Test:** dry-run the both-connected case from `WC5`'s test and confirm
    the rendered line reads unambiguously (e.g. "Readiness (WHOOP): …
    · Load (Garmin): …") rather than an unlabeled merge of numbers from two
    sources.
  - Depends on: WC5.

## Suggested execution order

`W-A` first (infra/schema — everything else needs the secrets and tables to
exist). `W-B` next (nothing in `W-C`/`W-D` can be tested without a real
connect/disconnect flow). `W-C` and `W-D` can then proceed in parallel once
`W-B` lands, since the daily pull and the per-workout pull are independent
code paths sharing only the same route handler file and the same
connection row. `W-E` (version bump) waits until `W-C`/`W-D`'s user-visible
behavior exists. `W-F` is fully optional and can slip past an initial
release — none of `W-A` through `W-E` depends on it.
