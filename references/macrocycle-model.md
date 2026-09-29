# Season macrocycle model

Generic model for the long-term (multi-month) plan structure leading to a
single A-priority `targetEvent` — not specific to Badlands Ultra or any other
event. Implements `documents/season-macrocycle-prd.md` FR1/FR3.
`references/trial-events.md` (A10) defines the B/C dry-run ladder that fills
in this model's `trialEvents` array; `references/events/badlands-ultra.md`
(A11) instantiates both for that event specifically.

Only applies when `athlete.json` has `targetEvent` and `eventDate` set (per
`athlete-config.md`). An athlete with no event set has no season skeleton —
the weekly flow uses the generic rolling periodization in
`training-model.md` exactly as it does today.

## Phase structure

Five entries, always in this order, spanning exactly from the skeleton's
`startDate` to `eventDate` with no gap and no fourth named phase:

**Base → Deload → Build → Deload → Refine**

- **Base** — aerobic durability foundation: builds the endurance/fat-max base
  the later phases load on top of, general-prep strength (per A14), and
  establishes the athlete's fueling-tolerance baseline. Absorbs the season's
  runway slack (see below), so it is often longer than Build or Refine.
- **Deload** (×2, identical rule both times) — a reset, not a training
  block. Reduced volume and intensity so the athlete exits fresh, not
  detrained, and starts the next phase without residual fatigue. Never
  skipped, never merged into an adjacent phase.
- **Build** — event-specific limiter work, using the target event's own
  "Session archetypes + periodization overlay" section
  (`references/events/<event>.md`) on top of the standard rotation; max
  strength phase (A14); fueling ramps toward the event's target rate.
- **Refine** — race-specific rehearsal (loaded-bike, overnight, race-rate
  fueling, per the event's limiter list), power/maintenance strength (A14),
  culminating B-event dry run (A10) early in the phase, then taper into race
  day. Refine's final block is race week itself — `eventDate` is Refine's
  last day.

A deload block is a schedule entry like any phase, not a modifier on an
adjacent phase — it gets its own `season-plan.json` row.

## Runway allocation algorithm

Inputs: `startDate` (the day the skeleton is generated — normally "today"),
`eventDate`, and the athlete's `age` (from `athlete.json`, for the deload
length table below).

1. `totalDays` = `eventDate` − `startDate`; `totalWeeks` = `totalDays // 7`
   (integer floor division).
2. `deloadWeeks` = per the age-band table below. Both deload blocks use the
   same length.
3. Build and Refine each get a **fixed nominal length of 13 weeks** (the
   midpoint of the PRD's 12–14 week range). They are not flexed to absorb
   slack — Base is the only phase that stretches, so there is exactly one
   place slack goes and the math stays predictable.
4. `reserved` = 13 (Build) + 13 (Refine) + 2 × `deloadWeeks`.
5. `baseWeeks` = `totalWeeks` − `reserved`.
   - **If `baseWeeks` ≥ 12:** Base = `baseWeeks` weeks. No upper cap — a
     long runway simply gives Base more weeks (per PRD FR1, slack is
     absorbed into Base, never invented as a fourth phase).
   - **If `baseWeeks` < 12 (tight runway):** shrink Build and Refine to 12
     weeks each (frees 2 weeks) and recompute `baseWeeks`. If it is still
     < 12 after that, the runway cannot fit the three-phase model — stop
     and state this to the athlete explicitly (e.g. "targetEvent is only
     N weeks out; recommend a compressed two-phase Build→Refine model
     instead, or moving the event date") rather than silently generating
     an invalid or negative-length skeleton. There is no further automatic
     compression past this point.
6. Assign dates in order, each phase's start = the previous phase's end,
   with no gap:
   - Base: `[startDate, startDate + baseWeeks)`
   - Deload 1: `[end of Base, + deloadWeeks)`
   - Build: `[end of Deload 1, + 13 weeks)`
   - Deload 2: `[end of Build, + deloadWeeks)`
   - Refine: `[end of Deload 2, eventDate]`
7. Refine's end date is always the literal `eventDate`, not
   `start + totalWeeks*7` — this is what absorbs the `totalDays % 7`
   leftover from step 1's floor division, so the full runway is always
   accounted for exactly, down to the day.

### Deload length by age band

Reuses the age bands already established in `training-model.md`'s recovery
rules, rather than inventing a separate scale:

| Age band | Deload length (each of the two blocks) |
|---|---|
| Under 40 | 1 week |
| 40–49 (masters) | 2 weeks |
| 50+ (senior masters) | 3 weeks |

## Which phase is "current"

`currentPhaseId` is the id of whichever `phases[]` entry's
`[startDate, endDate)` contains today's date at read time. Two edge cases:

- **Before the skeleton's `startDate`** (skeleton generated ahead of the
  season start): `currentPhaseId` = `base`.
- **After `eventDate`** (the event has passed): there is no current phase —
  state this to the athlete (the event has happened; a replan or a new
  `targetEvent` is needed) rather than defaulting to `refine` or erroring.

Recompute `currentPhaseId` on every read rather than trusting a stale stored
value, since a replan (A13) can shift phase boundaries without necessarily
rewriting every field.

## `season-plan.json` schema

Written next to `athlete.json`. One file per athlete (single-athlete v1, per
the existing decision), but keyed by `athleteId` for the same
future-proofing reason `athlete-config.md` already keys on it.

```json
{
  "athleteId": "string",
  "targetEvent": "event id, matches athlete.json's targetEvent",
  "eventDate": "YYYY-MM-DD",
  "startDate": "YYYY-MM-DD — the day this skeleton was generated",
  "ageBandAtGeneration": "under40 | masters40to49 | senior50plus",
  "deloadWeeks": "integer — the per-deload-block length used, from the age-band table",
  "generatedAt": "ISO 8601 timestamp",
  "lastReplannedAt": "ISO 8601 timestamp or null — set by A13's replan trigger",
  "currentPhaseId": "id of the phase containing today, recomputed on read (see above)",
  "phases": [
    {
      "id": "base | deload-1 | build | deload-2 | refine",
      "label": "human-readable name, e.g. \"Base\" or \"Deload (Base -> Build)\"",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "deload": false,
      "focus": "one-line summary of this phase's emphasis, per the Phase structure section above"
    }
  ],
  "trialEvents": [
    {
      "id": "string, unique within this file",
      "category": "B | C",
      "targetDate": "YYYY-MM-DD",
      "phaseId": "id of the phases[] entry this trial event falls within",
      "spec": "object — distance/elevation/terrain/overnight/loaded-bike/fueling-target fields, per references/trial-events.md (A10)",
      "status": "planned | logged",
      "outcome": "object or null — populated once logged, per A10/A15's interpretation rules"
    }
  ]
}
```

### `outcome` object shape (A15)

Populated on the triggering `trialEvents[]` entry once the athlete reports
the rung's result (chat or, once B3/B8 ship, the web UI). Both fields are
independent signals — a rung can be `completionStatus: completed_as_planned`
and still carry `fuelingSignal: gi_distress`, since finishing the distance
and fueling cleanly are different things:

```json
{
  "completionStatus": "completed_comfortably | completed_as_planned | completed_with_difficulty | dnf_stopped_early | skipped",
  "fuelingSignal": "on_target | gi_distress | bonked_underfueled | not_applicable",
  "notes": "free text, optional"
}
```

`completionStatus` and `fuelingSignal` are interpreted by separate rule
tables, since they drive different adjustments: `references/trial-events.md`
§7 for `completionStatus` (ladder difficulty/timing), and
`references/nutrition.md`'s "Interpreting a logged fueling signal" section
for `fuelingSignal` (the season-level fueling ramp). `fuelingSignal` is
`not_applicable` (never omitted) when the rung has no meaningful fueling
component (e.g. a short technical-only C-event).

`phases` always has exactly 5 entries in the fixed order above. `deload` is
`true` only for `deload-1`/`deload-2`; it is redundant with the `id` but
kept as its own field per the PRD's explicit requirement (FR3) and because
it is the field a renderer (`season-plan-format.md`, A12) or a query should
actually check, rather than pattern-matching on `id`.

## Worked example (validates the algorithm above)

48-week runway, `startDate` = 2026-09-26, athlete under 40 (`deloadWeeks` =
1):

- `totalWeeks` = 48. `reserved` = 13 + 13 + 2×1 = 28. `baseWeeks` = 48 − 28
  = 20 (≥ 12, no shrink needed).

| Phase | Start | End | Length |
|---|---|---|---|
| Base | 2026-09-26 | 2027-02-13 | 20 weeks |
| Deload 1 | 2027-02-13 | 2027-02-20 | 1 week |
| Build | 2027-02-20 | 2027-05-22 | 13 weeks |
| Deload 2 | 2027-05-22 | 2027-05-29 | 1 week |
| Refine | 2027-05-29 | 2027-08-28 | 13 weeks |

Sum: 20 + 1 + 13 + 1 + 13 = 48 weeks = 336 days, exactly `startDate` to
`eventDate` (2027-08-28) with no gap and no fourth named phase — confirms
the algorithm above reproduces the full runway exactly.
