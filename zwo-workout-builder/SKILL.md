---
name: zwo-workout-builder
description: Build structured cycling, strength, and cardio training sessions for Elio. ALWAYS deliver bike workouts as importable .zwo (Zwift workout) files, never as prose-only descriptions. Use this skill whenever the request involves a bike session, training block, interval workout, FTP-based effort, VO2max/threshold/sweet-spot work, a Gran Fondo or A-group build, or any strength or cardio session that supports the riding. Trigger even when the user just describes a goal ("I want to follow the A-group", "build me next week") without saying the word "workout".
---

# Workout Builder (Elio)

Build training sessions for a high-volume road cyclist and deliver them in the format his devices can actually use. The non-negotiable rule: **every bike session ships as a valid, importable `.zwo` file.** A bike workout described only in prose is a failed deliverable.

## Rider profile (defaults)

Use these unless the user says otherwise:

- High-volume road cyclist, ~13,000 km/year. Base endurance is a strength, not a limiter.
- Primary goal context: holding a fast group (A-group, 40+ km/h average) and Gran Fondo events. The limiter is almost always **repeated high-intensity surges and top-end power**, not steady aerobic capacity.
- Training model: **polarized** — two genuinely hard sessions per week, the rest kept genuinely easy. Avoid the grey zone (moderately-hard endurance that costs recovery without building the ceiling).
- **Steer by power, not heart rate.** Build every session around watts/% FTP. Heart rate can lag or mislead, so treat power targets as the anchor and allow RPE-based backoff: if the legs or breathing clearly say no on the day, ease off rather than chasing the number. Note this in the workout description, not as medical advice.

Ask for **current FTP** (and weight, if W/kg targets are wanted) when it isn't known — it converts the % targets into real watts for the description. The `.zwo` file itself stores power as a fraction of FTP, so the file works regardless; Zwift applies his profile FTP on import. If FTP is unknown, still produce the file and note that watt numbers in the description are pending an FTP value.

## Output rules by session type

- **Bike** → always a `.zwo` file (`sportType` = `bike`). Save to `/mnt/user-data/outputs/` and present it.
- **Indoor run / treadmill cardio** → `.zwo` is possible (`sportType` = `run`); offer it. Otherwise a clear markdown plan.
- **Gym / strength** → `.zwo` does not model resistance work. Deliver as a structured markdown table (exercise, sets × reps, load guidance, rest). Save as a `.md` file when it's a full session or block.
- **A full week or block** → produce one `.zwo` per bike session (named by day/focus) plus a short markdown overview tying the week together. Don't collapse multiple distinct sessions into a single file.

When in doubt about which session to build, default to one of the standard sessions below.

## The standard session library

These are the proven sessions for closing the surge/top-end gap. Full block structures and exact interval shapes live in `references/workout-library.md` — read it when building anything beyond a single simple ride. Quick summary:

- **VO2max** — 4–5 × 4 min at 110–120% FTP, equal recovery. Raises the ceiling; makes surges survivable.
- **40/20s (or 30/30s)** — 2–3 sets of 8–10 reps, 40s on / 20s off (or 30/30). The most race-specific session for responding to attacks without blowing up.
- **Over-unders** — 3 × (3 min just under threshold / 1 min just over). Trains tolerating pace variability in a bunch.
- **Sweet spot** — 2 × 20 min at ~90% FTP. Lifts sustained power with manageable fatigue.
- **Endurance (Z2)** — kept genuinely easy (~60–70% FTP) to protect the polarized model.

For strength and cardio companions, see `references/workout-library.md` for the cycling-specific gym session (posterior chain, single-leg, core) and the standard easy-cardio options.

## Building the .zwo file

`.zwo` is a small XML format. The full element reference with attributes and more examples is in `references/zwo-format.md` — read it before writing a file if you're unsure of any attribute. The essentials:

- Power is a **decimal fraction of FTP** (e.g. `0.90` = 90% FTP, `1.15` = 115%). Durations are in **seconds**.
- Wrap blocks in `<workout_file>` → `<workout>`.
- Common blocks: `<Warmup>`, `<Cooldown>`, `<SteadyState>`, `<IntervalsT>` (the repeat block), `<Ramp>`, `<FreeRide>`.
- Use `<textevent>` children to put coaching cues on screen during a block.
- Add `Cadence="..."` to drive cadence targets where it matters (e.g. high-cadence VO2 efforts).

### Minimal template

```xml
<workout_file>
  <author>Claude (for Elio)</author>
  <name>VO2max 5x4</name>
  <description>5 x 4 min at 115% FTP, 4 min easy between. Steer by power; ease off if the body says no.</description>
  <sportType>bike</sportType>
  <tags><tag name="vo2max"/></tags>
  <workout>
    <Warmup Duration="600" PowerLow="0.45" PowerHigh="0.75"/>
    <SteadyState Duration="60" Power="0.95"/>
    <SteadyState Duration="120" Power="0.50"/>
    <IntervalsT Repeat="5" OnDuration="240" OffDuration="240" OnPower="1.15" OffPower="0.50" Cadence="95">
      <textevent timeoffset="0" message="4 min on - hold the watts"/>
    </IntervalsT>
    <Cooldown Duration="600" PowerLow="0.65" PowerHigh="0.40"/>
  </workout>
</workout_file>
```

### Quality checks before delivering

1. Total duration is sensible (warm-up + work + recovery + cool-down). State the total in the description.
2. Power fractions are realistic (recovery 0.4–0.55; endurance 0.6–0.7; sweet spot ~0.9; threshold ~1.0; VO2 1.1–1.2; anaerobic >1.2).
3. The XML is well-formed: every opening tag closed, attributes quoted, `<textevent>` nested inside a block element.
4. Filename is descriptive and lowercase-hyphenated, e.g. `vo2max-5x4.zwo`, `over-unders-3x.zwo`.
5. The description names the session intent and the per-effort target in both % FTP and watts (if FTP known).

## Examples of intent that should trigger this skill

- "Give me a hard session for Tuesday." → VO2max or 40/20s `.zwo`, plus an easy-day note.
- "Build my week, I've got the group ride Saturday." → polarized week: 2 hard `.zwo` files + easy endurance + the Saturday group ride, with a markdown overview.
- "I need more snap out of corners." → 40/20s `.zwo`.
- "Something for the legs in the gym this winter." → cycling-specific strength session as markdown.
