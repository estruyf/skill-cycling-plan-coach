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

Start a returning archetype at the step the athlete last completed, then advance by one step. Reset to Step 1 after a rest or recovery week. **After Step 3:** rotate to the next archetype in the rotation table for that rider type; do not invent a Step 4.

## Bike - hard sessions (pick 2/week)

### VO2max
- **Shape:** 4-5 x 4 min @ 110-120% FTP, equal (4 min) recovery @ ~50%.
- **Progression:** start at 4 reps / 110%, build toward 5 reps / 115-120% over a block.
- **Cadence:** slightly high (90-100 rpm) to keep it cardiovascular.
- **Purpose:** raises the ceiling so repeated surges become survivable.

### 40/20s (or 30/30s)
- **Shape:** 2-3 sets of 8-10 reps, 40s @ 118-125% / 20s @ ~50%. 5 min easy between sets.
- **Variant:** 30/30s (30s @ 115-120% / 30s easy) for slightly lower peak, more reps.
- **Purpose:** race-specific session for answering attacks without cracking.

### 30/15s (Rønnestad)
- **Shape:** 3 sets × 13 reps, 30s @ 110–115% / 15s @ ~50–55%. 3 min easy between sets.
- **Progression:** start at 2 sets × 13 reps, build to 3 sets, then increase intensity to 112–115%.
- **Cadence:** accelerate hard in the first 10s of each work rep, target 95–105 rpm. Drop cadence on the 15s rest but stay pedalling — no coasting.
- **Purpose:** maximises accumulated time at ≥90% VO₂max. Rønnestad et al. showed 3 × 13 reps produces significantly greater VO₂max and power gains than traditional 4–5 min long intervals in well-trained cyclists. The 15s is not full recovery — it should feel like tempo, just enough to re-hit the next 30s effort hard.

### Over-unders
- **Shape:** 3 x (3 min @ 95% / 1 min @ 105%), 5 min easy between. Build toward 4 min over-under blocks.
- **Purpose:** tolerate pace variability in a fast bunch.

### Threshold
- **Shape:** 2 × 15 min @ 95–100% FTP, 5 min easy between. Build toward 2 × 20 or 3 × 15.
- **Purpose:** lift the FTP ceiling; close the gap between current threshold and VO2max pace.

### Sweet spot
- **Shape:** 2 x 20 min @ 88-94% FTP, 5 min easy between. Build toward 2 x 25 or 3 x 15.
- **Purpose:** lift sustained power with manageable fatigue.

## Bike - easy / supporting

### Endurance (Z2)
- **Shape:** 60-180 min @ 60-70% FTP, genuinely easy. Optional 3-5 x 10s neuromuscular spin-ups.
- **Purpose:** volume that builds fitness without denting recovery.

### Group-ride placeholder
- Use a `<FreeRide>` block for social/group rides rather than forcing power targets.
- If a group ride is the hard session, drop one structured hard session that week.

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

Goal is durable power and injury resilience, not bulk. 2x/week off-season, 1x/week in-season as maintenance. `.zwo` cannot represent this. For exercise selection, sets, reps, and cues see `references/strength-library.md`.

Keep heavy lower-body work away from hard bike days (ideally same day as a hard ride or on a rest day, never the day before VO2/intervals).

## Cardio - supporting (non-bike)

For cross-training or active recovery when off the bike:
- Easy zone-2 run or brisk walk, 30-45 min, conversational. Treadmill version can be a `run` `.zwo` if wanted.
- Mobility / stretching block, 15-20 min, hips and thoracic spine.

Keep all of this genuinely easy so it does not compete with hard bike sessions for recovery.
