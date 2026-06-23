# Garmin Coach Export — reading and using the data

Athletes on Garmin devices can export a structured JSON snapshot covering zones, readiness, training load, and recent activities. This data supplements or replaces the Strava pull when the athlete provides it. It is the only source in this skill for readiness signals (HRV, body battery, sleep) and load analytics (ATL/CTL/ACWR).

## How to get the export

The athlete exports via the **Garmin Workout Importer** Chrome extension:
https://chromewebstore.google.com/detail/garmin-workout-importer/faebbfokokipdpkbolpbpfadmgdbanpo

Ask the athlete to run the export and paste the JSON before each weekly planning session. Daily exports are not necessary — one per planning cycle is enough. Ideally exported the morning of the planning session so readiness reflects the current state.

## When to ask for it

During the weekly intake, after the athlete confirms availability and before session design:

> "Do you have a Garmin Coach export from today? Paste the JSON and I can factor in your readiness score, HRV, and training load. If not, no problem — I'll use Strava data and your config."

If both Strava and a Garmin export are provided:
- Use **Strava** for activity names and relative effort (archetype extraction)
- Use **Garmin** for zones, FTP, LTHR, readiness, and TSS/NP on activities
- If FTP differs between the two, note the discrepancy and ask the athlete which to use (Garmin's FTP auto-detection is often more up to date)

## JSON structure and field mapping

### `athlete` block — zones and physiology

| Garmin field | Usage |
|---|---|
| `athlete.ftp` | Use as the week's FTP. Same authority as Strava zones. Overrides `fallbackFtp`. |
| `athlete.vo2max` | Context for ceiling and VO2max session design. Note it in the plan header. |
| `athlete.weight_kg` | Compare to `athlete.json weightKg`. If different, note the discrepancy and ask. |
| `athlete.lthr` | Lactate threshold heart rate. Use for HR cues alongside power targets in the plan. |
| `athlete.zones.power[]` | 7-zone power model. `floor_w` is the zone floor. Use these directly instead of calculating from FTP%. |
| `athlete.zones.hr[]` | 5-zone HR model. `floor_bpm` is the zone floor. Use for HR guidance on easy/outdoor rides. |

**Power zone labels** (Garmin 7-zone model):

| Zone | Name | FTP % (approx) |
|------|------|----------------|
| 1 | Active recovery | < 56% |
| 2 | Endurance | 56–75% |
| 3 | Tempo | 76–90% |
| 4 | Lactate threshold | 91–105% |
| 5 | VO2max | 106–120% |
| 6 | Anaerobic | 121–150% |
| 7 | Neuromuscular | > 150% |

### `readiness` block — daily state

Read these every time an export is provided. They directly influence how aggressive the week's design should be.

| Garmin field | How to use |
|---|---|
| `readiness.training_readiness_score` | 0–100. See decision table below. |
| `readiness.training_readiness_level` | Text label from Garmin: `low`, `moderate`, `high`. Use as a quick check. |
| `readiness.hrv_status` | `balanced` = normal. `unbalanced` = extra recovery needed. `low` = significant stress, reduce intensity. |
| `readiness.hrv_last_night_avg` | Single-night HRV. Compare to 7-day avg: if ≥ 10% above, athlete is primed; if ≥ 10% below, flag fatigue. |
| `readiness.hrv_7day_avg` | Baseline HRV. Lower is more stressed. |
| `readiness.body_battery_high` | Garmin's energy reserve (0–100). < 50 at the start of a planning week = warn the athlete to check their sleep before the first hard session. |
| `readiness.sleep_score` | 0–100. < 70 = add one easier day or reduce hard-session reps this week. |
| `readiness.sleep_total_hours` | Context for sleep quality interpretation. < 6 h + low score = treat as if `hrv_status` were `unbalanced`. |

**Training readiness decision table:**

| Score | Action |
|---|---|
| ≥ 70 (high) | Athlete is primed. Can add one rep or 5% intensity to a hard session if the load and ACWR allow. |
| 40–69 (moderate) | Normal plan. No adjustments. |
| < 40 (low) | Soften the week: convert one hard session to Z2, shorten the long ride, and note the reason in the plan. |

### `load` block — fitness and fatigue

| Garmin field | How to use |
|---|---|
| `load.ctl` | Chronic Training Load (CTL) — the athlete's fitness baseline (~42-day weighted average). Higher = more fit. |
| `load.atl` | Acute Training Load (ATL) — recent fatigue (~7-day weighted average). |
| `load.acwr` | Acute:Chronic Workload Ratio = ATL ÷ CTL. Key injury and performance signal. See table below. |
| `load.training_status` | Garmin's own label: `maintaining`, `peaking`, `recovering`, `overreaching`, `detraining`. Use it as a one-line status note in the plan. |
| `load.recovery_time_hours` | Do not schedule a hard session within this window from the export timestamp. If the first hard day of the week falls inside it, move it one day later or swap it to Z2. |

**ACWR interpretation:**

| ACWR | Meaning | Action |
|---|---|---|
| < 0.7 | Under-training / detrained | Safe to ramp volume. Add volume to Z2 days before adding intensity. |
| 0.7–1.3 | Optimal zone | Normal plan. |
| 1.3–1.5 | Caution | Reduce one hard session to sweet spot or Z2. Monitor closely. |
| > 1.5 | High injury risk | Recovery week: cap all sessions at sweet spot, extend Z2 time, skip the second hard session. |

### `recent_activities[]` — training history

Use when Strava activity names are unavailable. Each entry has `date`, `type`, `tss`, `normalized_power`, `duration_min`, and `avg_cadence`.

**Classify effort from NP/FTP ratio** (use `athlete.ftp`):

| NP ÷ FTP | Classification |
|---|---|
| < 0.70 | Endurance / recovery |
| 0.70–0.84 | Tempo / aerobic |
| 0.85–0.94 | Sweet spot / threshold |
| 0.95–1.05 | Over-threshold |
| > 1.05 | VO2max / anaerobic |

**Deriving last week's load** (when no TSS target exists in config):
- Sum TSS over the last 7 days from `recent_activities`.
- A typical productive week for a 40h/year athlete sits between 400–600 TSS. Adjust the new week's targets to stay within ~10–15% of the last completed week's TSS unless ACWR says otherwise.

**Activity type mapping** (Garmin → skill):

| Garmin `type` | Treat as |
|---|---|
| `road_biking` | Outdoor ride |
| `indoor_cycling` | Zwift / trainer ride |
| `mountain_biking` | Outdoor ride (lower TSS assumption) |
| `virtual_ride` | Indoor trainer |

## Surfacing Garmin data in the plan

Add a **Readiness** line to the plan header whenever Garmin data is provided:

```markdown
**Readiness:** score 51 / moderate · HRV balanced (58 vs 43 avg) · Sleep 95/100 · ACWR 0.80 · Status: maintaining · Recovery window: 42 h
```

State any adjustments the readiness data triggered in plain language, e.g.:
> "ACWR is at 0.80 — good range, no reduction needed. Recovery window of 42 h expires Tuesday morning, so the first hard session stays on Wednesday."
