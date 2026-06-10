# cycling-plan-coach

A reusable Claude skill that plans a cyclist's training week. It reads a per-athlete config, pulls the athlete's recent Strava data, classifies their rider type from their own power curve, and outputs a standalone weekly package: a markdown week plan plus importable `.zwo` bike workouts for structured days.

It works for any cyclist. Nothing about the athlete is hardcoded in the skill; it all lives in `athlete.json`.

## What it needs

- A connected Strava account (the skill pulls FTP, recent rides, and a power curve). Without it, the skill falls back to the FTP in the config.
- No second workout skill is required. ZWO creation is built in via `references/workout-library.md` and `references/zwo-format.md`.

## Install

Download the `cycling-plan-coach.skill` file and drop it into your Claude skills directory.

## Usage

Once installed, invoke the skill from Claude with:

```
/cycling-plan-coach
```

Or ask naturally — phrases like "plan my week", "build my training week", or "make me a training plan for the upcoming week" trigger it automatically.

## First run

On first use, the skill asks onboarding questions and writes `athlete.json` before doing anything else. Once the config exists, it continues with Strava pull and weekly planning. After that, ask it to "plan my week" and it reads the config each time.

## How it decides

The coaching is data-driven, not a fixed template. Each week the skill:

1. loads your config,
2. pulls your recent Strava data and reviews last week,
3. classifies your rider type from your power curve (sprinter/puncheur, all-rounder, diesel) and combines that with your goal to set session priorities,
4. asks what the week allows,
5. builds a polarized week toward your goal,
6. outputs the files in your language and units.

See `references/` for the config schema, onboarding, rider-type logic, plan format, Strava mapping, training model, strength library, workout library, and ZWO format.

## Output

- `2026-Wnn-plan.md` - the full weekly plan in readable markdown.
- `*.zwo` - one per structured bike session.
- `2026-Wnn-strength.md` (optional) - full gym session details when strength work is scheduled.

## Note

This skill makes general endurance-training assumptions from public training principles. It is not medical advice or a substitute for a coach or physician. Build intensity around how you feel, and check with a professional for health concerns.

## License

MIT. See LICENSE.
