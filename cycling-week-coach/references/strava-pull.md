# Strava pull and snapshot output

Pull the athlete's recent data before building, so the plan is grounded in what they did and their current numbers. Map it into the app snapshot. This is per-user: each athlete connects their own Strava.

## Tools

1. `get_athlete_zones` - current FTP (`ftp`) and zones. This is the FTP for the WeekPlan and the snapshot. Note `ftp_is_estimated`.
2. `get_athlete_profile` - weight and preferences, for W/kg.
3. `list_activities` with `range_start` ~14 days back - recent rides. Filter `Ride` and `VirtualRide`. Convert `avg_speed` (m/s) to km/h (x3.6) or mph (x2.237) per `units`. Use `relative_effort` as `re`.
4. `get_activity_performance` on the most recent hard ride - `best_efforts` give the power curve (5s, 1m, 5m, 20m, ...), used for rider-type classification and the snapshot.

## Summarise last week

From the last 7 days: rides, total distance, hours (`moving_time`), elevation, and how many hard days. Summarise in one sentence in the athlete's language, and use it to tune the new week's load.

## Output: strava-latest.json

Write this so the app can visualize current state. The app reads `rides`; extra fields carry the rest.

```json
{
  "generatedAt": "2026-06-09T10:00:00Z",
  "source": "strava-mcp",
  "ftp": 245,
  "ftpIsEstimated": true,
  "weightKg": 71,
  "riderType": "puncheur",
  "lastWeek": { "rides": 4, "km": 288, "hours": 8.5, "elevation": 741, "hardDays": 2, "summary": "..." },
  "powerCurve": [ { "d": "5s", "w": 879 }, { "d": "1m", "w": 414 }, { "d": "5m", "w": 313 }, { "d": "20m", "w": 258 }, { "d": "60m", "w": 212 } ],
  "rides": [ { "date": "06-08", "name": "...", "km": 58, "kmh": 29.9, "re": 59 } ]
}
```

Also set the WeekPlan `ftp` to this FTP. If you used `fallbackFtp` because Strava was unreachable, say so and mark it.
