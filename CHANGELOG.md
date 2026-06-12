# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
