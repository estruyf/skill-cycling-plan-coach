# Standard session library

All targets are % FTP. Convert to watts in the description when FTP is known. Two hard sessions per week is the ceiling for the polarized model; everything else stays easy.

## Session rotation and progression

Never repeat the exact same archetype two weeks in a row unless the athlete is in a deliberate progression block. Use the archetypes extracted from last week's Strava activities (see `strava-pull.md`) to choose something different or to advance the progression.

**Rotation order** (cycle through within the rider type's priority list):

Use the ISO 8601 week number mod 3 to pick the row (e.g. week 27 → 27 % 3 = 0).

| Week mod 3 | Sprinter / puncheur | All-rounder | Diesel |
|------------|---------------------|-------------|--------|
| 0 | Sweet spot + Over-unders | Sweet spot + 30/15s | 30/15s + 40/20s |
| 1 | Threshold + 30/15s | Over-unders + 40/20s | Sweet spot + Over-unders |
| 2 | Over-unders + Sweet spot | 30/15s + Sweet spot | 40/20s + 30/15s |

> **30/15s (Rønnestad) replaces the classic VO2max slot throughout.** Research (Rønnestad et al.) shows 3 × 13 reps outperform 4–5 min evenly-paced intervals for VO2max and power gains in well-trained cyclists. Classic VO2max (4×4 min) may substitute any 30/15s slot if the athlete genuinely prefers longer efforts.

**Progression within an archetype** (when the same type repeats after a gap):

| Archetype | Step 1 | Step 2 | Step 3 |
|-----------|--------|--------|--------|
| Sweet spot | 2 × 20 min @ 88% | 2 × 20 min @ 90% | 2 × 25 min @ 90% or 3 × 15 min @ 92% |
| 30/15s (Rønnestad) | 2 sets × 13 reps @ 110% | 3 sets × 13 reps @ 110% | 3 sets × 13 reps @ 112–115% |
| VO2max | 4 × 4 min @ 110% | 5 × 4 min @ 112% | 5 × 4 min @ 115–120% |
| 40/20s | 2 sets × 8 reps @ 118% | 2 sets × 9 reps @ 120% | 3 sets × 8 reps @ 120% |
| Over-unders | 3 × (3 min / 1 min) | 3 × (4 min / 1 min) | 4 × (3 min / 1 min) |
| Threshold | 2 × 15 min @ 95% | 2 × 20 min @ 97% | 3 × 15 min @ 97% |
| Muscle tension | 3 × 6 min @ 75% / 55-65 RPM | 4 × 6 min @ 78% | 4 × 8 min @ 80% |
| Stomps | 6 × 10s max | 8 × 10s max | 8 × 12s max |

Start a returning archetype at the step the athlete last completed, then advance by one step. Reset to Step 1 after a rest or recovery week. **After Step 3:** rotate to the next archetype in the rotation table for that rider type; do not invent a Step 4.

### Logged-outcome rules (override the default advance-by-one-step rule)

Once an athlete logs a session's outcome (web UI, per `documents/multi-event-and-webui-tasks.md` B3/B8), its status overrides the default "advance by one step" rule above for that archetype's next scheduled occurrence. These rules apply equally to the standard archetypes above and to the event-driven overlay archetypes' progression table further down this file. `SKILL.md` Step 1 reads back recent `workout_logs` each run when `supabaseAthleteId` is set (per B8) and applies this table; when an archetype's last occurrence has no logged status (or `supabaseAthleteId` is `null`), the plain default rule stands.

| Logged status | Adjustment at the archetype's next scheduled occurrence |
|---|---|
| `completed_as_planned` | Advance one step, per the default rule above. |
| `completed_easier_than_planned` | Advance two steps instead of one (skip a step), capped at Step 3 — never jump past Step 3 in one move. |
| `completed_harder_than_planned` | Hold at the same step; do not advance. The prescribed load was already at or above what the athlete could handle. |
| `failed_too_hard` | Do not advance; repeat the same step. If this is the second consecutive `failed_too_hard` on this archetype, drop back one step instead of repeating, and substitute an easier variant of the archetype where one exists (e.g. Threshold → Sweet spot, 40/20s → 30/15s Step 1). State the adjustment and why in the next plan's last-week summary. |
| `skipped` (first occurrence) | No adjustment — reschedule at the athlete's last-completed step, its normal next slot in the rotation. |
| `skipped` (this archetype skipped twice or more in a row) | Reset to Step 1 next time scheduled, same as after a rest/recovery week. State this explicitly in the next plan's summary rather than silently re-offering the same step. |

**WHOOP objective cross-check (WD2, additive to the table above, not a parallel system).** When a `workout_logs` row has `source = 'whoop'` (per `documents/whoop-integration-tasks.md` WD1: WHOOP's per-workout strain/HR matched back to the scheduled session by time overlap), its `status` was already mechanically inferred from WHOOP's strain reading against the archetype's expected intensity:

- An archetype scheduled as an easy/endurance/recovery session (Z2, endurance, recovery) whose WHOOP-sourced strain reads in the strenuous-or-higher band (≥14 on WHOOP's 0–21 strain scale — the single workout's own strain score, same numeric bands `references/whoop-data.md` defines for the whole day's strain) is logged as `completed_harder_than_planned` — even absent a separate athlete-entered RPE for that session.
- An archetype scheduled as a hard session (VO2max/30-15s/40-20s/over-unders/threshold/sweet spot/stomps) whose WHOOP-sourced strain reads in the light band (≤9) is logged as `completed_easier_than_planned`.
- Otherwise it is logged as `completed_as_planned` — a WHOOP-sourced log is not a license to guess at a status the strain reading doesn't clearly support.

**When both a `web-ui` (athlete-entered RPE) log and a `whoop`-sourced log exist for the same `workout_id`:** the more severe of the two status classifications wins, using this severity order (mildest to most severe): `completed_easier_than_planned` < `completed_as_planned` < `completed_harder_than_planned` < `failed_too_hard` < `skipped`. This is stated explicitly so the two logs are never silently averaged or arbitrarily one preferred — e.g. an athlete-entered `completed_as_planned` alongside a WHOOP-sourced `completed_harder_than_planned` for the same session resolves to `completed_harder_than_planned` and applies that row's adjustment above.

## Bike - hard sessions (pick 2/week)

### VO2max
- **Shape:** 4-5 x 4 min @ 110-120% FTP, equal (4 min) recovery @ ~50%.
- **Progression:** start at 4 reps / 110%, build toward 5 reps / 115-120% over a block.
- **Cadence:** 90-100 RPM — keep it cardiovascular, not a grind.
- **Purpose:** raises the ceiling so repeated surges become survivable.

### 40/20s (or 30/30s)
- **Shape:** 2-3 sets of 8-10 reps, 40s @ 118-125% / 20s @ ~50%. 5 min easy between sets.
- **Variant:** 30/30s (30s @ 115-120% / 30s easy) for slightly lower peak, more reps.
- **Cadence:** 95-105 RPM on the work interval.
- **Purpose:** race-specific session for answering attacks without cracking.

### 30/15s (Rønnestad)
- **Shape:** 3 sets × 13 reps, 30s @ 110–115% / 15s @ ~50–55%. 3 min easy between sets.
- **Progression:** start at 2 sets × 13 reps, build to 3 sets, then increase intensity to 112–115%.
- **Cadence:** accelerate hard in the first 10s of each work rep, target 95–105 RPM. Drop cadence on the 15s rest but stay pedalling — no coasting.
- **Purpose:** maximises accumulated time at ≥90% VO₂max. Rønnestad et al. showed 3 × 13 reps produces significantly greater VO₂max and power gains than traditional 4–5 min long intervals in well-trained cyclists. The 15s is not full recovery — it should feel like tempo, just enough to re-hit the next 30s effort hard.

### Over-unders
- **Shape:** 3 x (3 min @ 95% / 1 min @ 105%), 5 min easy between. Build toward 4 min over-under blocks.
- **Cadence:** 90-100 RPM throughout — resist the urge to drop cadence on the over portions.
- **Purpose:** tolerate pace variability in a fast bunch.

### Threshold
- **Shape:** 2 × 15 min @ 95–100% FTP, 5 min easy between. Build toward 2 × 20 or 3 × 15.
- **Cadence:** 85-95 RPM on flat/rolling terrain.
- **Purpose:** lift the FTP ceiling; close the gap between current threshold and VO2max pace.

### Sweet spot
- **Shape:** 2 x 20 min @ 88-94% FTP, 5 min easy between. Build toward 2 x 25 or 3 x 15.
- **Cadence:** 85-95 RPM.
- **Purpose:** lift sustained power with manageable fatigue.

### Stomps
- **Shape:** 6-10 x 10-12s maximal seated effort in the biggest gear you can turn, from ~15 km/h. Full recovery between reps (3-5 min easy spinning).
- **Cadence:** 95+ RPM target once up to speed; the effort is about torque in the first seconds, not cadence.
- **Purpose:** neuromuscular power development — recruits fast-twitch fibers and builds the ability to generate very high force against resistance. Useful before sprinting or climbing blocks.
- **Caution:** keep the volume low and only use when legs feel fresh; these are very high muscular stress with low cardio cost.

### Descending Intervals (DI)
- **Shape:** maximal efforts that decrease in duration each rep — e.g. 3 min max / 4 min easy / 2 min max / 3 min easy / 1 min max / 2 min easy. Repeat the ladder 1-2x.
- **Cadence:** 110+ RPM throughout (out-of-saddle starts are fine).
- **Purpose:** trains the ability to go hard when already fatigued, and builds top-end repeatability. The decreasing duration rewards commitment: each rep is shorter but harder because recovery shortens too.

## Bike - easy / supporting

### Endurance (Z2)
- **Shape:** 60-180 min @ 60-70% FTP, genuinely easy. Optional 3-5 x 10s neuromuscular spin-ups.
- **Cadence:** 85-95 RPM.
- **Purpose:** volume that builds fitness without denting recovery.

### Muscle Tension (MT)
- **Shape:** 3-5 x 6-8 min @ 70-80% FTP at deliberately low cadence (55-65 RPM), seated, in a harder gear than normal. 3-4 min easy spin between reps.
- **Cadence:** 55-65 RPM — the low cadence is the stimulus; don't let it drift above 70.
- **Purpose:** improved neuromuscular recruitment by engaging more muscle mass during each pedal stroke. Builds leg strength and climbing-specific force without the cardio cost of threshold work. Useful before climbing blocks or for athletes whose muscles fatigue before their cardio.
- **Note:** this is distinct from low-cadence endurance riding; the effort is sustained and deliberate, not a gentle spin.

### Group-ride placeholder
- Use a `<FreeRide>` block for social/group rides rather than forcing power targets.
- If a group ride is the hard session, drop one structured hard session that week.

## Event-driven ultra-endurance archetypes

These only apply when an event's overlay (e.g. `references/events/badlands-ultra.md`'s
"Session archetypes + periodization overlay" section) adds them on top of the
standard rotation above — they are not part of the default polarized model and
should never appear for an athlete with no `targetEvent` set. Same target-%FTP
convention as the rest of this file.

### Long back-to-back days
- **Shape:** two consecutive long endurance rides (Z2, fat-max pace, 60-70%
  FTP) on consecutive days, e.g. Saturday + Sunday. Progress total
  back-to-back volume across the build phase, not single-ride duration alone.
- **Cadence:** 85-95 RPM, same as standard endurance riding.
- **Purpose:** trains the ability to keep producing usable power on tired legs
  the next day — the relevant training stress for a multi-day event is
  accumulated fatigue across consecutive long rides, not single-session peak
  load.

### Heat acclimation
- **Shape:** an endurance ride (Z2, 60-70% FTP) deliberately scheduled or
  dressed for heat exposure — outdoors during the hottest part of the day, or
  indoors with reduced cooling/extra layers if ambient heat isn't available.
- **Cadence:** 85-95 RPM — keep intensity in the standard endurance range;
  heat is the stimulus, not power.
- **Purpose:** drives the physiological adaptations (plasma volume expansion,
  earlier/higher sweat rate) that make sustained effort in hot, exposed
  terrain tolerable on race day.
- **Caution:** hydrate and fuel electrolytes deliberately; watch for
  heat-illness signs (dizziness, confusion, cessation of sweating) and stop if
  they appear. Don't stack with high intensity while still acclimating.

### Overnight / low-sleep simulation
- **Shape:** a single long ride that starts in the late evening and extends
  past the athlete's normal sleep hours, ridden at endurance/fat-max pace, to
  rehearse fueling and decision-making while sleep-deprived.
- **Cadence:** 85-95 RPM — pace stays endurance, not a hard session stacked on
  top of sleep loss.
- **Purpose:** the ability to fuel, navigate, and stay safe while
  sleep-deprived is trainable, not just a matter of toughness or grit.
- **Caution:** high fatigue cost — a peak-phase tool used sparingly (1-2 times
  total), never a base-phase or routine session. Ride somewhere lit/safe with
  someone aware of the route, given the added risk of night riding while
  fatigued.

### Loaded-bike climbing
- **Shape:** climbing repeats or a sustained climb ridden with
  race-representative bikepacking bag weight, at endurance/tempo pace
  (65-80% FTP).
- **Cadence:** 70-85 RPM — expect cadence to drop under load versus unloaded
  climbing.
- **Purpose:** builds climbing durability under the load the athlete will
  actually carry; handling, braking, and power delivery all change
  meaningfully with a loaded bike, so unloaded climbing repeats don't transfer
  fully.
- **Caution:** test the loaded setup (bag weight/placement) on a shorter climb
  before committing to a long loaded session.

**Progression within an event-overlay archetype:**

| Archetype | Step 1 | Step 2 | Step 3 |
|-----------|--------|--------|--------|
| Long back-to-back days | 2 x 3h @ Z2 | 2 x 4h @ Z2 | 2 x 5-6h @ Z2 (or matching the event's expected daily distance) |
| Heat acclimation | 60-90 min in heat | 2-3h in heat | 3-4h+ in heat, matching the event's expected daily heat exposure |
| Overnight / low-sleep simulation | Partial night (start ~22:00, ride to ~2-3am, 4-5h) | Full overnight (6-8h through to dawn) | Overnight into next day (8-10h+); cap at 1-2 total across the peak block |
| Loaded-bike climbing | One loaded climb, 20-30 min | 2-3 loaded climbs or 45-60 min continuous | Extended loaded climbing block matching the event's largest single continuous climb |

Reset to Step 1 after a rest or recovery week, same as the standard archetypes
above. The same logged-outcome rules above (`completed_easier_than_planned`,
`failed_too_hard`, repeated `skipped`, etc.) apply to these archetypes too.

**Scheduling (where these replace a standard slot):**

| Archetype | Replaces | Frequency |
|-----------|----------|-----------|
| Long back-to-back days | The weekend long endurance ride (both days) | 1x/week during build; drop to 2x/month during peak given fatigue cost |
| Heat acclimation | Any scheduled endurance slot | Increase frequency as the event nears; duration follows the progression table above |
| Overnight / low-sleep simulation | A Saturday or Sunday long ride | Peak phase only, 1-2 times total |
| Loaded-bike climbing | A mid-week or weekend endurance/climbing ride | 1x/week during build/peak |

These never substitute for a hard bike session (VO2max, threshold, etc.) —
they add to or replace endurance/supporting volume, keeping the
2-hard-sessions/week ceiling intact.

## Example polarized week

| Day | Session | Format |
|---|---|---|
| Mon | Rest or easy spin | - / short Z2 .zwo |
| Tue | 30/15s Rønnestad 3×13 | .zwo |
| Wed | Endurance Z2 | .zwo or outdoor |
| Thu | 40/20s 3x9 | .zwo |
| Fri | Rest / easy | - |
| Sat | Group ride | outdoor (counts as hard) |
| Sun | Long endurance | .zwo or outdoor |

If Saturday is hard, keep Tue **or** Thu hard, not both - never three hard days.

## Strength - cycling-specific (gym, deliver as markdown)

Goal is durable power and injury resilience, not bulk. 2x/week off-season, 1x/week in-season as maintenance. `.zwo` cannot represent this. For exercise selection see `references/strength-patterns.md`; for sets, reps, RIR and load see `references/strength-prescription.md`; for warm-up, cool-down and the output layout see `references/strength-session.md`.

Keep heavy lower-body work away from hard bike days (ideally same day as a hard ride or on a rest day, never the day before VO2/intervals).

## Cardio - supporting (non-bike)

For cross-training or active recovery when off the bike:
- Easy zone-2 run or brisk walk, 30-45 min, conversational. Treadmill version can be a `run` `.zwo` if wanted.
- Mobility / stretching block, 15-20 min, hips and thoracic spine.

Keep all of this genuinely easy so it does not compete with hard bike sessions for recovery.
