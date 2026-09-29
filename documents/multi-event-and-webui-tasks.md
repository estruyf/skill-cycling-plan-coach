# Multi-event coaching + web UI — task breakdown

Companion to `multi-event-and-webui-plan.md`. Breaks that plan into tasks that
can each be picked up, implemented, and verified independently. Ordered so
every task can be tested before moving to the next.

A9-A15 implement `documents/season-macrocycle-prd.md` (the long-term,
multi-phase plan structure with B/C dry-run events) — a second review PRD
alongside `agentic-coach-prd.md`, both adjusting this task list rather than
replacing it.

## Decisions locked in (resolves the plan's "Open decisions" section)

- **Hosting:** Supabase (Postgres + PostgREST + Auth) + Vercel (Next.js), as drafted.
- **Athlete scope (v1):** single-athlete. Schema stays keyed by `athlete_id` for
  future-proofing, but auth/UI logic assumes one athlete.
- **Infra provisioning:** kept as an explicit task (B1) with manual sub-steps,
  rather than assumed to already exist.
- **Status vocabulary (resolves PRD open question 2):** the five-way split —
  `completed_as_planned` / `completed_easier_than_planned` /
  `completed_harder_than_planned` / `failed_too_hard` / `skipped` — for
  `workout_logs` and `strength_logs`, as specified in the PRD's FR3.
  `nutrition_logs` gets its own simpler flag (hit/missed carb target, plus a
  hydration note) rather than reusing this vocabulary.
- **Interpretation timing (resolves PRD open question 1):** v1 surfaces
  interpretations at the next chat planning session (`SKILL.md` Step 1 reading
  logged signals back, built in B6/B8) — no rules-evaluation endpoint required
  for the core loop. A synchronous submit-time response (immediate feedback in
  the web UI) is deferred to B7 as a polish item, not a B3 requirement.

## Milestone A — multi-event coaching content

Pure skill/content work: markdown files inside this repo. No external
infra required. Ships as a `SKILL.md` version bump.

- [x] **A1. Event registry + Badlands Ultra event file**
  - Create `references/events/README.md`: registry format — event id, display
    name, aliases (for matching free-text onboarding answers), event type tag
    (e.g. `ultra-gravel`).
  - Create `references/events/badlands-ultra.md`: course profile
    (distance/elevation/terrain/climate), format rules (self-supported/
    unsupported, cutoffs, checkpoints — **flag as approximate/edition-dependent**
    since these change year to year), the specific limiters it trains for,
    event-specific session archetypes + periodization overlay, gear/logistics
    notes relevant to training, and the event's fueling delta (references
    A2's `nutrition.md` rather than duplicating it — e.g. 90–120 g/h gut
    training, desert heat/electrolyte load, multi-day/resupply-as-fuel-stop
    logistics, sleep-deprivation fueling).
  - Course specifics (exact distance, elevation, cutoffs) need to come from
    real race info, not invented — pull from the race's official site/rules
    before writing this file, and keep the approximate/edition-dependent
    caveat prominent.
  - **Test:** the registry lists `badlands-ultra` with aliases that match
    "Badlands", "Badlands Ultra", "Badlands Gravel Race"; walk through
    onboarding (A5, once written) with each alias and confirm it resolves to
    this file.
  - Depends on: none.

- [x] **A2. Shared nutrition module**
  - Create `references/nutrition.md`: daily carb periodization (by day
    type — rest/endurance/structured/long), training-day fueling,
    hydration/electrolyte guidance, race-day fueling principles.
  - **Test:** manually trace one rest day, one structured day, and one long
    day through the module and confirm each yields a concrete g/h carb
    target and hydration note, not just prose.
  - Depends on: none.

- [x] **A3. Config schema additions**
  - Edit `references/athlete-config.md`: add `targetEvent` (event id or
    `null`), `eventDate`, and derived `daysToEvent` to the field table. Note
    that `goal` is auto-populated/confirmed from the event when one is set,
    but stays free text and overridable.
  - **Test:** for a sample config with `targetEvent: "badlands-ultra"` and a
    given `eventDate`, hand-compute `daysToEvent` against a stated "today"
    and confirm the doc's description would produce that number; confirm a
    blank `goal` with an event set gets a sensible default per the doc.
  - Depends on: A1 (event id needs to exist to be a valid reference).

- [x] **A4. Onboarding: event branch, closed-choice questions, and limiter narrative**
  - Edit `references/onboarding.md` to make onboarding dynamic rather than a
    flat checklist, with every question explicitly typed:
    - **Goal branch (event question).** Add "Are you training for a specific
      event, or do you want a general training plan?" offering the supported
      list (from the A1 registry) plus "general training plan"/"no specific
      event". Unmatched event names are still captured (name + date) and fall
      back to generic ultra-endurance heuristics, per the existing design.
    - **Closed-choice questions get an explicit option list**, not
      example-style free text. Every question with a definitive/categorical
      answer (units, gender, strength default, structured-session count,
      training/group-ride days) presents a short list of options the athlete
      picks from — using the interactive picker where available, a
      lettered/numbered list otherwise — never phrased as "e.g." prose.
    - **Open-narrative question for context a category can't capture.** Add a
      prompt inviting a longer, free-form answer about physical challenges or
      limiters in the athlete's own words — e.g. "Describe anything that
      feels like it's holding you back physically on the bike: pain,
      fatigue, or power you can't seem to put down, especially on climbs or
      hard efforts." Tell the athlete a few sentences are welcome and useful,
      not just a one-word answer. Store the raw narrative (not a forced
      category) in `athlete.json`; the coach weighs it qualitatively when
      picking session/strength emphasis (`training-model.md`,
      `strength-library.md`), alongside — never instead of — the
      data-derived rider type from `rider-types.md`. This is a hypothesis to
      weigh, not a diagnosis: don't silently override the power-curve-derived
      limiter on narrative text alone.
  - **Test:** write out (or run in a scratch chat) onboarding walkthroughs
    covering: selects Badlands, says "general plan", names an untracked
    event — confirm each produces the right `athlete.json` fields and
    fallback behavior; separately, confirm every closed-choice question in
    the rewritten doc presents an explicit option list (no "e.g." prose
    stand-ins), and that a sample limiter narrative (e.g. "I feel like I'm
    dragging on climbs, pain in my lower back, can't get power down") ends up
    stored verbatim and referenced when session/strength emphasis is
    explained back to the athlete.
  - Depends on: A1, A3.

- [x] **A5. SKILL.md workflow: event resolution + countdown periodization**
  - **Superseded by A13** for the periodization branch specifically: once
    A9-A13 land, the phase (base/build/refine + deload) comes from
    `season-plan.json`, not a raw countdown computed inline here. Keep this
    task scoped to event-file resolution and the rider-type/session-priority
    override, which A13 still depends on; drop the countdown-periodization
    bullet below if A9-A13 are implemented first.
  - **Shipped scoped-down, per the note above:** implemented event-file
    resolution (already partly in place), the event-driven session-priority
    override in Step 2 (an event's "Limiters this event trains for" section
    can now override the rider-type-derived priorities, stated in the same
    one-line summary), and event-specific archetypes in Step 5 (an event
    file's own "Session archetypes + periodization overlay" section is
    usable alongside `workout-library.md`'s standard set). The
    countdown-periodization bullet below was dropped, since A9-A13 (season
    macrocycle) supersede it and it would otherwise be throwaway work.
  - Edit `SKILL.md`: config-resolution step also resolves the event file and
    countdown; the training-model step (Step 4) branches to countdown-driven
    periodization (base/build/peak/taper toward `eventDate`) when an event is
    set, instead of the generic rolling 3-build+1-taper block; rider-type
    session priorities can be overridden by the event (e.g. ultra-gravel
    deprioritizes VO2/sprint work in favor of durability, fat-max endurance,
    back-to-back long days, technical/loose-surface handling).
  - **Test:** dry-run "plan my week" for an athlete with `targetEvent` set
    10 weeks out vs. an athlete with no event, using the existing example
    plan in `plan-format.md` as the no-event baseline. Confirm the two runs
    diverge only in the event-driven athlete (correct phase label, no
    VO2/sprint sessions if event overrides say so) and the no-event athlete's
    output is unchanged from current behavior (regression check).
  - Depends on: A1, A3.

- [x] **A6. New event-driven session archetypes**
  - Edit `references/workout-library.md`: add long back-to-back days, heat
    acclimation, overnight/low-sleep simulation, loaded-bike climbing
    archetypes, plus progression rows for each.
  - **Test:** run each new archetype's spec through the existing validation
    checklist pattern already used for other archetypes in this file (target
    definition, progression steps, rotation-table placement all present).
  - Depends on: A1 (event file's session-archetype list drives which
    archetypes are needed).

- [x] **A7. Plan output format: countdown header + fueling section**
  - Edit `references/plan-format.md`: add the optional event countdown/phase
    header line (following the existing optional-line pattern used by the
    Readiness line) and a fueling subsection; add a race-day fueling/pacing
    deliverable format for use once close to the event.
  - **Test:** render a sample plan snippet with the new header line and
    fueling subsection filled in and confirm it reads consistently with the
    existing example plan in the same file.
  - Depends on: A2, A5.

- [x] **A8. Interpretation rules for logged signals**
  - Per the agentic-coach PRD (FR4): write the rule table mapping each FR3
    status to a concrete adjustment, into whichever reference file already
    governs that archetype's progression:
    - `failed_too_hard` (bike session) → don't advance that archetype's
      progression step next time it's scheduled; consider substituting an
      easier variant; note in `workout-library.md`.
    - `completed_easier_than_planned` → eligible to advance the progression
      step faster than the default rotation.
    - `skipped` (repeated on the same archetype) → explicit missed-session
      rule, not left to judgement.
    - Failed/too-hard strength session → regress load/reps next occurrence,
      per `strength-library.md`'s existing progression pattern.
  - This is documentation only — no dependency on Milestone B shipping first.
    It sits unused by the chat flow until B8 wires `SKILL.md` Step 1 to read
    logged signals back and apply these rules (see B8), but the vocabulary
    (per the "Decisions locked in" section above) is already agreed, so this
    can be written now.
  - **Test:** for a sample logged status of each kind, confirm the rule table
    gives an unambiguous adjustment (no "use judgement" left for the coach to
    interpret) and that it's stated in terms `SKILL.md` Step 1 can apply
    mechanically.
  - Depends on: none (only needs the status vocabulary, already decided
    above).

- [x] **A9. Season macrocycle model + `season-plan.json` schema**
  - Per `documents/season-macrocycle-prd.md` FR1/FR3: create
    `references/macrocycle-model.md` defining, generically (not
    Badlands-specific): the three-master-phase (Base/Build/Refine) + two
    inter-phase deload/transition blocks structure; how the season's total
    runway (start date to `eventDate`) is split across them, with slack
    absorbed into Base rather than a fourth named phase; and the
    `season-plan.json` file schema (phase list with start/end dates and a
    `deload: bool` flag, the trial-event ladder, which phase is "current").
  - **Test:** for a sample runway of 48 weeks starting today, hand-compute
    the phase/deload date ranges the doc's rule would produce and confirm
    they sum to the full runway with no gap and no fourth phase.
  - Depends on: none.

- [x] **A10. Trial-event ladder design (B/C simulated events)**
  - Per the PRD's FR2 and resolved decision (§3.2): create
    `references/trial-events.md` defining, generically, how to derive a B/C
    trial-event ladder from a target event's "Limiters this event trains
    for" section: C-events step a distance ladder; B-events step a
    limiter-fidelity ladder (the target event's specific limiters —
    elevation volume, terrain mix, overnight/sleep-deprivation, loaded-bike
    handling, etc.) culminating in one near-full-dress rehearsal early in
    Refine. Explicit that these are coach-designed standalone efforts, never
    real races the coach looks up or recommends by name — no web-search
    capability is introduced.
  - **Test:** run Badlands Ultra's limiter list (`badlands-ultra.md`)
    through the doc's method by hand and confirm it produces a ladder
    matching the PRD's example (C: ~150-200km → ~250-300km;
    B: elevation/terrain-mix event → culminating overnight rehearsal), i.e.
    the general method reproduces the specific example already agreed.
  - Depends on: none.

- [x] **A11. Badlands macrocycle + ladder instantiation**
  - Edit `references/events/badlands-ultra.md`: add a concrete instantiation
    of A9's phase model and A10's ladder method for this event specifically
    — phase length choices within the 12-14 week range, deload lengths, and
    the concrete B/C ladder (target distance/elevation/terrain/overnight
    spec per event, roughly at the points in Base/Build/Refine described in
    the PRD's §3.2 example).
  - **Test:** confirm the instantiated ladder's dates fall inside the phases
    A9's model would produce for Badlands' actual `eventDate`, and that
    each rung's spec traces to a specific limiter in this file's existing
    "Limiters this event trains for" section.
  - Depends on: A9, A10.

- [x] **A12. `season-plan-format.md`**
  - Create `references/season-plan-format.md` (parallel to
    `plan-format.md`): the rendered/human-readable format for the season
    skeleton — phase table, deload markers, trial-event ladder with
    dates/specs — plus the rule that only the current phase renders in full
    week-by-week detail (FR5) while other phases render as a one-line
    summary + their trial-event entries.
  - **Test:** render a sample season-plan snippet (one current phase in
    full, two summarized) and confirm it's visually distinguishable which
    phase is "live" versus a future outline.
  - Depends on: A9.

- [x] **A13. SKILL.md workflow: season skeleton generation + replanning**
  - Edit `SKILL.md`: add a step (alongside the existing config-resolution
    step) that generates `season-plan.json` the first time an athlete has
    `targetEvent`/`eventDate` set and none exists yet (using A9-A12); the
    weekly planning flow (Step 4) reads current phase/deload state and any
    due trial event from `season-plan.json` instead of computing phase from
    raw `daysToEvent` directly — **this supersedes the simple countdown-only
    periodization scoped in A5**, which should be marked as folded into this
    task rather than implemented separately.
  - Add the replanning trigger per PRD FR7: an athlete-reported material
    divergence (illness, missed weeks, a badly-logged trial event, a request
    to shift the event) causes the coach to update the skeleton's remaining
    phase/deload/event dates, never rewriting completed weeks. No scheduled
    or autonomous trigger, consistent with `agentic-coach-prd.md` §4.
  - **Test:** dry-run onboarding with `targetEvent`/`eventDate` set and
    confirm a `season-plan.json` is produced matching A9-A12's rules; then
    simulate an athlete reporting "I was sick for 3 weeks" and confirm only
    the remaining skeleton shifts, with prior weeks unchanged.
  - Depends on: A9, A10, A11, A12, A3.

- [x] **A14. Season-level nutrition and strength periodization**
  - Per PRD FR4: edit `references/nutrition.md` (A2) to add a fueling-target
    ramp (e.g. gut-training g/h progression) aligned to the trial-event
    ladder's dates, and `references/strength-library.md` to add a
    general-prep → max-strength → power/maintenance progression mapped onto
    Base/Build/Refine.
  - **Test:** for a sample season-plan, confirm the fueling target and
    strength phase stated for a given week match the Base/Build/Refine phase
    and nearest trial event that week falls under.
  - Depends on: A2, A9, A11.

- [x] **A15. Interpretation rules for trial-event outcomes**
  - Per PRD FR8: extend A8's rule table with trial-event-specific signals
    (e.g. a B-event logged with fueling distress adjusts the fueling ramp
    from A14 or slows the ladder; a comfortably-completed B-event can pull
    the ladder forward). Write into whichever file already governs the
    affected content (`nutrition.md` for fueling adjustments,
    `trial-events.md` for ladder-difficulty adjustments).
  - **Test:** for a sample trial-event log of each kind, confirm the rule
    table gives an unambiguous adjustment to the remaining ladder/fueling
    ramp, stated in terms `SKILL.md` Step 1 can apply mechanically (same bar
    as A8's test).
  - Depends on: A8, A10, A14.

- [x] **A16. Version bump, changelog, description updates**
  - Bump `package.json` version (breaking config shape → major bump, e.g.
    `2.2.0` → `3.0.0`).
  - Add a `CHANGELOG.md` entry at the top describing multi-event + nutrition
    + season-macrocycle support.
  - Update `SKILL.md` frontmatter `version` (or confirm the build script
    stamps it) and the `README.md`/`SKILL.md` descriptions to mention
    multi-event + nutrition + season-macrocycle support.
  - **Test:** run `npm run build`; confirm `cycling-plan-coach.skill` is
    produced and the staged `SKILL.md` inside it has `version: 3.0.0`
    stamped; confirm `CHANGELOG.md` has the new entry at the top.
  - Depends on: A1–A15 (bump happens once the content behind it exists).

## Milestone B — persistent data + web UI

Requires external infra. Sequenced exactly as the plan's phased delivery so
each phase closes a working loop before the next adds scope.

- [x] **B1. Provision infra**
  - Manual (user): create a Supabase project; record the project URL, anon
    key, and service-role key. Create a Vercel project (can stay empty for
    now, just linked to this repo or a new one for the frontend).
  - Scripted/documented once credentials exist: store the service-role key
    as an environment variable in the Claude Code environment; document the
    required env var names (e.g. in a new `docs/infra.md` or this repo's
    README) so future sessions know what to expect.
  - **Shipped via the Supabase/Vercel MCP connectors** rather than manual
    dashboard clicks: Supabase project `cycling-plan-coach`
    (`gurxzxcdxxxezwyatwlf`, `eu-west-1`) and Vercel project
    `cycling-plan-coach` (linked to this repo) both created; URL, anon/
    publishable key, and required env var names documented in
    `docs/infra.md`. The service-role key itself isn't exposed by the
    Supabase connector (by design) — `docs/infra.md` documents how to pull
    it from the dashboard and add it to the Claude Code environment.
  - **Test:** `curl` the Supabase REST endpoint (`GET {SUPABASE_URL}/rest/v1/`
    with the `apikey`/service-role header) from the Claude Code environment
    and confirm a 200/expected response — proves the env var and network
    path both work.
  - **Partially verified:** network path + API confirmed reachable this
    session with the anon key (401 "only service_role can be used here" —
    expected, proves connectivity). The full 200-with-service-role-key test
    is pending the key being added to the environment per `docs/infra.md`.
  - Depends on: none (blocked on user action).

- [x] **B2. Schema + RLS policies**
  - **Turned out not to be blocked on `SUPABASE_SERVICE_ROLE_KEY`**, despite
    the earlier callout in `docs/infra.md`: `apply_migration`/`execute_sql`
    authenticate via the Supabase MCP connector's own project-scoped token
    (independent of that env var), and RLS enforcement was verified from
    outside using the already-known, safe `SUPABASE_ANON_KEY` instead. See
    `docs/infra.md`'s "Schema + RLS (B2 — done)" section for the full
    writeup and what's still deferred to B3 (a real per-athlete auth
    session — needed for the literal two-authenticated-users RLS test,
    not for confirming policies are live).
  - Wrote the SQL migration
    (`supabase/migrations/20260926171317_initial_schema.sql`) creating the
    seven tables from the plan: `athletes`, `events`,
    `plans`, `workouts`, `workout_logs`, `nutrition_logs`, `strength_logs`,
    with the columns listed in the plan doc's schema table.
  - **`athletes` columns must be reconciled against the current
    `references/athlete-config.md` field table, not the plan doc's original
    sketch** ("mirrors today's `athlete.json` — identity, goal, physiology,
    preferences"): onboarding has grown substantially since that sketch was
    written (cycling background, ultra-distance history, body composition,
    a deeper strength background, nutrition preferences, the physical-limiter
    narrative and its structured follow-ups, energy-availability signals) —
    roughly 30 fields as of this writing, versus the handful the plan
    anticipated. Decide at implementation time which self-reported free-text
    fields (`physicalNotes`, `fuelingNotes`, `strengthCurrentLifts`,
    `strengthInjuryNotes`, `currentEatingPatternNotes`, `longestEffortCompleted`,
    `labTestingNotes`) stay as text columns versus which structured/enum
    fields get proper typed columns — this is a real design decision the
    plan doc doesn't resolve, not a mechanical column-for-column port.
  - Per the agentic-coach PRD (FR3): add a `status` enum column to
    `workout_logs` and `strength_logs` (`completed_as_planned` /
    `completed_easier_than_planned` / `completed_harder_than_planned` /
    `failed_too_hard` / `skipped`, per the "Decisions locked in" vocabulary
    above) and a simpler hit/missed-target + hydration flag on
    `nutrition_logs`.
  - Per FR5: add a `coach_notes` table (or column on the log rows) keyed to
    the triggering log row, to hold the surfaced interpretation text so it's
    visible in the web UI without waiting for the next chat.
  - Added RLS policies scoped by `athlete_id` (kept even in single-athlete
    v1, per the plan's future-proofing rationale): one `auth.uid() =
    athlete_id` policy per table (`auth.uid() = id` on `athletes`).
  - **Test — done:** applied the migration to the Supabase project; confirmed
    all 8 tables + columns exist via `list_tables` (including the status
    enums and `coach_notes`); confirmed an invalid status value is rejected
    by the enum constraint; inserted two dummy athletes + child rows and
    confirmed an anon-key REST call sees zero rows on any table and an
    anon-key write is rejected with a `42501` RLS violation — proving the
    policies are live, not just declared. Test data cleaned up afterward.
    Deferred to B3: the literal "two different logged-in athletes only see
    their own rows" version of this test, which needs a real Supabase Auth
    session (no login flow exists yet). See `docs/infra.md` for the full
    verification writeup.
  - Depends on: B1.

- [x] **B3. Core loop, minimal**
  - Update the skill so it posts a generated plan + its workouts to the API
    (via `curl` + service key) instead of, or alongside, local files.
  - Build a bare-bones Next.js page on Vercel listing the current week's
    workouts with a completion action that writes to `workout_logs`. Per
    FR3, this is a status picker (the five-way vocabulary), not a plain
    "mark complete" toggle.
  - Per FR5/FR6 (v1 = next-chat surfacing, per "Decisions locked in" above):
    no rules-evaluation endpoint is required here — the status just needs to
    be captured and stored so B8 can read it back. (A submit-time inline
    response is deferred to B7.)
  - **Shipped:** `web/` — a bare-bones Next.js (App Router/TypeScript) app
    with Supabase Auth magic-link sign-in and a `/plan` page listing the
    current week's workouts with the five-way status picker, writing to
    `workout_logs`. Vercel project reconfigured (`rootDirectory: "web"`,
    `framework: "nextjs"`, `NEXT_PUBLIC_SUPABASE_URL`/
    `NEXT_PUBLIC_SUPABASE_ANON_KEY` set) and deploying from this repo.
  - **The skill's posting side turned out not to need `curl` + the
    service-role key**, same shape of surprise as B2: `SKILL.md`'s new
    "Step 7 - sync to Supabase" upserts `plans`/`workouts` via the Supabase
    MCP connector's `execute_sql` (its own project-scoped token, not
    subject to RLS) when running inside Claude Code; the `curl` +
    service-role-key path is documented in `docs/infra.md` as the fallback
    for a hypothetical non-MCP deployment. Gated on a new
    `athlete.json` field, `supabaseAthleteId` (`references/athlete-config.md`)
    — `null` until the athlete has signed in at the web app at least once,
    in which case Step 7 is skipped entirely and nothing changes from
    local-files-only behavior.
  - **Test — partially done, one step needs David:** the end-to-end test as
    written needs a real signed-in athlete, which needs a real magic-link
    email round-trip this session can't complete (no inbox access). Instead
    verified the exact RLS-scoped queries/writes the frontend and skill use
    against two dummy athletes, simulating each one's authenticated session
    via `set_config('request.jwt.claims', ...)` (the same mechanism
    PostgREST itself uses) — the literal two-different-authenticated-
    athletes scoping test B2 explicitly deferred: athlete A's `select` on
    `plans` returns only their own row, a direct count against athlete B's
    row returns 0, athlete A's `insert` into `workout_logs` on their own
    workout succeeds, and the same insert against athlete B's workout is
    rejected with `42501`. All test rows cleaned up afterward. `npm run
    build`/`npm run lint` pass in `web/`; `/login` and `/plan` were smoke-
    tested unauthenticated against a local dev server. **Still open:**
    David needs to visit the deployed web app once and sign in via magic
    link, then the resulting Supabase Auth user id needs setting as his
    `supabaseAthleteId` — see `docs/infra.md`'s "Linking bootstrap" — before
    the fully real version of this test (and B4/B5/B8's tests, which all
    build on a linked account) can run.
  - Depends on: B2.

- [x] **B4. Nutrition logging UI**
  - **Shipped:** `web/app/nutrition/page.tsx` — a daily entry form (date,
    carbs, calories, hit/missed carb target, hydration note, body weight,
    free notes) plus a history view (most recent 30 days), writing to
    `nutrition_logs` via an upsert keyed on the table's existing
    `(athlete_id, log_date)` unique constraint — logging the same day twice
    edits that day's row rather than erroring or duplicating. Nav links
    added between `/plan` and `/nutrition`. `lib/types.ts` gained
    `NutritionLog`/`CarbTargetStatus` types mirroring the migration.
  - Updated `SKILL.md` Step 1: when `supabaseAthleteId` is set, reads back
    the last 7-14 days of `nutrition_logs` (same `execute_sql`-via-MCP
    approach as Step 7) and folds the `carb_target_status` split and any
    hydration/notes text into this run's fueling guidance, calling out a
    repeated `missed`/hydration pattern explicitly rather than absorbing it
    silently. Added as quality-check 10.
  - **Test — same shape of partial as B3, for the same reason:** the
    literal test (log 3 days via the UI, then run the skill and check the
    plan references it) needs a real signed-in, linked athlete, which is
    still blocked on David's one-time linking step from B3
    (`docs/infra.md`'s "Linking bootstrap") — not something this session can
    complete without inbox/browser access to a real magic-link sign-in.
    Instead verified the exact DB-layer behavior the UI and skill depend on,
    using the same `set_config('request.jwt.claims', ...)`-simulated-auth
    technique as B2/B3 (two dummy athletes, cleaned up after): athlete A's
    upsert of the same `log_date` twice (hit → missed, with a hydration
    note) updates one row rather than duplicating it; three distinct days
    land as three rows, one of them `missed`, matching the test's "3 days,
    at least one missed" shape; athlete B sees `0` of athlete A's rows and a
    write attempt against athlete A's row is rejected `42501`; an invalid
    `carb_target_status` value is rejected by the check constraint. `npm
    run build`/`npm run lint` pass in `web/`; `/nutrition` and `/plan` were
    smoke-tested unauthenticated against a local dev server (both return
    200 and render the client-side loading/sign-in state, same pattern as
    B3). **Still open, same blocker as B3:** once David completes the
    linking bootstrap, the full round-trip (real UI entry → skill reads it
    back → plan summary reflects it) should be re-run for real.
  - Depends on: B3.

- [x] **B5. S&C logging UI**
  - Add the same log/view pattern for `strength_logs` (sets/reps/load done,
    notes), including the FR3 status field (at minimum
    completed-as-planned / failed-too-hard / skipped for strength sessions).
  - **Shipped:** `web/app/strength/page.tsx` — a session entry form (session
    name, the full five-way FR3 status vocabulary reusing `SESSION_STATUSES`
    rather than a narrower subset, a repeatable exercise row of
    exercise/sets/reps/load-kg, and free notes) plus a history view (most
    recent 30), inserting into `strength_logs` (`sets_reps_load` stored as
    `{ exercises: [...] }`, matching the "exercise name, sets x reps, load"
    shape already used in `strength-library.md`). `workout_id` is left
    unset — like `nutrition_logs`, this is a standalone daily/session entry,
    not tied to a specific scheduled `workouts` row. Nav links added between
    `/plan`, `/nutrition`, and `/strength`. `lib/types.ts` gained
    `StrengthLog`/`ExerciseEntry` types mirroring the migration.
  - **Test — same shape of partial as B3/B4, for the same reason:** the
    literal test (log a failed/too-hard session via the UI, confirm it
    shows up in history) needs a real signed-in, linked athlete — still
    blocked on David's one-time linking step from B3
    (`docs/infra.md`'s "Linking bootstrap"). Instead verified the exact
    DB-layer behavior the UI depends on, using the same
    `set_config('request.jwt.claims', ...)`-simulated-auth technique as
    B2/B3/B4 (two dummy athletes, cleaned up after): athlete A's insert of a
    `failed_too_hard` session with two exercises (sets/reps/load-kg) succeeds
    and round-trips the exact `sets_reps_load` JSON shape the UI sends;
    athlete B sees `0` of athlete A's `strength_logs` rows; an insert
    impersonating athlete A's `athlete_id` while authenticated as athlete B
    is rejected `42501`. `npm run build`/`npm run lint` pass in `web/`;
    `/strength` was smoke-tested unauthenticated against a local dev server
    (200, renders the client-side loading/sign-in state, same pattern as
    B3/B4). **Still open, same blocker as B3/B4:** once David completes the
    linking bootstrap, the full round-trip (real UI entry → history view)
    should be re-run for real.
  - Depends on: B3.

- [x] **B6. Fold in Milestone A on top of the data layer**
  - Wire the multi-event/nutrition logic from Milestone A into the DB-backed
    flow: `events` table gets populated from `targetEvent`/`eventDate`;
    `plans` rows carry the current season-macrocycle `phase`
    (base/build/refine, plus a `deload` flag) sourced from `season-plan.json`
    (A9-A13) instead of only appearing in local markdown.
  - **`plans.phase`/`deload` turned out to already be wired from B3**: Step
    7's `plans` upsert already carried these columns, sourced from Step 4's
    `season-plan.json`-resolved `currentPhaseId` (never trusted stale, per
    the season-skeleton resolution step). The actual gap closed here was the
    `events` table, which nothing wrote to yet.
  - **Shipped:** `SKILL.md` Step 7 gained a new item 2 — when
    `targetEvent`/`eventDate` are both set, delete any existing `events` rows
    for the athlete and insert one fresh row (`event_key` when the registry
    matched, else `null`; `event_name`; `event_date`). Delete-and-reinsert
    rather than a stored-id upsert, matching the single-current-event
    assumption `season-plan.json` already makes (v1 tracks one target event
    per athlete, not a history) — no schema migration needed. Added quality
    check 11 for this. `web/lib/types.ts` gained an `Event` type; `/plan`
    (`web/app/plan/page.tsx`) now reads the athlete's `events` row and
    renders an event-countdown line ("N days to \<event\> · Phase: \<Phase\>
    (deload)") above the existing week/focus line, in the same wording as
    `plan-format.md`'s countdown header, falling back to the pre-existing
    phase-in-the-week-line rendering when no event is set.
  - **Test — done:** the literal end-to-end version (run the skill for a
    real athlete with `targetEvent` set, check the deployed frontend) is
    still blocked on David's one-time linking step from B3/B4/B5
    (`docs/infra.md`'s "Linking bootstrap"). Verified instead, the same way
    as B2-B5: two dummy athletes, `set_config('request.jwt.claims', ...)`
    simulating each one's authenticated session, all test rows cleaned up
    after. Athlete A's delete-then-insert of an `events` row (mirroring what
    Step 7 now does) succeeds and is the only row A's own `select * from
    events` returns; athlete B's `select` on `events` returns `0` rows;
    an insert impersonating athlete A's `athlete_id` while authenticated as
    B is rejected `42501`. `npm run build`/`npm run lint` pass in `web/`
    (build requires `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`
    to be set, same as B3-B5). **Still open, same blocker as B3-B5:** once
    David completes the linking bootstrap, run the skill for real with
    `targetEvent`/`eventDate` set and confirm the `/plan` page's countdown
    line matches `season-plan.json`.
  - Depends on: Milestone A complete, B3.

- [x] **B9. Season macrocycle persistence in the DB**
  - Per `documents/season-macrocycle-prd.md` §3.3/§5: once the file-based
    `season-plan.json` (A9) has been in real use, design and migrate its
    schema into Supabase — either a `season_plans` table (one row per
    athlete's current skeleton, phases/deloads/ladder as JSON columns or
    normalized child tables) or an extension of `plans`/`events`. Not
    designed now — explicitly deferred until after B6/B8 ship and the
    file-based schema has proven itself, per the "local file now, DB later"
    decision.
  - **On the "proven itself in real use" precondition:** by the time this was
    picked up, B6/B8 had shipped, but no real athlete (David included) had
    actually run the skill with a `targetEvent`/`eventDate` set — checking
    `auth.users` this session found he'd completed the linking bootstrap's
    step 1 (a real magic-link sign-in exists) but not steps 2-3 (setting
    `supabaseAthleteId`, then a real weekly-planning run), and there is no
    real `season-plan.json` anywhere to migrate. Getting a real one required
    a real onboarding conversation in David's own Claude client (this
    dev-repo session can't reproduce the native skill experience — no
    interactive picker, no Strava connector, not the packaged skill) —
    David's explicit call was to skip that and build B9 now regardless,
    using the same simulated-dummy-athlete pattern B1-B8 already relied on
    wherever the literal real-athlete test wasn't available.
  - **Shipped:** `season_plans` table
    (`supabase/migrations/20260926210000_season_plans.sql`) — one row per
    athlete's *current* skeleton (`unique (athlete_id)`, upserted in place on
    replan rather than versioned, the same single-current-skeleton
    assumption `events` already makes). `phases` (a `jsonb_array_length(phases)
    = 5` check constraint enforces the fixed Base/Deload/Build/Deload/Refine
    shape) and `trial_events` are JSONB columns rather than normalized child
    tables — both are small, fixed-shape documents always read/written whole
    and never queried by sub-field, so normalizing would add join overhead
    with no query benefit. Field names inside the JSON are snake_case
    (`start_date`, `target_date`, `loaded_bike`, `completion_status`, etc.),
    following this repo's existing `strength_logs.sets_reps_load` precedent
    rather than `season-plan.json`'s own camelCase, since these are DB
    column contents, not the local file. `SKILL.md`'s Step 7 gained item 3
    (upsert `season_plans` whenever a `season-plan.json` was resolved this
    run, translating each field to its snake_case shape, skipped entirely
    when no skeleton exists) and quality check 13. `web/app/season/page.tsx`
    is new: header block (event, days-to-go, current phase), a 5-row phase
    table (current phase highlighted), and a trial-event ladder table with
    logged-outcome summaries beneath it — mirroring
    `references/season-plan-format.md`'s rendering — linked from `/plan`'s
    nav whenever an `events` row exists. `web/lib/types.ts` gained the
    `SeasonPlan`/`SeasonPlanPhase`/`TrialEvent`/`TrialEventSpec`/
    `TrialEventOutcome` family of types and label maps.
  - **Test — done, via simulation (see above for why not the literal
    real-athlete version):** built one dummy athlete's `season_plans` row
    from the exact 48-week Badlands Ultra worked example already validated
    by hand in `macrocycle-model.md`/`trial-events.md`/
    `season-plan-format.md` (Base 20wk/Deload 1wk/Build 13wk/Deload 1wk/
    Refine 13wk, the 4-rung C1/C2/B1/B2 ladder, C1 already logged
    `completed_as_planned`), plus a second dummy athlete for the
    cross-athlete checks, all cleaned up after. Confirmed: the
    `jsonb_array_length(phases) = 5` check constraint rejects a malformed
    (1-entry) phases array; athlete A's authenticated `select` returns
    exactly their own row; athlete B's authenticated `select` returns `0`
    rows; an insert impersonating athlete A's `athlete_id` while
    authenticated as athlete B is rejected `42501`; an `insert ... on
    conflict (athlete_id) do update` (the shape a real replan takes) updates
    the existing row in place — the row count for that athlete stays `1`
    and the updated `phases`/`last_replanned_at` reflect the new values, not
    a second row. `get_advisors(type: security)` shows no new findings from
    this migration. `npm run build`/`npm run lint` pass in `web/`; `/season`
    and `/plan` were smoke-tested unauthenticated against a local prod
    server (both 200, rendering the client-side sign-in state, same pattern
    as B3-B7). **Still open:** the literal test as originally scoped —
    migrate one *real* athlete's `season-plan.json` and confirm `/season`
    matches it with no loss of information — needs David to complete the
    remaining linking-bootstrap steps (`docs/infra.md`) via a real
    onboarding conversation in his own Claude client with `targetEvent`/
    `eventDate` set, then a re-run of this same comparison for real.
  - Depends on: B6, A9 (schema must exist and be in use before it's worth
    migrating).

- [x] **B8. Signal interpretation wired into the coaching flow**
  - Per the agentic-coach PRD (FR4/FR5/FR8): update `SKILL.md` Step 1 (data
    pull) to read back the FR3 status fields on recent `workout_logs` /
    `strength_logs`, apply the A8 rule table, and state any resulting
    adjustment explicitly in the plan's last-week summary line (not left
    implicit in "factor last week's load").
  - Write the resulting interpretation to the `coach_notes` table/column
    (B2) keyed to the triggering log row, so it's visible in the frontend
    without waiting for the next chat, per FR5.
  - **Shipped:** `SKILL.md` Step 1 gained a new sub-step (alongside the
    existing `nutrition_logs` read-back from B4) — when `supabaseAthleteId`
    is set, read back the last 3-4 weeks of `workout_logs` (joined to
    `workouts` for `archetype`/`day`/`target`) and `strength_logs`, and apply
    `references/workout-library.md`'s / `references/strength-library.md`'s
    existing "Logged-outcome rules" tables (written in A8, previously
    unused/dormant since no reader existed) to determine the adjustment at
    each archetype's/exercise's next scheduled occurrence — stated
    explicitly in the run's last-week summary line, per FR8. Step 3
    (strength selection) and Step 5 (bike archetype selection) now point at
    this interpretation instead of the plain default-advance rule. Both
    reference files' "until logged data exists, this table is unused"
    caveat was updated to describe the live read-back path instead. Step 7
    (Supabase sync) gained item 5: for every interpreted log lacking a
    `coach_notes` row yet, insert one (checking first, so a rerun never
    duplicates a note for the same log id) — the mechanism that satisfies
    FR5. `web/app/plan/page.tsx` gained a "Coach notes" section (most recent
    10, newest first) so a written note is visible in the frontend;
    `web/lib/types.ts` gained a `CoachNote` type mirroring `coach_notes`.
  - **Test — same shape of partial as B3-B6, for the same reason:** the
    literal end-to-end version (log `failed_too_hard` via the deployed
    frontend, run the skill for real, check the next plan and the frontend)
    is still blocked on David's one-time linking step from B3
    (`docs/infra.md`'s "Linking bootstrap"). Instead verified the exact
    DB-layer behavior Step 1/Step 7 depend on, using the same
    `set_config('request.jwt.claims', ...)`-simulated-auth technique as
    B2-B6 (one dummy athlete with a logged `failed_too_hard` workout and a
    logged `failed_too_hard` strength session, a second dummy athlete for
    the cross-athlete checks, all cleaned up after): the exact
    `workout_logs` join `workouts` query Step 1 now runs returns the
    archetype/day/target alongside the logged status; the dedup-insert
    (`insert ... where not exists (select 1 from coach_notes where
    workout_log_id = ...)`) creates exactly one `coach_notes` row on first
    run and is confirmed a no-op (count stays `1`) when re-run, matching
    "never insert a second note for the same log id"; the same pattern was
    repeated for a `strength_log_id`-keyed note. Athlete B's `select` on
    `coach_notes` returns `0` rows, and an insert impersonating athlete A's
    `athlete_id` while authenticated as athlete B is rejected `42501`. `npm
    run build`/`npm run lint` pass in `web/`. **Still open, same blocker as
    B3-B6:** once David completes the linking bootstrap, the full
    round-trip (real `failed_too_hard` log via the web UI → next real
    weekly planning run → progression held + summary states why + note
    visible on `/plan`) should be re-run for real, for both a bike session
    and a strength session.
  - Depends on: A8, B2, B3, B5.

- [x] **B7. Polish**
  - Add an event countdown view, a compliance/trend view driven by the FR3
    status history (e.g. share of sessions landing as-planned vs.
    harder-than-planned vs. failed, per archetype), and a taper/race-week
    view to the frontend.
  - Optionally add a submit-time rules-evaluation endpoint so a logged
    status produces an inline "here's what that means" response immediately
    (FR6 option (a)), rather than only surfacing at the next chat — deferred
    here per the "Decisions locked in" section above.
  - **Shipped:** three additions to `web/`, no schema changes (all three read
    data B1-B8 already sync):
    - **Event countdown view:** `web/app/plan/page.tsx`'s existing one-line
      countdown was promoted to a dedicated `EventCountdownCard` component —
      a bigger days-to-go figure, event name, and a phase/deload pill —
      still sourced from the same `events`/`plans` rows.
    - **Compliance/trend view:** new page `web/app/compliance/page.tsx`.
      Reads back `workout_logs` (embedded-joined to `workouts` for
      `archetype` via PostgREST's resource embedding, `select("status,
      created_at, workouts(archetype)")`) and `strength_logs`, and buckets
      FR3 status counts three ways: by bike archetype, by strength session
      name, and by ISO 8601 week (bike + strength combined) for the trend
      view. Each bucket renders as a horizontal stacked bar plus an
      always-present data table underneath (the accessible fallback, and
      the only place the full 5-way status split survives — the bar
      collapses to 4 severity roles, below). Status colors follow the
      dataviz skill's fixed status palette rather than an arbitrary
      categorical one, since FR3 status inherently means "did this go
      well": `completed_as_planned`/`completed_easier_than_planned` →
      good, `completed_harder_than_planned` → warning, `skipped` →
      serious, `failed_too_hard` → critical (this session's mapping,
      documented in `lib/types.ts`'s `STATUS_ROLE`/`STATUS_ROLE_COLOR`
      alongside the existing `SESSION_STATUSES`) — always paired with a
      legend swatch + label and a native hover tooltip, never color alone,
      per the skill's status-color rule. Direct in-segment labels only
      render when a segment is wide enough (>=15%) to hold them, per the
      skill's "never a number that gets clipped" rule.
    - **Taper/race-week view:** a `TaperBanner` on `/plan`, shown only
      inside an explicit window this session defined against
      `macrocycle-model.md`'s "Refine's final block is race week itself"
      (no stored sub-phase field exists to read a taper window from
      instead): the final 7 days up to and including `eventDate` render a
      "Race week" banner, the 7 days before that a "Taper" banner: outside
      `[eventDate - 13, eventDate]` nothing renders. Documented inline as
      this session's explicit reading, since no reference file states a
      numeric taper length.
  - **Test:** the literal manual UI walkthrough needs a real signed-in,
    linked athlete with >= 2 weeks of varied logged data — still blocked on
    David's one-time linking step from B3 (`docs/infra.md`'s "Linking
    bootstrap"). Verified what this session could without it: the ISO-week
    bucketing helper against four hand-picked edge cases (a mid-year Monday,
    a Jan 1st that lands in week 1, a Dec 29th that's already week 1 of the
    following ISO year, and the 2020-W53 edge case) in a standalone Node
    script; the PostgREST embedded-resource query syntax
    (`workouts(archetype)`) against the real project with the anon key
    (`curl`, no session -- 200 with an empty array, confirming the
    relationship embed is accepted rather than a 400 "no relationship
    found," the distinguishing signal available without a real login);
    `/plan` and `/compliance` smoke-tested unauthenticated against a local
    dev server (both render the sign-in prompt, same pattern as B3-B6); and
    a static-HTML re-creation of the stacked-bar/table markup and the
    countdown/banner cards, screenshotted with the pre-installed Playwright
    Chromium, to eyeball label placement (the <15% segment correctly hides
    its label), color legibility (dark ink on the yellow `warning` segment,
    white on the other three), and the race-week/taper banner styling.
    `npm run build`/`npm run lint` pass in `web/`. **Still open, same
    blocker as B3-B6:** once David completes the linking bootstrap, log a
    genuinely mixed >= 2-week history and re-run the walkthrough against the
    real deployed pages; also confirm the taper/race-week window reads
    right for a real `eventDate` inside it.
  - Depends on: B4, B5, B6, B8.

## Suggested execution order

Milestone A (A1→A16) can ship on its own as a skill release. Within Milestone
A, A9-A15 (season macrocycle: model, ladder, Badlands instantiation, format,
`SKILL.md` wiring, nutrition/strength periodization, trial-event
interpretation) depend on A1-A3 and A8 as noted per-task, and should land
after A1-A8 for the same reason A9's version bump always lands last — they
build on the event/nutrition/strength content those tasks establish. Milestone
B can start in parallel from B1 once Supabase/Vercel accounts exist, but B6,
B8, and B9 specifically need Milestone A finished first (B6 needs the
season-macrocycle content, B8 needs A8's rule table, B9 needs A9's file-based
schema proven in use) — everything else in B is independent of A.
