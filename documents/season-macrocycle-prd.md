# Season macrocycle — PRD

Status: draft, for review. Companion to `agentic-coach-prd.md` (which governs
*within-week* signal interpretation) — this PRD governs the *long-term shape*
of the plan: the multi-month structure leading to a single A-priority event,
and how nutrition, strength, and road training sit inside it. Written after a
review of the existing plan/task docs against a new brief (see §1) that
neither doc currently covers.

## 1. The brief

Badlands Ultra is an **A-priority event on 2027-08-31**, currently ~48 weeks
out. The coach needs to be able to build a long-term, adaptive plan — not
just a week at a time — covering nutrition, strength & conditioning, and road
training together, structured as:

- **Three master phases** — Base, Build, Refine — each 12–14 weeks, with
  periodization and tapering built in.
- **Deload/transition blocks between phases** (not a 4th phase) absorbing the
  slack between the ~36–42 weeks the three phases occupy and the ~48-week
  runway, so the athlete walks into each new phase fresh rather than
  fatigued.
- **B/C-category "dry run" events** placed at specific points in the
  calendar — coach-designed simulated trial efforts (not real races the
  athlete signs up for) sized and shaped to rehearse specific limiters of the
  target event, stepped in difficulty as the event approaches.
- **Changeable and dynamic** — the plan is not fixed at onboarding; it
  should be able to move phase boundaries, deload windows, and trial-event
  dates as the athlete's actual training reality diverges from the original
  skeleton.
- **Right-sized generation** — only the *current* master phase is generated
  in full week-by-week detail (covering road, strength, and nutrition
  together); later phases exist only as a dated skeleton until the athlete
  reaches them.

## 2. Gap analysis: existing plan/codebase vs. the brief

Reviewed: `SKILL.md`, `references/training-model.md`,
`references/events/badlands-ultra.md`, `documents/multi-event-and-webui-plan.md`
/ `-tasks.md`, `documents/agentic-coach-prd.md`. None of these define a
long-term plan object. Specifically:

- **No macrocycle artifact exists anywhere.** Every design — the shipped
  skill, Milestone A's countdown periodization (A5), and Milestone B's
  `plans` table (documented as *"one row per generated week"*) — treats one
  week as the unit of output. Attaching a phase label
  (`base`/`build`/`peak`/`taper`) to a week, per A5, is not the same as
  having a season skeleton that can be inspected, edited, and replanned
  against as a first-class object.
- **Phase model mismatch.** The shipped/planned model is a single continuous
  `base → build → peak → taper` run (or a rolling 4-week
  `3-build + 1-taper` block, `training-model.md` §4-week block
  periodization). The brief's three independent 12–14 week master phases
  with inter-phase deloads is a different structure and isn't designed
  anywhere.
- **No B/C dry-run concept exists.** Nothing in `onboarding.md`, the event
  registry, `training-model.md`, or either PRD mentions priority events,
  tune-up efforts, or simulated trial events.
- **Nutrition/strength aren't periodized at season level.** `nutrition.md`
  (planned, A2) and `strength-library.md` are referenced per-week only; a
  season-level progression (e.g. general prep → max strength →
  power/maintenance; fueling-target ramp aligned to trial-event dates)
  doesn't exist.
- **No persistence for a season skeleton.** Claude Code containers are
  ephemeral; the only durable artifact today is `athlete.json` plus whatever
  markdown files were written to `outputs/` last run. A macrocycle meant to
  persist and evolve across many separate chat sessions needs its own
  durable file.

This is a genuine gap, not a partially-covered task — it needs a new layer
sitting above the existing weekly-planning flow, which the weekly flow reads
from instead of computing phase from raw `daysToEvent` directly.

## 3. Resolved decisions

These were open questions raised during review; resolved by the athlete
(David) before writing this PRD:

1. **Timeline gap → deloads between phases, not a 4th phase.** The slack
   between three 12–14 week phases (~36–42 weeks) and the ~48-week runway is
   absorbed by a deload/transition block after Base and after Build (not
   before Base, and not a separate named macro-phase). Each deload is a
   reset, not a training block — the athlete exits it fresh, not
   detrained, and walks into the next phase without residual fatigue.
2. **B/C events are simulated, not real races.** The coach does not look up
   or recommend actual events on a race calendar (no web-search/live
   race-data capability is required). Instead it designs standalone trial
   efforts sized and shaped to the phase they land in and to the target
   event's own limiters (per the target event file's "Limiters this event
   trains for" section). For Badlands specifically:
   - **C-category events** step the *distance* ladder (e.g. ~150–200 km →
     ~250–300 km) — lower-stakes, earlier, testing basic pacing/fueling.
   - **B-category events** step the *limiter-fidelity* ladder — larger
     elevation volume, mixed road/gravel surface, and (as the event nears)
     an overnight/sleep-deprivation component — culminating in one
     near-full-dress rehearsal (gear, lighting, tracker, loaded-bike
     climbing, opportunistic resupply fueling) in early Refine, timed with
     enough runway to fully recover and taper before race day.
   - This ladder generalizes: for a future non-ultra event, the same
     distance-step (C) / limiter-fidelity-step (B) principle applies, driven
     by whatever that event's own limiter list says, not by Badlands-specific
     numbers.
3. **Persistence: local file now, DB later.** The season skeleton is written
   to a local file (`season-plan.json`, next to `athlete.json`) in this
   Milestone-A/file-based world. It migrates into a proper table once
   Milestone B's Supabase layer exists — `plans` there will need to stop
   meaning "one row per week" and start meaning "one row per macrocycle,"
   or gain a sibling table; this is **not** designed in this PRD (see
   non-goals) and is deferred to whichever Milestone B task picks it up.

## 4. Functional requirements

### 4.1 Season skeleton (new)

- **FR1.** When an athlete has `targetEvent` and `eventDate` set (per
  existing `athlete-config.md` fields from Milestone A), the coach can
  generate a **season skeleton**: three master phases (Base, Build, Refine)
  each 12–14 weeks, with a deload/transition block (length short relative to
  the phase — a reset, not a mesocycle) inserted after Base and after Build,
  sized so the total spans from a chosen start date to `eventDate`. Any
  runway slack beyond what the three phases + two deloads need is absorbed
  into the first phase (Base) or a short buffer before it starts, not
  invented as a fourth named phase.
- **FR2.** The skeleton assigns a **B/C trial-event ladder**: at minimum one
  C-event in Base, one C-event and one B-event in Build, and one
  culminating B-event early in Refine, each with a target week/date, a
  category (B or C), and a concrete spec (distance, elevation target,
  terrain mix, and any overnight/loaded-bike/fueling-rehearsal component)
  derived from the target event's limiter list. Refine's final weeks taper
  down from the culminating B-event into race day.
- **FR3.** The skeleton persists as `season-plan.json` (schema TBD in the
  implementing task, but must at minimum hold: phase list with start/end
  dates and a `deload: bool` flag, the trial-event ladder with dates/specs,
  and which phase is "current"). The weekly planning flow reads this file to
  determine current phase/deload state and any trial event due soon, instead
  of recomputing periodization from raw `daysToEvent` (this **supersedes**
  the simpler countdown-only periodization scoped in the existing task list's
  A5).
- **FR4. Nutrition and strength are periodized at the season level, not just
  per week.** Strength progresses general-prep → max-strength →
  power/maintenance mapped onto Base/Build/Refine. Fueling targets ramp
  (e.g. gut-training g/h carb targets) aligned to the trial-event ladder, so
  each B/C event also rehearses the current fueling target, not just
  distance/terrain.

### 4.2 Generation scope

- **FR5.** Only the **current** master phase is generated in full
  week-by-week detail (road + strength + nutrition together, in the same
  granularity as today's weekly plan), produced once the season skeleton is
  created (or refreshed) — not the full ~48 weeks at once. Future phases
  exist in the skeleton only as: phase name, date range, one-line focus, and
  their trial-event entries — enough to see the shape of the season, not
  enough to act as a ready-to-run weekly plan.
- **FR6.** When the athlete reaches a new phase (or explicitly asks to plan
  ahead into it), the coach generates that phase's full detail from the
  skeleton's summary entry, using whatever's been learned since the skeleton
  was written (recent load, logged trial-event outcomes, life changes) —
  it is not a mechanical unpacking of a pre-written plan.

### 4.3 Dynamic replanning

- **FR7.** The season skeleton is editable, not fixed at creation. A
  material divergence — an athlete report of illness/injury, a missed block
  of weeks, a trial event that went badly and reveals a limiter needs more
  work, or the athlete asking to shift the event or the ladder — triggers a
  **replan**: phase boundaries, deload windows, and/or trial-event dates
  shift, but weeks already completed are never rewritten (consistent with
  the "athlete-triggered only" principle in `agentic-coach-prd.md` FR6/§4 —
  no scheduled or autonomous re-planning; a replan happens because the
  athlete said something that implies one, in chat or in a logged entry).
- **FR8.** A trial event's outcome, once logged, is interpreted using the
  same style of rule as `agentic-coach-prd.md` FR4 (e.g. a B-event logged as
  "GI distress at target carb rate" adjusts the fueling ramp for the
  remaining ladder and the Refine phase; a B-event logged as "completed
  comfortably" can pull the difficulty ladder forward). The exact rule table
  is out of scope for this PRD and belongs in the implementing task
  alongside FR4's existing table.

## 5. Non-goals (explicit)

- **No live race-calendar lookup or web search.** B/C events are simulated
  constructs the coach designs, never real races it finds or recommends by
  name/location. No new tool capability is required for this feature.
- **No DB schema design for the season skeleton.** Persistence is a local
  file in this PRD's scope (per §3.3); how it becomes a Supabase table is a
  Milestone B decision, made when that work is picked up, not here.
- **No autonomous/scheduled replanning.** Every skeleton change traces back
  to an athlete-initiated chat message or logged entry, per the existing
  non-autonomy principle — this PRD does not weaken that.
- **No multi-event or multi-athlete scope change.** Single A-priority event,
  single athlete, exactly as already decided elsewhere.
- **Not the full ~48-week plan generated up front.** Explicitly rejected by
  the brief (§1) — generation is scoped to the current phase (FR5).

## 6. Open questions

1. **Deload length rule.** Is a deload a fixed length (e.g. 2 weeks) or
   proportional to the phase just completed / the athlete's age band (per
   `training-model.md`'s existing 40–49 / 50+ recovery cadence, which already
   asks for more frequent recovery for older athletes)? Affects whether the
   skeleton's date math is a fixed constant or reads `age` from
   `athlete.json`.
2. **Trial-event logging.** Does a B/C event get its own log entry distinct
   from a normal `workout_logs` row (it's a multi-hour/multi-day effort with
   its own outcome fields — fueling, mechanical, pacing, morale), or is it
   just a long session logged through the existing status vocabulary? Affects
   both the local-file (Milestone A) and eventual DB schema.
3. **Replan granularity.** When a replan is triggered (FR7), does it always
   re-run the full skeleton-generation logic (FR1/FR2) from the new "today,"
   or only nudge the affected phase/deload/event forward while holding the
   rest fixed? Affects how disruptive a replan is to trial-event dates the
   athlete may have already started preparing around.
4. **Skeleton refresh cadence.** Is the skeleton regenerated wholesale each
   time the current phase completes (using everything learned during that
   phase), or does FR6's "generate current phase in detail" only ever fill
   in the existing skeleton's summary entry without touching phase
   boundaries unless FR7 explicitly fires? These read as the same rule but
   should be confirmed as one before the implementing task is written.

## 7. Success metrics

- Given `targetEvent`/`eventDate` set with an event whose limiter list exists
  (e.g. Badlands), the coach produces a `season-plan.json` with three
  12–14 week phases, two deload blocks, and a B/C ladder that together span
  from a sensible start date to `eventDate` with no unaccounted gap.
- The current phase (only) comes back with full week-by-week road + strength
  + nutrition detail; the other two phases appear only as dated,
  one-line-focus summaries with their trial-event entries.
- A B-event logged with a negative outcome (e.g. fueling failure) visibly
  changes the fueling ramp or ladder difficulty for the remaining season,
  traceable to that single logged entry.
- Asking the coach to replan (e.g. "I was sick for 3 weeks") shifts the
  skeleton's remaining phase/deload/event dates without altering the record
  of weeks already completed.
