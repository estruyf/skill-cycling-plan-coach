# Training model - principles

Generic principles for building the week. Session priorities come from the detected rider type (`rider-types.md`) and the athlete's goal. FTP, weight, target and goal come from `athlete.json` and the Strava pull.

## The limiter

Find the limiter from the data, not from a template. A strong top end with modest sustained power means FTP is the limiter (prioritise sweet spot, threshold, VO2). Strong sustained power with a weak top end means repeatability and VO2 are the limiter (prioritise VO2 and anaerobic work). Use `rider-types.md`.

## Week structure

- Polarized: at most `maxStructuredSessions` structured key sessions midweek, the rest genuinely easy.
- Group-ride days (`groupRideDays`) are social, at the group's pace, no structure forced. Group riding is also good specific training for bunch goals.
- If a group ride ran hard, treat it as a quality day and soften the next midweek session. Never three hard days back to back.
- Steer by power, not heart rate. Put watt targets first and allow backing off on feel.

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
- Endurance Z2: 60-180 min at 60-70% FTP, genuinely easy.
