# Nutrition - shared fueling model

Generic fueling principles that apply to every athlete, independent of
`targetEvent`. Event files (e.g. `references/events/badlands-ultra.md`) add a
**fueling delta** on top of this — event-specific ramps or emphases — rather
than restating any of it. Carb and fluid figures stay in grams/millilitres
regardless of the athlete's `units` setting (`athlete-config.md`), the same
way power always stays in watts.

Body-weight-scaled figures use `weightKg` from `athlete.json`. Worked
examples below use a 70 kg athlete; substitute the athlete's actual
`weightKg` when giving a concrete number.

## Personalizing within the model

The targets below are generic; three fields from onboarding narrow them to
the athlete without changing the underlying g/kg math:

- **`dietaryRestrictions`:** when suggesting concrete foods or products
  (not just g/kg figures), keep suggestions consistent with these (e.g.
  don't suggest a whey-based recovery shake for a `dairyFree` athlete;
  suggest plant-based multi-source carb options for `vegan`).
- **`fuelingNotes`:** treat this the same way `physicalNotes` is treated in
  `strength-patterns.md` — a hypothesis from the athlete's own account, not a
  lab result. If it names a food/product that causes GI distress, steer
  on-bike suggestions away from it even before a logged in-ride signal
  confirms it (see "Interpreting a logged fueling signal" below for the
  case where a signal *is* logged later). If it names something the athlete
  tolerates well, prefer that as the default suggestion.
- **`fuelingPreference`:** lean suggestions toward `gels`, `realFood`, or a
  `mixed` approach accordingly; treat `noPreference` as license to suggest
  whatever best hits the g/h target for the day type.
- **`currentEatingPatternNotes`:** a qualitative baseline of what the athlete
  already eats day to day, from onboarding. Read it the same way as
  `fuelingNotes` — a hypothesis about current habits, not a lab result —
  when deciding whether daily carb targets above represent a big jump from
  today or a small one, and say so if it's a big jump (see energy
  availability below).

## Energy availability caution

The daily carb targets above assume the athlete is fueling training, not
simultaneously running a large calorie deficit. When `currentWeightGoalDirection`
is `losing` or `bodyCompositionGoal` (`athlete-config.md`) is `significantLoss`,
check that tension explicitly rather than quietly applying the full daily
carb target on top of an unknown deficit:

- State plainly, once, that combining meaningful weight loss with the
  training load this plan prescribes — especially toward a high-volume or
  ultra-distance `targetEvent` — needs a conservative rate of loss (roughly
  0.5-1% of body weight per week is a common conservative bound) to avoid
  under-fueling training and recovery.
- Prefer to concentrate any deficit on lower-volume/easy days and protect
  the on-bike fueling rates in the table above in full on structured/long/
  event-specific days — the deficit should come from daily intake outside
  training, not from underfueling the sessions that need the carbs most.
- This module isn't a substitute for individualized medical or dietetic
  advice; say so once when `bodyCompositionGoal` is `significantLoss`, and
  leave the actual deficit size and rate to the athlete (and their own
  doctor/dietitian if they involve one) rather than prescribing calorie
  numbers here.

## Daily carb periodization by day type

Daily total carb target scales with the day's training demand, not a flat
number every day. On-bike fueling (during the ride itself) only applies once
a ride crosses the duration threshold noted — shorter or easier rides don't
need it.

| Day type | Daily carb target | On-bike fueling (during the ride) | Hydration |
|---|---|---|---|
| **Rest** | 3-4 g/kg/day (210-280 g for 70 kg) | n/a - no ride | 30-35 ml/kg/day baseline (2.1-2.5 L for 70 kg), plain water, no added electrolyte needed unless the climate is hot |
| **Endurance (Z2)** | 5-6 g/kg/day (350-420 g for 70 kg) | 30-60 g/h once the ride passes ~90 min; none needed under that | 500-750 ml/h on the bike + baseline daily intake above |
| **Structured / key session** | 6-7 g/kg/day (420-490 g for 70 kg) | 60-90 g/h once the session passes ~75 min, timed around the hard efforts (some carb in the 60-90 min before, sipped through the session) | 500-750 ml/h on the bike, more in heat (see Hydration below) |
| **Long ride** | 7-8 g/kg/day (490-560 g for 70 kg) | 80-120 g/h, built up progressively across the block (start a build phase at 60-70 g/h and gut-train upward) rather than jumping straight to 120 g/h | 500-1000 ml/h depending on heat and sweat rate, with electrolyte from the first hour (see Hydration below) |

Multi-source carbs (glucose + fructose blends, roughly 1:0.8 ratio) support
absorption rates above ~60 g/h; a single glucose-only source caps out lower
and risks GI distress at high intake rates.

## Training-day fueling notes

- **Pre-ride:** 1-2 g/kg carb in the 1-3 hours before a structured or long
  session; skip this for easy/rest-adjacent rides where fat-max work is the
  point (see `workout-library.md`'s fasted/low-fuel long ride note, base
  phase only).
- **During:** start fueling before the athlete feels hungry or flat — by
  30-45 min into any ride that will cross the duration threshold above, not
  reactively once performance already drops.
- **Post-ride:** 1-1.2 g/kg carb + 0.3-0.4 g/kg protein within the first
  30-60 minutes after a structured or long session, sooner when a second
  hard session or long day follows within 24 hours (back-to-back long days,
  per event files that use that archetype).
- **Two-a-days / back-to-back long days:** treat the gap between sessions as
  a fueling window, not just a rest window - hitting the post-ride carb
  target promptly matters more here than on a single-session day.

## Hydration and electrolyte guidance

- **Baseline sweat rate estimate:** weigh before and after a representative
  1-hour ride (no fluid intake) if unknown; each kg lost ≈ 1 L of sweat.
  Absent a measured rate, use 500-750 ml/h in temperate conditions as the
  default starting point.
- **Sodium:** 500-1000 mg/h during rides over ~90 min, scaled up toward the
  top of that range in heat or for a known heavy/salty sweater (visible salt
  crusting on skin/kit is a practical tell). Rest-day and short-ride
  hydration doesn't need added electrolyte beyond a normal diet.
- **Heat adjustment:** in hot/exposed conditions (desert, high UV, low
  shade), increase both fluid (toward 1000 ml/h) and sodium (toward
  1000 mg/h) targets, and treat heat acclimation sessions (where an event
  file specifies them) as a chance to rehearse the higher rate before race
  day, not just the effort itself.
- **Overnight/low-sleep riding:** fluid and carb needs don't drop overnight;
  cooler temperatures can mask a real hydration deficit that built up during
  the day, so keep to the daytime hydration rate rather than easing off
  after dark.

## Race-day fueling principles

- **Carb-loading (multi-day/ultra events only):** 8-10 g/kg/day for the
  36-48 hours before the start, tapering activity to let the extra intake
  convert to glycogen rather than fuel more training.
- **Pre-race meal:** 1-4 g/kg carb, timed 1-4 hours before the start
  (larger meal further out, smaller/more liquid meal closer in) - rehearse
  the exact timing and meal in training, never for the first time on race
  morning.
- **On-course ramp:** start at a conservative rate (roughly 60-70% of the
  gut-trained target) for the first 30-60 minutes, then build to the full
  trained on-bike rate once the gut has settled in - don't start at the
  peak target cold.
- **Sustained multi-hour/multi-day fueling:** hold the long-ride on-bike
  rate (80-120 g/h, per the table above) for as long as the format demands,
  using whatever multi-source carb products were gut-trained in training;
  an event's own fueling delta (e.g. desert heat, unplanned resupply) layers
  on top of this baseline rather than replacing it.
- **GI-distress fallback:** if symptoms appear, drop intake rate back toward
  the conservative on-course-ramp level, switch to simpler/lower-osmolality
  sources or real food, and reduce ride intensity until symptoms clear -
  never stop fueling entirely, since bonking is the worse failure mode.
- **Caffeine:** used strategically (e.g. later stages of a long effort or
  during an overnight stretch), not from the gun - rehearse timing and dose
  in training so race day isn't the first test of tolerance and any sleep
  impact.

## Season-level fueling ramp (when a season skeleton exists)

Only applies once `season-plan.json` exists (`targetEvent`/`eventDate` both
set, per `references/macrocycle-model.md`). Without a season skeleton, use
the generic "start a build phase at 60-70 g/h and gut-train upward" guidance
from the table above with no fixed schedule.

Per `documents/season-macrocycle-prd.md` FR4, the on-bike carb target for
the week's longest/key session doesn't jump straight to the race-day rate —
it ramps across the season, with each rung of the trial-event ladder
(`references/trial-events.md`) rehearsing whatever rate the ramp calls for
on its date, not necessarily the full race target yet.

**Inputs:**

- `baselineGh` = 60 g/h — the bottom of the Long ride row's on-bike range
  above, and the season's gut-training starting point.
- `raceTargetGh` = the top of the resolved event file's own fueling-delta
  on-bike range (e.g. Badlands' 90-120 g/h → 120), read from its "Fueling
  delta" section. If `targetEvent` is free text with no fueling delta of its
  own, fall back to this file's own top-of-range figure for the relevant day
  type (120 g/h for a long ride).

**Checkpoint targets**, rounded to the nearest 5 g/h:

| Checkpoint | Target g/h |
|---|---|
| Base start (skeleton `startDate`) | `baselineGh` |
| C1 (Base) | `baselineGh` — still building duration/distance tolerance, not rate |
| C2 (Build) | `baselineGh + round(0.5 × (raceTargetGh − baselineGh))` |
| B1 (Build) | `baselineGh + round(0.75 × (raceTargetGh − baselineGh))` |
| B2 and onward through Refine | `raceTargetGh`, held — race day must never be the first test of the full rate |

Between any two consecutive checkpoints, step the target evenly week to week
rather than jumping at the checkpoint date itself, so the week right after
C2 isn't a discontinuous leap toward B1's rate.

**Worked example (Badlands Ultra, validates the formula):** `baselineGh` =
60, `raceTargetGh` = 120 (top of 90-120). C1 = 60 g/h. C2 = 60 +
round(0.5 × 60) = 90 g/h. B1 = 60 + round(0.75 × 60) = 105 g/h. B2 onward =
120 g/h — matches `badlands-ultra.md`'s own "gut training toward the top of
the 90-120 g/h range... progressively" note exactly.

State the week's current target explicitly in the plan's Fueling section
(`plan-format.md`) whenever a season skeleton exists, rather than leaving it
at the generic table's range.

## Interpreting a logged fueling signal

A trial event's `fuelingSignal` (per `macrocycle-model.md`'s A15 `outcome`
schema) is a fueling-plan signal, not just a performance note — it
overrides the season-level ramp's *next* checkpoint per the table below,
per `documents/agentic-coach-prd.md` FR4 / `documents/season-macrocycle-prd.md`
FR8. This is independent of that same rung's `completionStatus`
(`trial-events.md` §7), which adjusts ladder difficulty/timing instead —
a rung can trigger both tables at once. State any resulting adjustment
explicitly in the next plan's Fueling section, not left implicit.

| Logged `fuelingSignal` | Adjustment to the fueling ramp |
|---|---|
| `on_target` | No change — the season-level ramp's checkpoint table (above) continues on schedule. |
| `gi_distress` | Hold the g/h target at this rung's already-rehearsed rate for the remaining ramp — do not advance to the next checkpoint's higher rate until the held rate is rehearsed successfully (`on_target` or better) at least once more. Also consider a fueling-source/mix change (per the on-course source guidance above) before assuming rate alone is the problem. |
| `bonked_underfueled` | Hold the rate at this rung's rehearsed level, same as `gi_distress`, but treat it as an execution gap rather than a capacity ceiling: state in the plan whether the miss looks like pacing (intake timing lapsed under fatigue) or availability (fuel ran out/wasn't accessible), since those call for different fixes (a reminder/schedule cue vs. carrying more) rather than lowering the target. |
| `not_applicable` | No fueling-ramp adjustment — this rung had no meaningful fueling component. |

**Worked example:** C2 is logged with `fuelingSignal: gi_distress` at its
90 g/h checkpoint (per the Badlands worked example above). B1's target
holds at 90 g/h instead of stepping to 105 g/h; B1 only advances to 105 g/h
once logged `on_target` (or better) at 90 g/h, and the plan's Fueling
section states the hold and why.
