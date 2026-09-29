# cycling-plan-coach

A reusable Claude skill that acts as a standalone cycling coach. It reads a per-athlete config, pulls recent training/readiness data from Strava and/or Garmin (and, optionally, a connected WHOOP account for daily recovery/sleep/strain and per-workout strain/HR), classifies the athlete's rider type from their own power curve, and outputs a weekly coaching package: a markdown week plan plus importable `.zwo` bike workouts for structured days — personalized against a deep athlete profile (training background, physical limiters, strength history, nutrition preferences) gathered at onboarding, and, when the athlete is training toward a specific supported event, an event-aware plan that leans the week toward that event's own limiters. When an event date is set, it also builds and maintains a multi-month season macrocycle (Base/Build/Refine with deloads and a coach-designed B/C trial-event ladder) and reads back logged session and trial-event outcomes to adjust progression, fueling ramp, and the remaining season — all athlete-triggered, never on a timer.

It works for any cyclist. Nothing about the athlete is hardcoded in the skill; it all lives in `athlete.json`.

## What it needs

- A connected Strava account (FTP, recent rides, power curve) and/or a pasted Garmin Coach JSON export (`references/garmin-data.md`) for zones, readiness (HRV, sleep, training status/ACWR), and load. Either, both, or neither work — without any data source the skill falls back to the FTP and self-reported baseline in the config.
- Optionally, a connected WHOOP account (`/connections` in the web dashboard, no manual export) for daily recovery/sleep/strain feeding the same readiness logic Garmin drives, plus per-workout strain/HR matched back to logged sessions (`references/whoop-data.md`, `documents/whoop-integration-plan.md`).
- Optionally, a connected FatSecret account (a local, per-athlete MCP connector, same shape as Strava) for actual-vs-target fueling comparison against this week's carb targets (`references/fatsecret-data.md`, `documents/fatsecret-integration-plan.md`).
- No second workout skill is required. ZWO creation is built in via `references/workout-library.md` and `references/zwo-format.md`.

## Install

### 1. Get the skill

Either:

- Download the latest `cycling-plan-coach.skill` from this repo's [Releases](../../releases) (built automatically by `.github/workflows/release.yml` whenever a `vX.Y.Z` tag is pushed), or
- Build it yourself from a checkout: `npm run build` (Node 20+, no `npm install` needed at the repo root) runs `scripts/build-skills.sh`, which bundles `SKILL.md`, `references/`, `LICENSE`, and this `README.md` into `cycling-plan-coach.skill` at the repo root, stamping in the version from `package.json`.

Then drop the resulting `cycling-plan-coach.skill` file into your Claude skills directory (or upload it wherever your Claude client loads skills from). See [First run](#first-run) below for what happens next — onboarding writes `athlete.json` next to the skill automatically.

### 2. Optional data connections

None of these are required — with nothing connected, the skill falls back to `fallbackFtp` and the rest of `athlete.json`. Add any combination of:

- **Strava** — connect Strava as a native connector in your Claude client. No setup in this repo; see `references/strava-pull.md` for what's pulled.
- **Garmin** — no persistent connector. Export a Garmin Coach JSON via the [Garmin Workout Importer](https://chromewebstore.google.com/detail/garmin-workout-importer/faebbfokokipdpkbolpbpfadmgdbanpo) Chrome extension and paste it in when the skill asks, each session. See `references/garmin-data.md`.
- **WHOOP** — connect from the web dashboard's `/connections` page (no manual export). Requires the web dashboard (below) to be deployed and your `athlete.json` linked to it. See `references/whoop-data.md` and `documents/whoop-integration-plan.md`.
- **FatSecret** — a per-athlete local MCP connector, set up once outside this repo (register a FatSecret Platform API app and run this project's fork of `fcoury/fatsecret-mcp`'s OAuth onboarding tooling locally). No credentials of any kind live in this repo, Supabase, or Vercel. See `references/fatsecret-data.md`.

### 3. Optional: web dashboard

The skill works entirely standalone (local plan/workout files) without this. The dashboard (`web/`, Next.js + Supabase) adds a place to view the current week/season plan online and log workouts, nutrition, and strength sessions, which the skill then reads back into future plans (`SKILL.md`'s "Step 7 - sync to Supabase").

- **Run it locally:**
  ```
  cd web
  cp .env.example .env.local
  npm install
  npm run dev
  ```
  `.env.example` ships with the publishable `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` for the project's Supabase backend (safe to expose client-side). WHOOP support additionally needs the server-only `SUPABASE_SERVICE_ROLE_KEY`, `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `WHOOP_REDIRECT_URI`, and `WHOOP_INTERNAL_SYNC_SECRET` — see `docs/infra.md`.
- **Deployment:** the dashboard is deployed via the `cycling-plan-coach` Vercel project (root directory `web`), currently a single-athlete v1 at `https://cycling-plan-coach.vercel.app`. Deploying your own instance means creating your own Supabase project (apply the migrations in `supabase/migrations/` in order) and Vercel project pointed at `web/`.
- **Link your `athlete.json` to it (one-time):** sign in once at the deployed dashboard with a magic link (creates your Supabase `auth.users` row), then set the resulting user id as `supabaseAthleteId` in `athlete.json`. The skill offers to complete this step for you the next time it runs if you tell it you've already signed in and the session has Supabase access. Until `supabaseAthleteId` is set, the skill produces local files only and nothing about this section applies.

See `web/README.md` and `docs/infra.md` for full details.

## Usage

Once installed, invoke the skill from Claude with:

```
/cycling-plan-coach
```

Or ask naturally — phrases like "plan my week", "build my training week", or "make me a training plan for the upcoming week" trigger it automatically.

## First run

On first use, the skill runs a conversational onboarding (`references/onboarding.md`) and writes `athlete.json` before doing anything else. It covers the goal (a specific event, if one is supported, or a general plan), cycling background, physical profile, a narrative question on physical limiters, strength/training history, resting HR and any lab testing, logistics, and nutrition preferences — a real baseline, not just name/FTP/goal. Once the config exists, it continues with the data pull and weekly planning. After that, ask it to "plan my week" and it reads the config each time; nothing is fixed forever — tell it when something's changed (an injury clearing up, a new PB, a shifted goal) and it updates the config on the spot.

## Event-specific coaching

If the athlete names a supported event at onboarding (currently Badlands Ultra — a self-supported ultra-distance gravel race; see `references/events/README.md` for the registry), the plan leans toward that event's own limiters (durability, fueling, terrain/handling, heat, etc.) instead of a generic rider-type template, and gains an event countdown and fueling guidance in the weekly output (`references/events/badlands-ultra.md`, `references/nutrition.md`). An unsupported/unlisted event is still captured and falls back to generic ultra-endurance heuristics.

When the event also has an `eventDate`, the skill generates and maintains a multi-month season macrocycle: a Base/Deload/Build/Deload/Refine phase skeleton spanning to the event, a coach-designed B/C trial-event ladder rehearsing the event's specific limiters at increasing fidelity, and a fueling/strength periodization ramped to match (`references/macrocycle-model.md`, `references/trial-events.md`, `references/season-plan-format.md`, per `documents/season-macrocycle-prd.md`). Only the current phase is planned week-by-week; other phases show as a dated one-line summary until the athlete reaches them. Logging a session or trial-event outcome — too hard, easier than planned, GI distress, a comfortably-finished dry run, and so on — feeds a defined rule table (`references/workout-library.md`, `references/strength-prescription.md`, `references/trial-events.md`, `references/nutrition.md`) that adjusts progression, the fueling ramp, or the remaining ladder, stated explicitly in the next plan; a material divergence (illness, missed weeks, a bad trial event, a shifted event date) triggers a replan of the remaining skeleton without rewriting completed weeks. All of this is athlete-triggered only — nothing runs on a timer (`documents/agentic-coach-prd.md`). Strength sessions follow an evidence-based prescription (`references/strength-patterns.md` for exercise choice, `references/strength-prescription.md` for RIR-controlled sets, reps and load by phase and lifting experience, `references/strength-session.md` for the RAMP warm-up and cool-down): every exercise states why it was chosen for the athlete, plus an RIR target and a load, and `athlete.json`'s `equipment` field gates what is offered. See `documents/multi-event-and-webui-tasks.md` for current status (Milestone A and Milestone B both complete: `web/` for the frontend — plan/nutrition/strength logging, compliance/trend views, and a season-plan view backed by Supabase — and `docs/infra.md` for infra and the one remaining manual step, an athlete signing in once to link their account).

## How it decides

The coaching is data-driven, not a fixed template. Each week the skill:

1. loads your config,
2. pulls your recent Strava and/or Garmin data and reviews last week, including readiness if Garmin and/or WHOOP is connected,
3. classifies your rider type from your power curve (sprinter/puncheur, all-rounder, diesel) and combines that with your goal — and, if set, your target event's own limiters — to set session priorities, weighing any physical limiter you've described as a hypothesis alongside the data,
4. asks what the week allows,
5. builds a polarized week toward your goal, personalizing strength/core and fueling guidance against your background and preferences,
6. outputs the files in your language and units.

See `references/` for the config schema, onboarding, rider-type logic, plan format, Strava/Garmin/WHOOP mapping, training model, strength library, workout library, nutrition, meal-plan library, event files, and ZWO format.

## Meal planning (optional)

Opt in at onboarding (`mealPlanEnabled`) for a full itemized weekly meal
plan — an actual day-by-day breakfast/lunch/dinner/snack list built from
`references/meal-library.md`'s self-contained food-block library, sized to
each day type's carb/protein/fat target from `references/nutrition.md`,
respecting `dietaryRestrictions` and cooking-time/cuisine preferences
gathered at onboarding. A narrative question each week ("how did last
week's meals go?") feeds swaps back into the next plan, the same
logged-feedback pattern already used for training. Once linked to the web
dashboard, you can also rate any specific meal/snack from the web UI
(1-5 + keep/change) or give detailed written feedback with
`/nutrition-feedback` in a Claude Code session — both feed the same swap
logic. Skip the opt-in and nothing changes — you still get the existing
fueling targets and on-bike guidance either way. See
`documents/meal-plan-prd.md` for the full design.

## Output

- `YYYY-Wnn-plan.md` - the full weekly plan in readable markdown, including event countdown/fueling sections when applicable.
- `*.zwo` - one per structured bike session.
- `YYYY-Wnn-strength.md` (optional) - full gym session details when strength work is scheduled.
- `YYYY-Wnn-meals.md` (optional) - the full day-by-day meal plan when `mealPlanEnabled` is `true`.
- `season-plan.json` / `season-plan.md` (optional) - the season macrocycle skeleton and its rendered summary, generated once an event with an `eventDate` is set; regenerated only when the athlete reports a material change.

## Note

This skill makes general endurance-training assumptions from public training principles. It is not medical advice or a substitute for a coach or physician. Build intensity around how you feel, and check with a professional for health concerns.

## License

MIT. See [LICENSE](LICENSE).

<br />
<br />

[![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fskill-cycling-plan-coach&countColor=%23263759)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fskill-cycling-plan-coach)
