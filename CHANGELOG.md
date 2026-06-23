# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-06-23

### Added

- **Muscle Tension (MT) session archetype** in `references/workout-library.md`. Structure: 3-5 × 6-8 min at 55-65 RPM / 70-80% FTP, seated with high resistance. Targets neuromuscular recruitment and climbing-specific leg force with low cardio cost.
- **Stomps session archetype** — 6-10 × 10-12s maximal seated efforts from a rolling start in the biggest gear. Pure neuromuscular power development, distinct from sprint intervals.
- **Descending Intervals (DI) archetype** — maximal efforts that decrease in duration each rep (e.g. 3 min → 2 min → 1 min), 110+ RPM. Trains the ability to produce power when already fatigued.
- **Progression rows for Muscle Tension and Stomps** in the archetype progression table.
- **4-week block periodization** guidance in `references/training-model.md`: 3 progressive build weeks followed by 1 taper/test week (segment attempt or time trial). Includes a 2+1 variant for masters athletes (50+).
- **Muscle Tension and Stomps** added to the standard session shapes section of `references/training-model.md`.
- **Garmin Coach Export integration** (`references/garmin-data.md`). The skill now accepts a pasted Garmin JSON export (produced by the [Garmin Workout Importer](https://chromewebstore.google.com/detail/garmin-workout-importer/faebbfokokipdpkbolpbpfadmgdbanpo) Chrome extension) as a first-class data source alongside Strava. Fields covered: FTP, VO2max, LTHR, 7-zone power model, 5-zone HR model, readiness (HRV, body battery, sleep score), training load (ATL, CTL, ACWR, training status, recovery window), and recent activities with TSS/NP.
- **Readiness-driven plan adjustments** — training readiness score, HRV status, and ACWR now trigger automatic load adjustments (soften hard sessions when score < 40 or ACWR > 1.3; prime the athlete to push when score ≥ 70 and ACWR is in the optimal range).
- **NP/FTP classification table** for Garmin activities (which lack workout names): maps the NP-to-FTP ratio to an effort tier (endurance, tempo, sweet spot, over-threshold, VO2max/anaerobic).
- **Readiness header line** in the weekly plan format (`references/plan-format.md`) — surfaces score, HRV, sleep, ACWR, training status, and recovery window at a glance when Garmin data is provided.
- **Weekly intake prompt** in `SKILL.md` now explicitly asks whether the athlete has a Garmin export and directs Garmin Connect users to the Chrome extension.

### Changed

- **Cadence targets** added to all existing hard session archetypes in `references/workout-library.md` (Sweet spot 85-95 RPM, Threshold 85-95 RPM, Over-unders 90-100 RPM, VO2max 90-100 RPM, 40/20s 95-105 RPM, 30/15s 95-105 RPM) and to Endurance Z2 (85-95 RPM).
- **Step 1 (data pull)** in `SKILL.md` restructured to handle three scenarios: Garmin only, Strava only, or both. When both are present, Garmin supplies zones and readiness; Strava supplies activity names for archetype extraction.

## [2.1.0] - 2026-06-12

### Added

- **30/15s (Rønnestad) workout archetype** in `references/workout-library.md`. Structure: 3 sets × 13 reps, 30 s @ 110–115% FTP / 15 s @ ~50–55%, 3 min recovery between sets. Includes cadence cues and a progression table (2×13 → 3×13 → 3×13 @ 112–115%).
- **Progression row for 30/15s (Rønnestad)** in the archetype progression table.

### Changed

- **Rotation table** updated so 30/15s (Rønnestad) occupies the former VO2max slot for all rider types, backed by Rønnestad et al. research showing 3 × 13 reps produces significantly greater VO2max and power gains than 4–5 min evenly-paced intervals. Classic VO2max (4×4 min) is retained as an explicit fallback substitute.
- **Example polarised week**: Tuesday's session changed from `VO2max 5×4` to `30/15s Rønnestad 3×13`.

## [2.0.0] - 2026-06-11

### Added

- Version metadata field to `SKILL.md` frontmatter.

### Changed

- **Output file naming conventions** updated throughout the skill.
- **Workout format specifications** refactored across `SKILL.md`, `references/athlete-config.md`, and `references/plan-format.md` to reflect ZWO-only output.

### Removed

- **Garmin FIT format support** — `references/garmin-connect-format.md` and all associated FIT generation documentation removed. ZWO is now the sole structured workout output format.

### Fixed

- Regex in `scripts/build-skills.sh` that failed to update the version field in `SKILL.md` frontmatter.

## [1.0.0] - 2026-06-10

### Added

- Initial release of the unified **cycling-plan-coach** skill, consolidating the previous `cycling-week-coach` and `zwo-workout-builder` into a single skill.
- Athlete configuration system (`references/athlete-config.md`) for per-athlete identity, goals, language, and units.
- Onboarding flow (`references/onboarding.md`) for gathering new athlete data.
- Strava integration reference (`references/strava-pull.md`) for pulling recent activities and extracting archetypes.
- Rider type classification (`references/rider-types.md`): sprinter/puncheur, all-rounder, diesel.
- Standard workout library (`references/workout-library.md`) with VO2max, Sweet spot, Threshold, 40/20s, and Over-unders archetypes, rotation table, and progression steps.
- ZWO format specification (`references/zwo-format.md`) covering all block types and file structure.
- Garmin FIT format specification (`references/garmin-connect-format.md`) with Python generation script.
- Strength and core exercise library (`references/strength-library.md`) tailored for cyclists.
- Training model principles (`references/training-model.md`) covering polarised and base-build-peak structures.
- Plan format reference (`references/plan-format.md`) for weekly markdown output structure.
- GitHub Actions release workflow (`.github/workflows/release.yml`).
- Build script (`scripts/build-skills.sh`) for packaging skill artefacts.
