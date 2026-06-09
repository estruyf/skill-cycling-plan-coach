# Standard session library

All targets are % FTP. Convert to watts in the description when FTP is known. Two hard sessions per week is the ceiling for the polarized model; everything else stays easy.

## Bike — hard sessions (pick 2/week)

### VO2max
- **Shape:** 4–5 × 4 min @ 110–120% FTP, equal (4 min) recovery @ ~50%.
- **Progression:** start at 4 reps / 110%, build toward 5 reps / 115–120% over a block.
- **Cadence:** slightly high (90–100 rpm) to keep it cardiovascular.
- **Purpose:** raises the ceiling so repeated surges become survivable.

### 40/20s (or 30/30s)
- **Shape:** 2–3 sets of 8–10 reps, 40s @ 118–125% / 20s @ ~50%. 5 min easy between sets.
- **Variant:** 30/30s (30s @ 115–120% / 30s easy) for slightly lower peak, more reps.
- **Purpose:** the single most race-specific session for answering attacks without cracking.

### Over-unders
- **Shape:** 3 × (3 min @ 95% / 1 min @ 105%), 5 min easy between. Build toward 4 min over/under blocks.
- **Purpose:** tolerate the pace yo-yo of sitting in a fast bunch.

### Sweet spot
- **Shape:** 2 × 20 min @ 88–94% FTP, 5 min easy between. Build toward 2 × 25 or 3 × 15.
- **Purpose:** lift sustained power with low recovery cost — the "spare" hard slot when fresh.

## Bike — easy / supporting

### Endurance (Z2)
- **Shape:** 60–180 min @ 60–70% FTP, genuinely easy. Optional 3–5 × 10s neuromuscular spin-ups inside it.
- **Purpose:** volume that builds without denting recovery. This is most of the week.

### Group-ride placeholder
- Use a `<FreeRide>` block for the Saturday TTC ride rather than forcing power targets — it's the real-world hard session some weeks. If it lands as one of the two hard days, drop a structured session that week.

## Example polarized week

| Day | Session | Format |
|---|---|---|
| Mon | Rest or easy spin | — / short Z2 .zwo |
| Tue | VO2max 5×4 | .zwo |
| Wed | Endurance Z2 | .zwo or outdoor |
| Thu | 40/20s 3×9 | .zwo |
| Fri | Rest / easy | — |
| Sat | TTC group ride | outdoor (counts as hard) |
| Sun | Long endurance | .zwo or outdoor |

If Saturday is hard, keep Tue **or** Thu hard, not both — never three hard days.

## Strength — cycling-specific (gym, deliver as markdown)

Goal is durable power and injury resilience, not bulk. 2×/week off-season, 1×/week in-season as maintenance. `.zwo` cannot represent this.

| Exercise | Sets × Reps | Load / cue | Rest |
|---|---|---|---|
| Back squat or trap-bar deadlift | 4 × 5 | Heavy, full control | 2–3 min |
| Bulgarian split squat | 3 × 8 / leg | Single-leg balance + strength | 90 s |
| Romanian deadlift | 3 × 8 | Posterior chain, hinge | 90 s |
| Calf raise | 3 × 12 | Tendon resilience | 60 s |
| Plank + side plank | 3 × 45 s | Core for position stability | 45 s |
| Pallof press | 3 × 10 / side | Anti-rotation core | 45 s |

Keep heavy lower-body work away from hard bike days (ideally same day as a hard ride or on a rest day, never the day before VO2/intervals).

## Cardio — supporting (non-bike)

For cross-training or active recovery when off the bike:
- Easy zone-2 run or brisk walk, 30–45 min, conversational. Treadmill version can be a `run` `.zwo` if wanted.
- Mobility / stretching block, 15–20 min, hips and thoracic spine (cycling posture debt).

Keep all of this genuinely easy — its job is to add aerobic minutes and mobility without competing with the two hard bike sessions for recovery.
