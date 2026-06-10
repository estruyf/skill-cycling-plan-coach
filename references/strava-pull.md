# Strava pull and snapshot output

Pull the athlete's recent data before building, so the plan is grounded in what they did and their current numbers. This is per-user: each athlete connects their own Strava.

## Tools

1. `get_athlete_zones` - current FTP (`ftp`) and zones. This is the FTP used for the week plan. Note `ftp_is_estimated`.
2. `get_athlete_profile` - returns name, weight, measurement preference, and **gender**. Populate the `gender` field in `athlete.json` from this value **only if the field is currently absent** (the athlete skipped it at onboarding). Never overwrite an existing value — the athlete's stated preference always wins. If you notice a discrepancy, note it and ask the athlete to confirm. Age is **not** returned by Strava — it must come from `athlete.json`.
3. `list_activities` with `range_start` ~14 days back - recent rides. Filter `Ride` and `VirtualRide`. Convert `avg_speed` (m/s) to km/h (×3.6) or mph (×2.237) per `units`. Use `relative_effort` as `re`.
4. `get_activity_performance` on the most recent hard ride - `best_efforts` give the power curve (5 s, 1 min, 5 min, 20 min, …), used for rider-type classification.

## Summarise last week

From the last 7 days: rides, total distance, hours (`moving_time`), elevation, and how many hard days. Summarise in one sentence in the athlete's language, and use it to tune the new week's load. If Strava is unreachable, say so, use `fallbackFtp`, and continue.

## Extract last week's session archetypes

For each ride in the last 7 days with high relative effort (structured ride), extract the activity `name`. Map it to the closest archetype from the workout library using the name as a hint:

| Name contains… | Archetype |
|----------------|-----------|
| "sweet spot", "sweetspot", "ss" | `sweet-spot` |
| "over-under", "over under", "ou" | `over-unders` |
| "vo2", "vo2max", "4x4", "5x4", "intervals" | `vo2max` |
| "40/20", "4020", "30/30", "3030" | `40-20s` |
| "threshold", "ftp" | `threshold` |
| "endurance", "z2", "easy" | `endurance` |

If the name does not match any pattern, mark the archetype as `unknown`. Pass the list of last week's archetypes to Step 5 so session selection can avoid repeats and pick the right progression step.
