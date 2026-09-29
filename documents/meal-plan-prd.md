# Weekly meal plan — PRD

Status: draft, for review. Written after the athlete (David) confirmed a gap:
the coach sets daily fueling *targets* (`references/nutrition.md`'s g/kg
tables) but never translates them into an actual meal-by-meal list of foods.
This PRD scopes turning those targets into a real, dynamic weekly meal plan.
Tracked as issue [#46](https://github.com/macken04/skill-cycling-plan-coach-dm/issues/46),
which this PRD's own scope (§4.1-4.4) is written against. Issue
[#45](https://github.com/macken04/skill-cycling-plan-coach-dm/issues/45)
(opened separately, per-item structured feedback with its own
`meal_recommendations`/`meal_feedback` tables and rating UI) is this PRD's
phase 2 (§3 item 4) — #46 blocks #45, since #45's own phasing notes it needs
itemized meal recommendations to exist first.

## 1. The brief

A full, well-designed meal plan that meets the week's fueling goals — not
just macro targets restated in prose. It must be **dynamic**: it changes
week to week based on the athlete's own feedback (what they liked, disliked,
couldn't finish, didn't have time to make, or reacted badly to). Getting
there also means onboarding needs new questions — the coach doesn't
currently collect what it would need to build a real meal plan (cooking
time/ability, meal/snack pattern, cuisine preferences), only what it needs to
set macro targets and steer on-bike fueling *suggestions*.

## 2. Gap analysis: existing plan/codebase vs. the brief

- **`references/nutrition.md`** defines daily carb g/kg by day type, on-bike
  g/h rates, hydration/sodium — all targets and rates, never concrete foods
  or meals. `dietaryRestrictions`/`fuelingPreference`/`fuelingNotes` steer
  on-bike *suggestions* qualitatively but don't drive any structured output.
- **`references/plan-format.md` §6 (Fueling)** just restates the g/kg/g-h
  numbers from `nutrition.md` in one bullet list. No breakfast/lunch/dinner/
  snack structure exists anywhere in the shipped output.
- **`references/onboarding.md` §9** collects `dietaryRestrictions`,
  `fuelingNotes`, `fuelingPreference`, `currentEatingPatternNotes`,
  `currentWeightGoalDirection` — enough to steer on-bike product suggestions
  and flag an energy-availability caution, but nothing about how many
  meals/snacks the athlete eats, how much time/skill they have to cook, or
  what food/cuisine they actually like versus tolerate. That's the specific
  gap the brief calls out.
- **No food/meal-content library exists anywhere.** `workout-library.md` and
  `strength-library.md` are this repo's pattern for "a library of
  archetypes/exercises this skill assembles into a plan" — nothing analogous
  exists for food. Building meals requires this repo to own some minimal
  food-content model, but per the FatSecret/Cronometer research
  (`documents/fatsecret-integration-plan.md`,
  `documents/cronometer-integration-plan.md`) this repo has deliberately
  chosen **not** to build or maintain a real food database — that's the
  whole reason those integrations were scoped against external providers.
  This PRD has to resolve that tension (see §3.1).
- **`nutrition_logs`** (`supabase/migrations/20260926171317_initial_schema.sql`)
  stores `carbs_g`, `calories`, `carb_target_status` (hit/missed),
  `hydration_note`, `body_weight_kg`, `notes` — a numeric-adherence log, not
  meal-level feedback. There is no field for "which meal," "did you like
  it," "did you have time," or "did it cause GI distress." The brief's
  "dynamic based on feedback" requirement has nowhere to land today.
- **The existing "logged-outcome" pattern is the right precedent, not a new
  invention.** `workout-library.md`'s "Logged-outcome rules" table
  (adjusting the next scheduled occurrence of an archetype from a logged
  status) and `strength-library.md`'s equivalent are exactly the shape a
  meal-feedback loop should take — this PRD proposes the same mechanism
  applied to meals rather than sessions.
- **FatSecret/Cronometer are a different, already-scoped problem.** Both
  docs are about connecting to an athlete's *external diary app* to read
  actual logged intake and (for FatSecret) push a plan as a "saved meal."
  Neither is a meal-content generator, and FatSecret's own research notes
  there's no true recipe-authoring endpoint on that API either way. This
  PRD's meal-library content is independent of whether either connector
  ever ships — it's this repo's own generated content, exactly as ZWO
  workouts are, regardless of whether Strava/Garmin/WHOOP happen to be
  connected.

## 3. Resolved decisions

These are the design calls made writing this PRD (not yet confirmed by the
athlete) — flagged here instead of left implicit, same as the format
`season-macrocycle-prd.md` §3 uses for its own pre-resolved decisions. Treat
every one of these as open for pushback; §6 lists the ones with real
alternatives worth a deliberate answer rather than a default call.

1. **No food database, no new external dependency.** Meal content is built
   from a small, self-contained **meal-building-block library**
   (`references/meal-library.md`) — common foods grouped by category
   (grain/starch, protein, fat, fruit/veg, dairy/alt) with approximate
   macros per portion, tagged against `dietaryRestrictions` — the same
   pattern `workout-library.md` uses for sessions rather than a real
   exercise database. This keeps the feature fully self-contained and
   portable (no athlete has to connect anything to get a meal plan), and
   stays consistent with the "we don't own a food database" position
   already reasoned through in the FatSecret/Cronometer docs.
2. **Templated by day type, not bespoke per calendar day.** Meals are built
   per **day type** — Rest / Endurance / Structured-or-key / Long, the same
   four buckets `nutrition.md`'s carb table already uses — then the week's
   actual 7 days are mapped onto whichever template matches that day's
   session. Building 7 fully bespoke days by hand every week doesn't scale
   as a maintainable weekly-authoring task; day-type templates do, and stay
   trivially consistent with the targets `nutrition.md` already defines.
3. **Meal planning is opt-in**, a new boolean-ish field on `athlete.json`
   (default unset/off for existing athletes; asked plainly at onboarding for
   new ones). Some athletes will want targets and on-bike guidance only and
   manage their own meals or another app — the existing skill already
   respects an equivalent opt-out shape for strength (`strengthDefault:
   "none"`), so this follows precedent rather than forcing new output on
   everyone.
4. **Feedback loop ships in two phases; only phase 1 is in this PRD's
   scope.** Phase 1 (in scope here): a narrative question folded into the
   weekly intake, interpreted the same way `physicalNotes`/`fuelingNotes`
   already are — a hypothesis from the athlete's own account, applied to
   next week's meal selection, adjustment stated explicitly. This works for
   every athlete immediately, including local-files-only ones with no
   `supabaseAthleteId`, and needs no schema change. Phase 2 (explicitly a
   non-goal here, §5) — structured per-meal logging via a new Supabase table
   and web UI, feeding a `workout-library.md`-style "logged-outcome" rule
   table — is a natural fast-follow once phase 1 is proven out, already
   tracked as issue #45 rather than needing a new future PRD/tasks doc
   invented here.
5. **Approximate, coaching-register precision — not clinical accuracy.**
   Meals target each day type's carb/protein/fat/kcal figures from
   `nutrition.md` within a stated tolerance (±10%, per §7), assembled from
   the meal-library's approximate per-portion macros. This is the same
   register the rest of the skill already uses (g/kg ranges, not exact
   grams) and `nutrition.md`'s own existing caveat — "not a substitute for
   individualized medical or dietetic advice" — carries over unchanged.

## 4. Functional requirements

### 4.1 Onboarding additions (`references/onboarding.md`, `athlete-config.md`)

- **FR1.** A new short section, same tier as the existing nutrition
  questions (§9), all optional/skippable per the onboarding flow's existing
  conventions:
  - **[choice]** opt in to a full weekly meal plan, or targets/guidance
    only. Stored as `mealPlanEnabled` (bool).
  - *(only if opted in)* **[choice]** meals/snacks pattern — e.g. 3 meals +
    2 snacks, 3 meals no snacks, grazing/no fixed pattern. Stored as
    `mealPattern`.
  - *(only if opted in)* **[choice]** cooking time/batch-prep constraints —
    e.g. cooks fresh most days, batch-cooks on set days, minimal-time
    weekdays only. Stored as `cookingConstraints`.
  - *(only if opted in)* **[narrative]** cuisines/foods genuinely enjoyed,
    and any beyond `dietaryRestrictions` actively disliked. Stored as
    `foodPreferences` (verbatim, empty string if skipped) — distinct from
    `dietaryRestrictions`, which is restrictions only, not preference.
  - None of these are write-once, same principle already stated for every
    other self-reported field in `onboarding.md` — update on the spot when
    the athlete mentions a change.
- **FR2.** The existing `dietaryRestrictions`, `fuelingPreference`, and
  `currentEatingPatternNotes` fields (already collected today, currently
  read only qualitatively) become real inputs to meal-library selection —
  no new onboarding question needed for these three, just a new consumer.

### 4.2 Meal-building-block library (new reference file)

- **FR3.** `references/meal-library.md` defines a small set of common food
  items grouped by category (grain/starch, protein, fat/dairy, fruit/veg,
  fluids) with approximate macros per stated portion, each tagged against
  the `dietaryRestrictions` values it's compatible with (mirroring how
  `workout-library.md` tags event-overlay archetypes by phase applicability).
- **FR4.** Per-day-type meal templates (breakfast, lunch, dinner, snacks,
  plus the on-bike/post-ride fueling `nutrition.md` already specifies)
  assembled from those blocks, sized to land within the stated tolerance of
  that day type's carb/protein/fat/kcal target from `nutrition.md`'s table.
- **FR5.** Cuisine/preference personalization (from FR1/FR2) swaps which
  blocks fill a template's slots without changing the target macros the
  template is built to hit — e.g. a `vegan` athlete's protein slot draws
  from plant sources, a `mostly real food` `fuelingPreference` biases the
  on-bike slot away from gels, without needing a different template per
  preference combination.
- **FR6.** A **"Logged-feedback rules" table** in `meal-library.md`, same
  shape as `workout-library.md`'s "Logged-outcome rules" — disliked/
  GI-flagged/too-time-consuming items get swapped for an alternative
  from the same category+tag on their next scheduled occurrence; a
  liked/no-complaint item can repeat. This is what FR9 (§4.4) reads and
  applies.

### 4.3 Weekly deliverable

- **FR7.** A new file per run, `YYYY-Wnn-meals.md` (same naming/reference
  convention as `YYYY-Wnn-strength.md`), produced in Step 6 alongside the
  existing files, containing the week's day-by-day meal list built from the
  templates in §4.2, only when `mealPlanEnabled` is true.
- **FR8.** The main plan's Fueling section (`plan-format.md` §6) gains one
  line referencing the meals file, the same way it already references a
  full strength session — it does not duplicate the meal list inline.

### 4.4 Feedback loop (phase 1 — narrative)

- **FR9.** The weekly-availability intake (`SKILL.md`, "At the start of
  every weekly planning run") gains one narrative question when
  `mealPlanEnabled` is true: how did last week's meals go — anything loved,
  disliked, couldn't finish, didn't have time for, or reacted badly to.
  Interpreted the same way `physicalNotes`/`fuelingNotes` are — a
  hypothesis from the athlete's own account — and applied via FR6's table
  when building this run's meals file.
- **FR10.** Every resulting adjustment is stated explicitly in the plan
  (e.g. "swapped Wednesday's oatmeal breakfast for the egg-based option —
  logged as disliked last week"), never silently absorbed, consistent with
  the "never left implicit" principle already running through `SKILL.md`
  (e.g. Step 1's logged-outcome interpretation for workouts).

### 4.5 Season-level tie-in

- **FR11.** When a season skeleton exists and `nutrition.md`'s
  energy-availability caution applies (`currentWeightGoalDirection: losing`
  or `bodyCompositionGoal: significantLoss`), the meals file states plainly
  where the stated deficit is being taken from (per `nutrition.md`'s
  existing guidance to concentrate it on lower-volume days) rather than
  computing a new deficit-allocation rule — this PRD adds no new nutrition
  science, only a meal-level rendering of what `nutrition.md` already says.

## 5. Non-goals (explicit)

- **No food database, no new external API dependency.** Content lives
  entirely in `references/meal-library.md`, self-contained, same trust/
  maintenance boundary as `workout-library.md`.
- **No structured per-meal logging (Supabase table + web UI) in this PRD.**
  That's phase 2, already tracked as issue #45 (§3 item 4) — this PRD's
  feedback loop is narrative-only.
- **No coupling to the FatSecret/Cronometer integration plans.** Those stay
  independent, optional connectors for actual diary sync; this feature
  never assumes either is connected, and nothing here blocks or depends on
  their (currently unimplemented) status.
- **No calorie-perfect or clinically precise nutrition.** Approximate,
  coaching-register figures within a stated tolerance, same caveat
  `nutrition.md` already states about not substituting for individualized
  medical/dietetic advice.
- **No multi-step, cook-along recipe authoring.** Meal entries are food +
  portion lists assembled from the block library, not recipes with method/
  instruction steps — the same distinction FatSecret's own "saved meal"
  primitive draws against a true recipe object.
- **No household/multi-person portioning** — single-athlete portions only
  unless §6 resolves otherwise.

## 6. Open questions

1. **Variety vs. authoring effort.** Is it acceptable for two different
   calendar days mapped to the same day type (e.g. two "Endurance" days in
   one week) to reuse the same template verbatim, or does the athlete want
   day-to-day food variety even within a repeated day type? This sizes how
   large `meal-library.md` needs to be (more variants per day type =
   more content to build and maintain) and whether the weekly run needs
   its own rotation rule (mirroring `workout-library.md`'s "never repeat
   the exact same archetype two weeks running" — but at the meal level,
   within a single week).
2. **Budget.** Include a budget/cost-tier onboarding question in FR1, or
   leave cost out of scope for phase 1 and only reflect it implicitly
   through general food choices?
3. **Default for existing athletes.** `mealPlanEnabled` defaults unset for
   athletes who already have an `athlete.json` — should the coach proactively
   offer it once (a single mention next time their plan runs), or only
   surface it if the athlete asks?
4. ~~**Phase 2 timing.**~~ Resolved: phase 2 is already tracked as issue
   [#45](https://github.com/macken04/skill-cycling-plan-coach-dm/issues/45)
   (opened by the athlete, independently specs `meal_recommendations`/
   `meal_feedback` tables, a rating+keep/change UI, and a `/nutrition-feedback`
   Claude Code command) rather than needing a new tasks doc invented here.
   #45 explicitly depends on this PRD's itemized-plan output existing first.
5. **Household context.** Any need to size portions for a partner/family
   cooking the same meals, or is single-athlete portioning (current
   assumption, §5) sufficient?

## 7. Success metrics

- With `mealPlanEnabled: true`, every weekly run produces `YYYY-Wnn-meals.md`
  with a full breakfast/lunch/dinner/snack (+ on-bike fueling where
  applicable) list for each day, whose totals land within ±10% of
  `nutrition.md`'s day-type carb/protein/fat/kcal target for every day type
  present that week.
- Zero `dietaryRestrictions` violations across a full week's meal list.
- A disliked/GI-flagged/time-constrained item reported in one week's
  narrative feedback does not reappear unchanged the following week, and
  the swap is stated explicitly in that week's plan.
- An athlete with `mealPlanEnabled` unset or `false` sees zero behavior
  change versus today — no meals file, no new required onboarding friction
  beyond the single opt-in question.
