# WeekPlan – markdown format

One file per week, named `YYYY-Wnn-plan.md`. Everything the athlete reads is in the config `language` and `units`. Watt targets appear as both `% FTP` and converted watts. Filenames stay lowercase-hyphenated English.

## File structure

### 1. Header block

```markdown
# Training Week YYYY-Wnn
**Goal:** <goal from config>
**Focus:** <one-line week aim>
**FTP:** <N> W · **Rider type:** <type> · **Target W/kg:** <N> *(omit if not set)*
**Last week:** <one-sentence Strava/activity summary>
**Readiness:** <score N / level> · HRV <status> · Sleep <score>/100 · ACWR <N> · Status: <training_status> · Recovery window: <N> h *(omit entire line if no Garmin data)*
**Event countdown:** <N> days to <event display name> · Phase: <phase> *(omit entire line if `targetEvent` is unset; drop "· Phase: <phase>" only when `eventDate` is unset too, since a season skeleton needs both — see `SKILL.md`'s season-skeleton resolution step)*
```

### 2. Schedule table

List every day Mon–Sun. Structured sessions must show the workout filename (`.zwo`).

```markdown
| Day | Session | Duration | Notes |
|-----|---------|----------|-------|
| Mon | Rest | — | |
| Tue | Sweet spot 2×20 | 65 min | `sweet-spot-2x20.zwo` |
| Wed | Endurance Z2 | 90 min | Easy outdoor or indoor |
| Thu | VO2max 5×4 | 60 min | `vo2max-5x4.zwo` |
| Fri | Strength + core | 45 min | See strength section |
| Sat | Group ride | — | Social, no structure |
| Sun | Long endurance | 120 min | Z2 outdoor |
```

### 3. Structured session detail blocks

One subsection per structured bike day. Convert every % FTP target to watts using the week's FTP.

```markdown
### Tuesday – Sweet spot 2×20
File: `sweet-spot-2x20.zwo`
Targets: 90% FTP · 2 × 20 min @ **221 W** (90% of 245 W), 5 min easy @ 123 W between.
Warmup 10 min ramp 45→75%, cooldown 10 min.
Total: ~65 min.
```

### 4. Group-ride guidance

One short paragraph per group-ride day when relevant (e.g. "Ride at the group's pace; if the bunch rode hard treat it as the second hard day and swap Thursday to easy Z2.").

### 5. Strength / core

When strength is scheduled include the full exercise list with sets, reps, load and rest cues in the athlete's language. For a full gym session also save a separate `YYYY-Wnn-strength.md`; reference it here. Every row states a load and an RIR target, and folds the one-line reason for the exercise into `Load / cue`; the `workouts.target` JSON shape stays `{"exercise","sets_reps","load_cue","rest"}` (reason travels inside `load_cue`). The full file layout (warm-up, cool-down, "Why this session") is in `references/strength-session.md`.

```markdown
## Strength & core (Friday)
Full session details: `2026-W26-strength.md`

| Exercise | Sets × Reps | Load / cue | Rest |
|----------|-------------|------------|------|
| Trap-bar deadlift | 3 × 6–8 | 50 kg, RIR 2–3; upright torso, easier on a tight lower back | 2–3 min |
| Step-up | 3 × 8 / leg | bodyweight, RIR 3; controlled, builds single-leg force | 90 s |
| Plank | 3 × 45 s | bodyweight, RIR 3; brace hard, holds the riding position | 45 s |
```

### 6. Fueling (optional)

Include when the week has at least one structured/long session, or the
athlete has an active `targetEvent`. Summarize the week's daily carb targets
by day type and the on-bike fueling rate for the week's hardest day(s), per
`references/nutrition.md`. When `targetEvent` resolves to an event file, add
one line for that file's fueling delta rather than restating the shared
model. When `mealPlanEnabled` is `true`, add one more line referencing the
week's itemized meal plan (e.g. "Full day-by-day meal plan:
`2026-W26-meals.md`"), the same way section 5 references a full strength
session — never duplicate the meal list inline here.

```markdown
## Fueling
- **Daily carb targets:** Rest 3-4 g/kg · Endurance 5-6 g/kg · Structured/key 6-7 g/kg · Long 7-8 g/kg.
- **On-bike (Thu, Sun):** Thu 60-90 g/h from 75 min in · Sun 80-120 g/h, building through the ride.
- **Hydration:** 500-750 ml/h baseline; add electrolyte from hour one on Sunday's long ride.
- **Event delta (Badlands):** gut-train Sunday's long ride toward the top of the 90-120 g/h range and rehearse desert-heat electrolyte loading.
```

### 7. Notes / adjustments (optional)

Any week-level caveats: fatigue adjustments, weather, race prep.

## Race-day fueling & pacing deliverable (event week only)

Once the athlete is inside the final taper block before `eventDate`,
produce a separate file `<event-id>-race-day-plan.md` (e.g.
`badlands-ultra-race-day-plan.md`) covering the event itself rather than a
training week, and reference it from that week's plan file the same way a
full strength session is referenced from section 5.

```markdown
# Race Day Plan – <Event display name> (<event date>)

## Pacing
<Segment-by-segment power/HR targets and expected duration, derived from
the event file's course profile (climbs, exposed sections, elevation-
concentrated blocks) and the athlete's FTP/zones.>

## Fueling schedule
<Carb-loading window (36-48 h out), pre-race meal timing, on-course ramp
(conservative start building to the full trained rate), and the sustained
on-bike g/h target held for the event's duration — layering the event
file's fueling delta on top of `references/nutrition.md`'s race-day
principles rather than restating them.>

## Hydration & electrolyte plan
<ml/h and sodium mg/h targets, adjusted for the event's known climate/
exposure, with a heat contingency.>

## Contingencies
<GI-distress fallback, bonk recovery, and — for multi-day/overnight
formats — a sleep-deprivation/caffeine-timing plan, per
`references/nutrition.md`'s race-day fueling principles.>
```

---

## Example (English, metric, FTP 245 W)

```markdown
# Training Week 2026-W26
**Goal:** Sit comfortably in a 34 km/h group and follow attacks.
**Focus:** Two structured sessions midweek; weekends social. Lift FTP so sitting in the bunch stops being a threshold effort.
**FTP:** 245 W · **Rider type:** Puncheur · **Target W/kg:** 3.7
**Last week:** 4 rides, 288 km, 8.5 h, 741 m elevation, 2 hard days — good load, no extra fatigue.

## Schedule

| Day | Session | Duration | Notes |
|-----|---------|----------|-------|
| Mon | Rest | — | Recover |
| Tue | Sweet spot 2×20 | 65 min | `sweet-spot-2x20.zwo` |
| Wed | Endurance Z2 | 90 min | Easy ride 60–70% FTP (147–172 W) |
| Thu | VO2max 5×4 | 60 min | `vo2max-5x4.zwo` |
| Fri | Strength + core | 45 min | See strength section |
| Sat | Group ride | — | Social, no structure |
| Sun | Long endurance | 120 min | Z2 outdoor |

## Structured sessions

### Tuesday – Sweet spot 2×20
File: `sweet-spot-2x20.zwo`
Targets: 90% FTP · 2 × 20 min @ **221 W**, 5 min easy @ **123 W** between.
Warmup 10 min ramp 45→75%, cooldown 10 min.
Total: ~65 min.

### Thursday – VO2max 5×4
File: `vo2max-5x4.zwo`
Targets: 115% FTP · 5 × 4 min @ **282 W**, 4 min easy @ **123 W** between. High cadence 95+ rpm.
Warmup 15 min, cooldown 10 min.
Total: ~60 min.

## Group rides

**Saturday / Sunday:** Ride at the group's pace — no power targets. If both weekend rides ran hard, swap Thursday to easy Z2 next week.

## Strength & core (Friday)
Full session details: `2026-W26-strength.md`

| Exercise | Sets × Reps | Load / cue | Rest |
|----------|-------------|------------|------|
| Trap-bar deadlift | 3 × 6–8 | 50 kg, RIR 2–3; upright torso, easier on a tight lower back | 2–3 min |
| Step-up | 3 × 8 / leg | bodyweight, RIR 3; controlled, builds single-leg force | 90 s |
| Plank | 3 × 45 s | bodyweight, RIR 3; brace hard, holds the riding position | 45 s |
| Pallof press | 3 × 10/side | light band, RIR 3; resist the rotation | 45 s |
```

## Example with an active event (header + fueling snippet)

Same athlete, but with `targetEvent: badlands-ultra` and `eventDate` 90 days
out. Only the header and the new fueling section are shown — the rest of the
file follows the same structure as the baseline example above, with
event-specific archetypes (e.g. loaded-bike climbing) swapped in per
`badlands-ultra.md`'s session overlay.

```markdown
# Training Week 2026-W26
**Goal:** Finish Badlands Ultra within the cutoff.
**Focus:** Build back-to-back long-day volume; keep gut-training the on-bike carb rate.
**FTP:** 245 W · **Rider type:** Puncheur, overridden toward durability/fat-max endurance · **Target W/kg:** 3.7
**Last week:** 4 rides, 288 km, 8.5 h, 741 m elevation, 2 hard days — good load, no extra fatigue.
**Event countdown:** 90 days to Badlands Ultra · Phase: Build

## Fueling
- **Daily carb targets:** Rest 3-4 g/kg · Endurance 5-6 g/kg · Structured/key 6-7 g/kg · Long 7-8 g/kg.
- **On-bike (Sat, Sun back-to-back):** 70-80 g/h both days, building toward the 90-120 g/h race target across the block.
- **Hydration:** 500-750 ml/h baseline; add electrolyte from hour one on both back-to-back days.
- **Event delta (Badlands):** rehearse desert-heat electrolyte loading on Saturday's session if conditions allow.
```
