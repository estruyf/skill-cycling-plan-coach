# Strength session structure (warm-up, ramp-up, cool-down, output)

How a strength session is laid out and how the strength file is written. Exercise choice: `references/strength-patterns.md`. Sets, reps, RIR, load: `references/strength-prescription.md`. Confidence tags as defined there.

## Duration and placement

- 45-60 min total including warm-up and cool-down `[consensus]`. Core-only sessions run about 20 min plus a short warm-up.
- Put strength on an easy or rest day, >=24 h before a quality bike session (ideally 36-48 h in the first weeks or after heavy hinges). Never heavy lower-body work the day before intervals, a long ride, a trial event, or the target event `[evidence]`.
- If same-day with a hard bike session: bike in the morning, strength >=3-6 h later `[consensus]`.

## Warm-up: RAMP (8-10 min) `[consensus]`

Dynamic before lifting; static holds go after. (Static stretches held >=60 s reduce immediate performance `[evidence]`.)

1. **Raise (3-5 min):** easy bike, rower or brisk walk to lift temperature and heart rate.
2. **Activate and mobilise (about 5 min):** glute bridge, bodyweight squat, hip-flexor lunge with reach, thoracic rotation, ankle rocks, cat-camel. Pick the ones matching the session's joints.
3. **Potentiate:** the ramp-up sets below.

## Ramp-up sets for the first lift `[convention]`

As a share of the day's working load: **50% x 5, 70% x 3, 85% x 1-2**, then the first working set. Rest 60-120 s between ramp sets and 2-3 min before the first working set. Keep ramp reps low and fast so they do not fatigue. A beginner on RIR-based sets uses these three ramp sets; later lifts in the session need 1-2 ramp sets. On a load-finding session (see `strength-prescription.md`, "Starting loads") use the ramp to find the load: keep adding weight until a set lands at the target RIR.

## Cool-down / mobility (5-8 min) `[consensus]`

After the last set: 5 min easy spin or walk, then static holds of **30-45 s** per position, post-session only:
- hip flexors (half-kneeling or couch stretch)
- thoracic extension over a bench or foam roller
- hamstrings (supine strap)
- ankles (knee-to-wall dorsiflexion)
- quads (prone) and glutes (figure-4)

Quad lengthening belongs here, never before heavy lifts.

## Output: `YYYY-Wnn-strength.md`

Write in the athlete's `language`/`units`. Sections in this order:

```markdown
# Strength & Core - Week YYYY-Wnn

Phase: <season phase or "no season skeleton">. Row used: <experience> / <phase row, e.g. new / Base wk 1-3>.
Intent: <one line>. Target: <sets x reps> at RIR <n>. <"Session 1 is a load-finding session" when it is.>

## <Day> - Full session (~50 min)

### Warm-up
<RAMP, 8-10 min, then ramp-up sets for the first lift with actual kg>

| Exercise | Sets × Reps | Load / cue | Rest |
|---|---|---|---|
| <name> | <n × range> | <kg or bodyweight>, RIR <n>, <cue> | <rest> |

### Cool-down / mobility
<5-8 min list>

### Why this session
- <exercise>: <reason citing the athlete field or phase, e.g. "trap bar over back squat: lower-back tightness in `strengthInjuryNotes`">

## Progression note
<what triggers the next load step, and any adjustment from logged outcomes, per strength-prescription.md>
```

Rules:
- Every exercise row states **a reason (in "Why this session"), an RIR target and a load** (kg, or bodyweight). The reason is also folded into the row's `Load / cue` text so it travels in the `workouts.target` JSON `load_cue` field; the JSON shape `{"exercise","sets_reps","load_cue","rest"}` does not change.
- Name the experience/phase row used in the header.
- When a Build/Refine week, add one line suggesting the low-cadence torque or short-sprint bike effort (see `strength-prescription.md`, "On-bike pairing").
- Respect the taper rule: no strength in the last 5-7 days before the target event.
- Reference this file from the weekly plan's Strength section (`plan-format.md` section 5).
