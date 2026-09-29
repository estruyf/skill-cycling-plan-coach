# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`cycling-plan-coach` is a Claude **Agent Skill**, not a conventional app. The skill itself is prose: `SKILL.md` plus `references/*.md` are the actual "program" — a Claude session executing the skill reads these markdown files and follows their instructions to produce a cyclist's weekly training plan, ZWO workout files, and (optionally) a multi-month season macrocycle. There is very little procedural code in the repo; most "changes" to behavior are edits to `SKILL.md` or a file in `references/`.

A companion Next.js + Supabase web dashboard (`web/`) lets the athlete view plans and log workout/nutrition/strength completions, which the skill reads back on its next run. The skill is the sole writer of `plans`/`workouts` in Supabase; the web UI only ever reads those and writes `workout_logs`/`nutrition_logs`/`strength_logs`/`meal_feedback`.

## Commands

Repo root (no `npm install` needed — the build script only needs Node for two `node -p` calls):
- `npm run build` — runs `scripts/build-skills.sh`, bundling `SKILL.md`, `references/`, `LICENSE`, `README.md` into `cycling-plan-coach.skill` at repo root, stamping the version from `package.json` into the packaged `SKILL.md` frontmatter.
- `npm run open` — opens the built `.skill` file.

`web/` (Next.js dashboard):
- `cd web && npm install`
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)

There is no test suite in this repo. "Testing" a skill change means running the skill's workflow (or the `/nutrition-feedback` command) in a Claude session and checking the output against the relevant `references/*.md` spec and `SKILL.md`'s "Quality checks before delivering" checklist.

## Architecture

### The skill itself (`SKILL.md` + `references/`)

`SKILL.md` is the entry point and orchestrates a numbered workflow every time the skill runs (see its own headers for the authoritative order — do not paraphrase this elsewhere, edit `SKILL.md` directly):

1. **Resolve config** — load `athlete.json` (next to the skill) or run first-run onboarding (`references/onboarding.md`) to create it. `athlete.json` is the single source of truth for the athlete; nothing about a specific person is hardcoded in the skill. Field meanings: `references/athlete-config.md`.
2. **Resolve season skeleton** (only if `targetEvent` + `eventDate` are both set) — generate/recompute/replan `season-plan.json` per `references/macrocycle-model.md` (runway allocation into Base/Deload/Build/Deload/Refine) and `references/trial-events.md` (B/C event ladder). Replanning only happens on explicit athlete report, never autonomously.
3. **Pull data** — Strava (`references/strava-pull.md`) and/or a pasted Garmin Coach JSON export (`references/garmin-data.md`), optionally WHOOP readiness (`references/whoop-data.md`) and FatSecret fueling (`references/fatsecret-data.md`) when connected. When `supabaseAthleteId` is set, also reads back logged history from Supabase (nutrition, workout/strength outcomes, meal feedback) to adjust this run's plan.
4. **Classify rider type** from the athlete's own power curve (`references/rider-types.md`) — sprinter/puncheur, all-rounder, diesel — unless a target event's limiters override session priorities, or `riderTypeOverride` is set.
5. **Apply the training model** (`references/training-model.md`) — polarized week, capped structured days, or the current season-macrocycle phase when one exists.
6. **Build structured workouts** as ZWO/Zwift files (`references/workout-library.md` for archetypes/rotation, `references/zwo-format.md` for the XML spec).
7. **Produce output files**: weekly plan markdown (`references/plan-format.md`), one `.zwo` per structured session, optional strength file (`references/strength-patterns.md` for exercise selection, `references/strength-prescription.md` for sets/reps/RIR/load and logged-outcome rules, `references/strength-session.md` for warm-up/cool-down/output layout), optional meals file (`references/meal-library.md`, `references/nutrition.md`) when `mealPlanEnabled`, and `season-plan.md` (`references/season-plan-format.md`) when a season skeleton exists.
8. **Sync to Supabase** when `supabaseAthleteId` is set — upserts `athletes`/`events`/`season_plans`/`plans`/`workouts`/`meal_recommendations`/`coach_notes` via the Supabase MCP `execute_sql` tool (project id in `docs/infra.md`).

Editing behavior almost always means editing one of these markdown files, not code. When a `references/*.md` file's data shape changes, check whether `web/lib/types.ts` and the Supabase migrations under `supabase/migrations/` need to change too (see below) — several `references/*.md` files explicitly document the exact JSON shape the web app expects (e.g. `workout-library.md`'s strength `target` JSON is read verbatim by `web/lib/types.ts`'s `StrengthWorkoutTarget`/`isStrengthTarget` and `web/app/plan/page.tsx`/`web/app/strength/page.tsx`).

`references/events/` is a small registry of supported target events (currently Badlands Ultra); `references/events/README.md` lists ids, and each event file documents its own limiters and event-specific session archetypes that Steps 4-6 fold in when `targetEvent` matches.

### Web dashboard (`web/`)

Next.js 16 (App Router) + Supabase, single-athlete v1, deployed to Vercel (`https://cycling-plan-coach.vercel.app`, root dir `web`). Routes live under `web/app/` (`plan`, `season`, `strength`, `nutrition`, `compliance`, `connections`, `login`), Supabase client helpers in `web/lib/`. `web/app/api/whoop/*` implements the WHOOP OAuth connect/disconnect/sync flow — `web/lib/whoopServer.ts` and `docs/infra.md` document the token/secret handling (`WHOOP_INTERNAL_SYNC_SECRET` is a shared secret Claude Code uses to trigger `/api/whoop/sync`; the skill never holds a WHOOP OAuth token itself).

Supabase schema lives in `supabase/migrations/` (apply in filename order for a fresh project). The skill writes `plans`/`workouts`/`events`/`season_plans`/`meal_recommendations`/`coach_notes`; the web app writes `workout_logs`/`nutrition_logs`/`strength_logs`/`meal_feedback`/`integration_connections`/`whoop_daily_metrics`. `docs/infra.md` has the Supabase project id, env var reference, and WHOOP setup.

### Other repo pieces

- `.claude/commands/nutrition-feedback.md` — the `/nutrition-feedback` slash command, an alternate entry point for logging detailed meal feedback that feeds the same swap logic as the web UI's nutrition page.
- `documents/` — PRDs and task-tracking docs for larger features (season macrocycle, WHOOP/FatSecret/Cronometer integrations, web UI). Useful for *why* a feature exists; not authoritative for current behavior (that's `SKILL.md`/`references/`).
- `.github/workflows/release.yml` — builds and publishes `cycling-plan-coach.skill` on a `vX.Y.Z` tag push. `claude.yml`/`claude-code-review.yml` are the Claude GitHub Actions (PR assistant / code review).

## Conventions specific to this repo

- Machine keys (JSON field names, filenames) stay English and lowercase-hyphenated; all athlete-facing text in generated output follows `athlete.json`'s `language`/`units`.
- Self-reported `athlete.json` fields are never permanently fixed — the skill is expected to update them mid-conversation when the athlete mentions a change, rather than only asking at onboarding.
- Season-plan replanning and any autonomous-seeming adjustment must be athlete-triggered and stated explicitly in the output; nothing in this skill runs on a timer or silently absorbs a signal (logged outcome, readiness data, feedback) without saying so in the plan.
