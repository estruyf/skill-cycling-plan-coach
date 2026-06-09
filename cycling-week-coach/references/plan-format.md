# WeekPlan format (with strength/core)

One week is one JSON file the coaching app reads. Produce human-readable fields (`phase`, `focus`, `detail`, `notes`, exercise names and cues) in the athlete's `language`, and distances/speeds in their `units`. Machine keys stay English. Start the file with `"$schema": "../plan.schema.json"`.

## Fields

- `id`: ISO week id, e.g. `2026-W26`.
- `startDate`: Monday of the week, `YYYY-MM-DD`.
- `phase`: training phase label.
- `focus`: one line on the week's aim.
- `ftp`: FTP the watt targets are computed from.
- `targetWkg`: optional target W/kg.
- `notes`: optional note.
- `days[]`: one entry per day with a `session`.

A `session` has `name` and `type` (`structured`, `social`, `easy`, `rest`, `strength`). Optional: `focus`, `detail`, `zwo` (the workout filename), `targetsPctFtp` (fractions of FTP the app renders as watts), `durationMin`, `intervals[]`, `exercises[]`, `notes`.

## Strength/core mapping

On a `strength` session, put the exercises in `exercises[]`:

```json
"exercises": [
  { "name": "Squat", "sets": 4, "reps": "5", "load": "heavy, full control", "rest": "2-3 min" }
]
```

`reps`, `load` and `rest` are strings so per-leg work, time holds and localized cues all fit. Translate `name`, `load` and `rest` into the athlete's language.

## Example (English, metric)

```json
{
  "$schema": "../plan.schema.json",
  "id": "2026-W26",
  "startDate": "2026-06-22",
  "phase": "Base / FTP build",
  "focus": "Two key sessions midweek, weekends social. Lift FTP so sitting in the bunch stops being a threshold effort.",
  "ftp": 245,
  "targetWkg": 3.7,
  "notes": "If both weekend rides ran hard, swap Thursday for easy endurance.",
  "days": [
    { "day": "Mon", "session": { "name": "Rest", "type": "rest", "focus": "Recover" } },
    { "day": "Tue", "session": {
      "name": "Sweet spot 2x20", "type": "structured", "focus": "Raise FTP",
      "detail": "2 x 20 min at 90% FTP (221 W), 5 min easy between.",
      "zwo": "sweet-spot-2x20.zwo", "targetsPctFtp": [0.90], "durationMin": 65
    } },
    { "day": "Fri", "session": {
      "name": "Strength + core", "type": "strength", "focus": "Durable force",
      "exercises": [
        { "name": "Squat", "sets": 3, "reps": "5", "load": "controlled, submaximal", "rest": "2 min" },
        { "name": "Romanian deadlift", "sets": 3, "reps": "8", "load": "hinge from the hips", "rest": "90 s" },
        { "name": "Plank", "sets": 3, "reps": "45 s", "load": "brace hard", "rest": "45 s" }
      ],
      "notes": "Not the day before intervals."
    } },
    { "day": "Sat", "session": { "name": "Group ride", "type": "social", "detail": "Group pace." } },
    { "day": "Sun", "session": { "name": "Group ride", "type": "social", "detail": "Keep it social." } }
  ]
}
```
