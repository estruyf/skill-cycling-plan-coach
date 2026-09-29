# Trial-event ladder (B/C dry runs)

Generic method for deriving the B/C trial-event ladder that fills in
`references/macrocycle-model.md`'s (A9) `trialEvents` array. Implements
`documents/season-macrocycle-prd.md` FR2. Not specific to Badlands Ultra —
driven entirely by whatever the target event's own "Limiters this event
trains for" section says. `references/events/badlands-ultra.md` (A11)
instantiates the concrete ladder this method produces for that event.

**These are coach-designed standalone training efforts, never real races.**
The coach does not look up, recommend, or reference an actual event on a
race calendar when building this ladder — no web-search or live race-data
capability is introduced or required. A trial event is scheduled, sized,
and shaped entirely from the target event's own reference file plus the
season skeleton's dates.

## 1. Read the target event's limiters, split into two buckets

Pull the ordered list from `references/events/<event>.md`'s "Limiters this
event trains for" section and split it:

- **Continuous limiters** — already trained by every week's ordinary session
  archetypes (e.g. durability, fat-max endurance). These are not the subject
  of a specific trial event; the whole plan already targets them, so a dry
  run would just be a long ride, not a distinct rehearsal.
- **Discrete limiters** — only genuinely tested by one continuous,
  real-world effort long/hard enough to reproduce the condition: elevation
  volume, terrain-mix/technical handling, heat tolerance, sleep
  deprivation/overnight riding, loaded-bike handling, multi-day/
  back-to-back fatigue, race-specific gear (lighting, tracker) use. These
  become the B-ladder's fidelity targets, in the order the event file lists
  them.

If a target event's limiter list has no discrete limiters at all (a flat,
short, single-day event with nothing to rehearse beyond pacing), the
B-ladder still runs per §4 below — it degenerates to a single race-pace/
tactics/fueling rehearsal rather than being skipped, since FR2's minimum
ladder count applies regardless of event type.

## 2. C-event distance ladder (one in Base, one in Build)

C-events are lower-fidelity: they test basic pacing, fueling, and distance
tolerance, on any representative terrain — they do not need to hit the
event's discrete limiters.

Given the target event's approximate total distance `D` (from its course
profile — use the file's stated approximate figure, caveats and all):

- **C1** (placed in Base): distance = 20-25% of `D`, rounded to the nearest
  round unit sensible for the event's scale (nearest 50 km for a multi-hundred-
  km ultra; nearest 5-10 km for a shorter event).
- **C2** (placed in Build): distance = 30-40% of `D`, rounded the same way.

If the event is climbing-heavy (its course profile states meaningful total
elevation `E`), give each C-event the **same fractional share of `E`** as it
takes of `D` for distance — e.g. C1's 20-25%-of-`D` distance target also
gets 20-25% of `E` as its elevation target — rather than leaving elevation
flat. This keeps the rung's climbing density matched to the full event's
without a second rounding pass. Skip this for a flat/non-climbing-focused
event.

Each C-event also rehearses whatever on-bike carb g/h target the athlete's
current fueling ramp calls for at that point in the season (per
`nutrition.md`'s long-ride range and gut-training progression, periodized
at season level per FR4/A14) — not necessarily the full race-day target yet.

## 3. B-event limiter-fidelity ladder (one in Build, one culminating in Refine)

B-events step up *fidelity* to the event's discrete limiters, not just
distance.

- **B1** (placed in Build, after C2): reuses roughly C2's distance/
  elevation scale — no additional distance-stepping is required within a
  single phase — but must be done on terrain/conditions that actually
  exercise the event's discrete limiters relevant at this point (e.g. its
  specific technical/loose-surface terrain, or a meaningful elevation block
  matching the event's own climbing density, per §2's formula). This is
  what distinguishes B1 from C2: same rough size, higher fidelity.
- **B2 — the culminating rehearsal** (placed early in Refine, per §4):
  combines *all* remaining discrete limiters simultaneously in one
  near-full-dress rehearsal: race-representative gear (loaded-bike weight,
  lighting, tracker), an overnight/sleep-deprivation component (the effort
  must span a genuine low-sleep window — sunset to sunrise or equivalent —
  not just be long), and fueling rehearsed at the now-current (later-ramp)
  g/h target, including opportunistic/unplanned resupply if the event's own
  Format rules require it. Size the distance/duration to what a single
  rehearsal window (typically a long weekend) can hold and to what actually
  forces the overnight component — not to the event's full race distance.
  If the event has no overnight/loaded-bike/technical discrete limiters at
  all (per §1's degenerate case), B2 becomes a full race-morning-to-finish
  pacing/tactics/fueling rehearsal at race intensity instead, still placed
  per §4.

## 4. Placement within phases

Each ladder rung gets a target date derived from the season skeleton's
(A9) phase dates, as a fraction of that phase's length — not a fixed
calendar offset, so the rule holds regardless of how long a given athlete's
phases end up:

| Rung | Phase | Target date | Rationale |
|---|---|---|---|
| C1 | Base | `BaseStart + round(0.60 × BaseLength)` | Needs most of Base's aerobic-building weeks behind it before testing this distance/duration safely. |
| C2 | Build | `BuildStart + round(0.35 × BuildLength)` | Early enough in Build to leave room for B1 afterward; late enough that event-specific archetypes have already started. |
| B1 | Build | `BuildStart + round(0.70 × BuildLength)` | After C2, once there's been time to layer technical/elevation-specific work on top of the distance C2 established. |
| B2 (culminating) | Refine | `RefineStart + round(0.15 × RefineLength)`, never later than `RefineStart + round(0.25 × RefineLength)` | Early enough in Refine that most of the phase remains for recovery from the rehearsal's fatigue cost, final race-specific sharpening, and the taper into `eventDate`. |

`round()` is to the nearest whole week in all four rows, consistent with
`macrocycle-model.md`'s own date arithmetic.

## 5. `spec` fields written into `season-plan.json`'s `trialEvents[]`

Each rung populates the `spec` object (per `macrocycle-model.md`'s schema)
with whichever of these fields apply — omit/null a field the rung's
category or the event's limiter list doesn't call for:

```json
{
  "distanceKm": "number or [min, max] range, per §2/§3",
  "elevationM": "number or [min, max] range, or null if not climbing-relevant",
  "limitersRehearsed": ["array of limiter names from the event file's list this rung targets"],
  "terrainFidelity": "low | high — low for C-events, high for B-events",
  "overnight": "bool",
  "loadedBike": "bool",
  "fuelingTargetGh": "number, the on-bike g/h target this rung rehearses per the current fueling ramp",
  "opportunisticResupply": "bool — true only when the event's Format rules require unplanned/unsupported resupply"
}
```

## 6. Worked example: Badlands Ultra (validates the method reproduces the PRD's example)

Inputs from `references/events/badlands-ultra.md`: `D` ≈ 800 km, `E` ≈
15,000 m (density ≈ 18.75 m/km). Discrete limiters: technical/loose-surface
handling, heat tolerance, sleep deprivation/overnight riding, sustained
high-altitude climbing, loaded-bike handling. Phase dates from
`badlands-ultra.md`'s own A11 instantiation of the macrocycle model (48-week
runway, Base 20 weeks from 2026-09-26, Build 13 weeks from 2027-02-20,
Refine 13 weeks + 3 days from 2027-05-29 to the real `eventDate` 2027-08-31).

- **C1** (Base, `2026-09-26 + 12 weeks` = 2026-12-19): distance 20-25% of
  800 km = 160-200 km → rounded to nearest 50 km = **150-200 km** —
  matches the PRD's example exactly. Elevation ≈ 3,000-3,750 m
  (proportional). Representative gravel/road terrain, no overnight/loaded-
  bike component required.
- **C2** (Build, `2027-02-20 + 5 weeks` = 2027-03-27): distance 30-40% of
  800 km = 240-320 km → rounded to nearest 50 km = **250-300 km** —
  again matches the PRD's example exactly. Elevation = 30-40% of 15,000 m
  = 4,500-6,000 m.
- **B1** (Build, `2027-02-20 + 9 weeks` = 2027-04-24): same 250-300 km/
  4,500-6,000 m scale as C2, but on Badlands-representative sandy/technical
  terrain hitting that elevation density in a single concentrated block
  (echoing the event file's ~3,000 m/100 km note), rehearsing the
  terrain-mix and elevation limiters at high fidelity for the first time.
- **B2 — culminating** (Refine, `2027-05-29 + 2 weeks` = 2027-06-12, i.e.
  ~15% into Refine, leaving ~11 of Refine's ~13.4 weeks for recovery, final
  sharpening, and taper before 2027-08-31): a loaded-bike, overnight,
  full-gear (lighting, tracker) rehearsal spanning a genuine sunset-to-
  sunrise stretch, with opportunistic resupply fueling at the then-current
  gut-trained g/h rate — the "elevation/terrain-mix event → culminating
  overnight rehearsal" the PRD describes.

This reproduces the PRD's stated example (C: ~150-200 km → ~250-300 km;
B: an elevation/terrain-mix event culminating in an overnight rehearsal)
directly from the generic method above and this event's own limiter list —
confirming the method generalizes rather than hard-coding Badlands' numbers.

## 7. Interpreting a logged outcome (A15)

Once a rung is logged (its `season-plan.json` entry gets `status: logged`
and an `outcome` object, per `macrocycle-model.md`'s A15 schema), its
`completionStatus` overrides the default placement/sizing that §2-§4 would
otherwise give the *next* rung — the logged rung's own dates/spec are never
rewritten, only what comes after. This is the same style of rule as A8's
workout-outcome table (`workout-library.md`), applied to trial events
instead of weekly sessions. Per `documents/agentic-coach-prd.md` FR4/FR8,
these adjustments are stated explicitly in the next plan's summary, not
left implicit.

| Logged `completionStatus` | Adjustment to the next scheduled rung |
|---|---|
| `completed_comfortably` | Pull the next rung's `targetDate` forward: recompute §4's formula as if "now" were the date this rung was logged, but never earlier than that logged date itself, never past the next rung's phase boundary, and never skipping a rung entirely. State the new date in the plan's summary. |
| `completed_as_planned` | No change — the next rung keeps the `targetDate` and `spec` §2-§4 already produced for it. |
| `completed_with_difficulty` | Hold the next rung's fidelity/distance/elevation at this rung's own `spec` level instead of stepping up the default increment (e.g. a C2 logged `completed_with_difficulty` means B1 reuses C2's `spec` values rather than advancing to B1's normal higher-fidelity target). `targetDate` is unchanged. If this is the second consecutive rung logged `completed_with_difficulty` or worse, this counts as "a trial event that went badly and reveals a limiter needs more work" (`season-macrocycle-prd.md` FR7) — flag it as a replan trigger for A13 rather than only adjusting the one rung. |
| `dnf_stopped_early` | Same hold as `completed_with_difficulty`, and **always** flag the A13 replan trigger in the same plan message — a DNF is never absorbed silently, even on the first occurrence. |
| `skipped` | No difficulty adjustment on its own (same principle as A8's single-skip rule) — reschedule this rung's exact `spec` at the next available slot before the following rung's `targetDate`, rather than dropping straight to the next rung's higher fidelity. Two consecutive `skipped` rungs escalate to the same replan trigger as `dnf_stopped_early`. |

`fuelingSignal` on the same outcome is interpreted separately, per
`nutrition.md`'s "Interpreting a logged fueling signal" section — a rung can
trigger both tables at once (e.g. `completed_as_planned` +
`gi_distress`: the next rung's difficulty is unchanged, but the fueling ramp
still holds per the fueling table).
