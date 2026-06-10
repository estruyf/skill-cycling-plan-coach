# WeekPlan – markdown format

One file per week, named `YYYY-Wnn-plan.md`. Everything the athlete reads is in the config `language` and `units`. Watt targets appear as both `% FTP` and converted watts. Filenames stay lowercase-hyphenated English.

## File structure

### 1. Header block

```markdown
# Training Week YYYY-Wnn
**Goal:** <goal from config>
**Focus:** <one-line week aim>
**FTP:** <N> W · **Rider type:** <type> · **Target W/kg:** <N> *(omit if not set)*
**Last week:** <one-sentence Strava summary>
```

### 2. Schedule table

List every day Mon–Sun. Structured sessions must show the `.zwo` filename.

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

When strength is scheduled include the full exercise list with sets, reps, load and rest cues in the athlete's language. For a full gym session also save a separate `YYYY-Wnn-strength.md`; reference it here.

```markdown
## Strength & core (Friday)
Full session details: `2026-W26-strength.md`

| Exercise | Sets × Reps | Load / cue | Rest |
|----------|-------------|------------|------|
| Squat | 4 × 5 | heavy, full control | 2–3 min |
| Romanian deadlift | 3 × 8 | hinge from the hips | 90 s |
| Plank | 3 × 45 s | brace hard | 45 s |
```

### 6. Notes / adjustments (optional)

Any week-level caveats: fatigue adjustments, weather, race prep.

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
| Squat | 4 × 5 | heavy, full control | 2–3 min |
| Romanian deadlift | 3 × 8 | hinge from the hips | 90 s |
| Plank | 3 × 45 s | brace hard | 45 s |
| Pallof press | 3 × 10/side | resist the cable | 45 s |
```
