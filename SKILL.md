---
name: cycling-plan-coach
description: Plan a cyclist's training week as a standalone coaching package with integrated workout building. Use whenever the athlete asks to plan a week or the upcoming week ("plan my week", "build my training week", "weekschema", "maak een plan voor volgende week", or any localized equivalent), or states a goal for the week. The flow reads a per-athlete config, pulls recent Strava data, classifies rider type from the athlete's own power curve, then produces one weekly markdown plan and one importable .zwo per structured bike session without relying on another skill. Works for any cyclist, not one fixed person.
metadata:
  author: Elio Struyf <elio@struyfconsulting.be>
  license: MIT
---

# Cycling plan coach

Turn a short conversation into ready-to-use standalone files for coaching: a weekly markdown plan and the `.zwo` bike workouts it references. The athlete's identity, goal, language and units come from a config file, not from this skill, so it works for anyone.

## Resolve config first (every run)

Before doing any real work:

1. Look for the config at `athlete.json` (next to this skill).
2. If it exists and parses, load it and go straight to the main workflow.
3. If it is missing or invalid (first run), run the setup flow in `references/onboarding.md`, write `athlete.json`, then continue into the main workflow in the same turn. Do not make the athlete re-invoke the skill after setup.

`athlete.json` is the single source of truth for who the plan is for. Fields are documented in `references/athlete-config.md`.

From the config take: `name` (greetings), `language` and `units` (everything the athlete reads is produced in these), `styleNotes` (writing rules to honor), `goal`, `age`, `gender`, `weightKg`, `fallbackFtp`, `targetWkg`, `groupRideDays`, `typicalAvailableDays`, `typicalWorkoutDurationMin`, `maxStructuredSessions`, `strengthDefault`, and optional `riderTypeOverride`.

If `age` is missing from an existing config, ask for it before continuing — it is required to set recovery windows. If `gender` is missing, ask for it or accept a skip; note that it defaults to gender-neutral W/kg benchmarks when absent.

At the start of every weekly planning run, ask a short weekly-availability intake before training design:

- Available training days for the upcoming week.
- Planned group-ride day(s) for the upcoming week.
- Planned duration per workout day.
- Strength preference this week: strength, core, or both.
- Frequency for strength/core this week (how many times).

Always offer a one-step option to use predefined values from `athlete.json` profile config (for example: typical training days, `groupRideDays`, `strengthDefault`, and any stored duration preferences). If the athlete chooses profile defaults, confirm what was applied and only ask for overrides.

## Main workflow

### Step 1 - pull recent Strava data

Retrieve the athlete's own numbers so the plan is grounded in what they did. Tool calls and mapping are in `references/strava-pull.md`. Get: current FTP and zones (overrides `fallbackFtp`); gender from the athlete profile (populate `athlete.json` only if the field is currently absent — never overwrite a stated preference; see `references/strava-pull.md`); the last 10 to 14 days of activities to review last week and spot fatigue; and the power-duration curve from the most recent hard ride. Summarise last week back to the athlete in their language. If Strava is unreachable, say so, use `fallbackFtp`, and continue — age and gender still come from the config.

### Step 2 - classify rider type (data-driven)

Unless `riderTypeOverride` is set, classify the athlete from their own power curve using `references/rider-types.md`. The classification (sprinter/puncheur, all-rounder, diesel/time-triallist) plus the athlete's `goal` set the session priorities, which sessions to emphasise and which to skip. Do not assume a fixed rider type; derive it. State the detected type and the resulting focus in one line.

### Step 3 - confirm intake and session design

Restate the goal from the config in one line, then confirm or complete intake values gathered at the start. Ensure these are explicitly captured: available training days, group-ride day(s), duration per workout day, how many structured key sessions (default `maxStructuredSessions`), indoor or outdoor preference, week's focus, strength mode (strength/core/both), and strength/core frequency. Keep the intake short with the interactive picker when available. Always provide a "use profile defaults" path so the athlete can accept predefined config values and only override what changed. Factor last week's load into the new week.

### Step 4 - apply the training model

Use the FTP from Strava (fallback: `fallbackFtp`), the rider type from Step 2, and the goal. Convert every % FTP target to watts in the human-readable text using that FTP. Principles and session shapes are in `references/training-model.md`. Always: polarized week, at most `maxStructuredSessions` structured days midweek, group-ride days social with no forced structure, never three hard days back to back, steer by power and allow backing off on feel.

### Step 5 - build structured workouts (.zwo)

Build the workout files inside this skill.

- Session archetypes, rotation rules, and progression steps live in `references/workout-library.md`.
- File format, block types, and examples live in `references/zwo-format.md`.
- Before selecting sessions, check the archetypes extracted from last week's Strava rides (Step 1). Do not repeat the same archetype unless advancing it by one progression step. Use the rotation table in `references/workout-library.md` to pick this week's pair.
- Every structured bike session must produce one valid `.zwo` file.
- Use `% FTP` for planning and convert to watts in the markdown plan using the week's FTP.
- In `.zwo`, store power as FTP fractions and durations in seconds.
- Add localized `textevent` cues in the athlete's language.
- Keep hard sessions capped by `maxStructuredSessions` and aligned with the polarized model.
- Run through the validation checklist in `references/zwo-format.md` before delivering.
- Output every `.zwo` inline as a fenced XML code block (labeled with the filename) so the athlete can read and copy it directly from Claude's UI.

### Step 6 - produce the files

Save everything to `/mnt/user-data/outputs/` and present it. If that path is unavailable, deliver all files inline in the response instead. Human-readable text in the config `language`; distances and speeds in the config `units`. Machine keys stay English; filenames stay lowercase-hyphenated and neutral.

1. One weekly plan markdown file, named by week id using ISO 8601 week numbering (e.g. `2026-W26-plan.md`; note week 1 may start in late December of the prior year). Follow the structure in `references/plan-format.md`. Include: week id, goal, detected rider type, FTP used, one-line last-week summary, day-by-day schedule table, structured session detail blocks (% FTP and converted watts), group-ride guidance, and strength/core exercises (mapped from `references/strength-library.md`).
2. One `.zwo` per structured bike session, built directly by this skill using `references/workout-library.md` and `references/zwo-format.md`. On-screen cues in the config language. Filenames must be listed in the markdown plan under their matching day. Also render each `.zwo` inline as a fenced XML code block in the response.
3. When there is a full gym session, add a dedicated markdown file (e.g. `2026-W26-strength.md`) with sets, reps, rest, and coaching cues in the config language. Reference it from the main plan.

## Quality checks before delivering

1. A weekly markdown plan file exists and includes all required sections (week id, goal, focus, FTP used, rider type, last-week summary, day-by-day schedule table, structured session detail blocks).
2. FTP used in the markdown plan equals the live FTP (or the stated fallback when Strava is unavailable).
3. Every structured bike day in the markdown references exactly one produced `.zwo`; watt targets in markdown match the % FTP targets at the stated FTP.
4. Session priorities match the detected rider type and the goal.
5. The week works toward the goal, structured days capped, group days social, strength off the pre-interval day, last week factored in.
6. Every `.zwo` passes the validation checklist in `references/zwo-format.md` and is rendered inline as a labeled fenced XML block.
7. All human-readable text is in the config language and units, honoring `styleNotes`. State the week id, focus, detected rider type, last week in one line, and which files you created.
