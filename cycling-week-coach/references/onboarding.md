# Onboarding - first run

Run this when `athlete.json` is missing or incomplete. Keep it short, use the interactive picker when available, and write the config at the end. Ask in the athlete's language once it is known (start in English, switch as soon as they pick a language). After writing `athlete.json`, continue directly into weekly planning in the same turn.

## Questions

1. Language for your plans? (e.g. English, Nederlands, Francais, Deutsch, Espanol, Italiano)
2. Units? (metric km/h, or imperial mph)
3. What is your main goal this season? (free text, keep it concrete: a group pace, an event, a climb, a time)
4. Body weight? (kg or lb; convert to kg)
5. Do you know your FTP? (a number in watts, or "no" to estimate it later from Strava)
6. Target W/kg, if you have one? (optional; default 3.5)
7. Which days are your group or social rides? (default: Saturday and Sunday)
8. Which days can you usually train? (default: all)
9. How many structured key sessions per week? (1, 2, or 3; default 2)
10. Strength by default? (strength + core / core only / none)
11. Any writing preferences? (tone, things to avoid; optional)

## Write the config

Map the answers onto the fields in `athlete-config.md` and write `athlete.json`. Set `riderTypeOverride` to null so the skill derives the rider type from data. Confirm in one line and continue to the weekly plan.

If FTP is unknown, set `fallbackFtp` to a conservative estimate (e.g. 2.5 W/kg times weight) and tell the athlete the first Strava pull or an FTP test will replace it.
