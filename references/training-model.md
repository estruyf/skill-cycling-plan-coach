# Training model - principles

Generic principles for building the week. Session priorities come from the detected rider type (`rider-types.md`) and the athlete's goal. FTP, weight, target and goal come from `athlete.json` and the Strava pull.

## The limiter

Find the limiter from the data, not from a template. A strong top end with modest sustained power means FTP is the limiter (prioritise sweet spot, threshold, VO2). Strong sustained power with a weak top end means repeatability and VO2 are the limiter (prioritise VO2 and anaerobic work). Use `rider-types.md`.

## Week structure

- Polarized: at most `maxStructuredSessions` structured key sessions midweek, the rest genuinely easy.
- Group-ride days (`groupRideDays`) are social, at the group's pace, no structure forced. Group riding is also good specific training for bunch goals.
- If a group ride ran hard, treat it as a quality day and soften the next midweek session. Never three hard days back to back.
- Steer by power, not heart rate. Put watt targets first and allow backing off on feel.

## 4-week block periodization

Default to a 3-build + 1-taper pattern unless the athlete's load history says otherwise:

- **Weeks 1-3:** Progressive overload — increase duration or intensity of the key sessions by one step each week (use the progression table in `workout-library.md`).
- **Week 4:** Recovery/test week — reduce midweek structured sessions to one, shorten the long ride, and if appropriate add a segment attempt or time trial effort at the end of the week to measure adaptation.

Adapt the rhythm for masters athletes (50+): 2-build + 1-taper every 3 weeks.

## Ramp-in for a new or returning athlete

`garmin-data.md`'s ACWR table is the live signal for this when a Garmin export is available (< 0.7 = under-trained/detrained, safe to ramp volume before intensity). When there's no Garmin export — most likely at first onboarding, before any data pull — use `currentTrainingStatus` from `athlete.json` as the fallback:

- **`consistent`:** no special ramp; proceed with the standard 3-build + 1-taper block below.
- **`returningFromBreak`:** treat the first 1-2 weeks like a mini ramp-in regardless of `trainingBreakDuration` — reduce structured intensity (drop to 1 key session instead of `maxStructuredSessions`) and grow duration on easy days before reintroducing full intensity. A longer or more recent break warrants a longer ramp; say so to the athlete in one line.
- **`new`:** start the block itself conservative — favor Z2 endurance and skill/handling work over structured intensity for the first 2-3 weeks, then introduce the standard session shapes below.

Once live Garmin data is available in a later run, it supersedes this fallback the same way live FTP supersedes `fallbackFtp`.

## Energy availability caution

If `currentWeightGoalDirection` is `losing` or `bodyCompositionGoal` is `significantLoss` — especially alongside a high-volume week or an ultra-distance `targetEvent` — flag the load/fueling tension explicitly rather than silently stacking both: a large calorie deficit combined with high training load raises real overtraining/under-fueling risk (see `nutrition.md`'s energy availability guidance for the fueling side of this). Don't reduce the training plan's volume/intensity to solve it unilaterally; state the tension in one line and let the athlete decide, adding that a doctor or dietitian is worth involving for a significant weight-loss goal run alongside heavy training.

## Recovery rules by age

Apply these on top of the polarized structure. Read `age` from `athlete.json`.

- **Under 40:** one easy or rest day between hard sessions is sufficient.
- **40–49 (masters):** aim for two easy days between hard sessions; avoid back-to-back hard days entirely.
- **50+ (senior masters):** default to two easy or rest days between hard sessions; reduce total weekly volume before reducing intensity; recovery weeks every 2–3 weeks instead of every 4.

## Standard session shapes

- Sweet spot: 2 x 20 min at ~90% FTP, 5 min easy between. Grows to 2 x 25.
- Threshold over-unders: 3 sets of 8 min, 3 min at 95% / 1 min at 105%, 5 min easy between sets.
- VO2max: 5 x 4 min at ~115% FTP, 4 min easy between, high cadence (95+).
- Anaerobic: 40/20s or 30/30s, 2-3 sets of 8-10 reps (for diesels and criterium goals).
- Endurance Z2: 60-180 min at 60-70% FTP, genuinely easy (85-95 RPM).
- Muscle tension (MT): 3-5 x 6-8 min at 70-80% FTP at 55-65 RPM (low cadence), seated. Neuromuscular recruitment without high cardio cost; useful before climbing blocks.
- Stomps: 6-10 x 10-12s maximal seated effort from a rolling start, big gear. Near full recovery between reps. Neuromuscular power, very low volume.
