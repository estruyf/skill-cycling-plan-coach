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
