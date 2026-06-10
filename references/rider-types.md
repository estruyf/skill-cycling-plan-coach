# Rider type - derive it from the athlete's own power curve

Do not assume a rider type. Derive it from the power-duration data pulled from Strava, then let the type plus the goal set the session priorities. These are heuristics; adjust if the data is thin or a recent ride was not maximal.

## Inputs

From the power curve and FTP:

- sprint score = best 5 s power / FTP
- anaerobic score = best 1 min power / FTP
- vo2 score = best 5 min power / FTP

Use the most recent hard ride's best efforts. If a value looks low because the ride was not a max effort there (e.g. no sprint), lean on the durations that were tested.

## Classification

- Sprinter / puncheur: anaerobic score >= 1.8 or sprint score >= 3.8. Strong top end, the limiter is the sustained engine.
  - Priorities: sweet spot, threshold over-unders, VO2max. Almost no sprints or 30/30s, that strength already exists.
- Diesel / time-triallist: anaerobic score <= 1.45 and vo2 score <= 1.12. Strong sustained power, the limiter is the top end and repeatability.
  - Priorities: VO2max, anaerobic 40/20s and 30/30s, plus threshold to maintain. Add a little neuromuscular work.
- All-rounder: anything in between. Balanced profile.
  - Priorities: a mix, weighted by the goal (see below).

## Let the goal tune it

- Fast group ride or road race that ends in surges: bias toward threshold and VO2 for everyone, plus repeated efforts for diesels.
- Climbing or Gran Fondo: bias toward FTP and W/kg (sweet spot, threshold, long tempo) and watch body weight context.
- Criterium or track: bias toward repeated anaerobic and neuromuscular work.
- Time trial: bias toward threshold and FTP, sustained position.

State the detected type and the resulting focus in one line, e.g. "Detected: puncheur, so we prioritise FTP and threshold over your already strong sprint."
