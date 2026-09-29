# Agentic Cycling Coach — PRD

Status: draft, for review. Written to check the existing planning docs
(`multi-event-and-webui-plan.md`, `multi-event-and-webui-tasks.md`) against a
broader brief — turn this into an **agentic coach that supports wider
events** — and to reset the roadmap so implementation tracks that brief
instead of drifting off it.

Nothing has been built against the existing plan yet (no `references/events/`
directory, no DB, no frontend exist in this repo as of this review), so this
is a course-correction before Milestone A starts, not a rewrite of shipped
work.

**Revision note:** an earlier draft of this PRD misread "agentic" as
*autonomous* — a background job that watches data on a timer and acts without
being asked. That's explicitly not the brief. The athlete always initiates:
either by asking the coach something in chat, or by entering data into the
web UI (a completed workout, a failed one, a strength session, a nutrition
entry). "Agentic" means the coach *interprets* whatever the athlete gives it
and works out what adjustment it implies — it does not mean the system runs
on its own between those inputs. This revision corrects that.

## 1. The brief

- **Wider events** — the event registry/file-per-event architecture already
  in `multi-event-and-webui-plan.md` is the right shape. Badlands Ultra as
  the one event built out is fine; nothing here requires adding more events
  now. The only ask is that the architecture not paint itself into a corner
  where adding event #2 later means restructuring rather than adding a file.
- **Agentic** — the coach should be more than a form-filler for logged data.
  Every athlete-initiated input — a chat message, or a data entry in the web
  UI — should be read for what it implies about the plan, and reflected back
  as a concrete adjustment (soften an archetype, don't progress it, flag it
  in next week's summary), not just recorded and displayed.

## 2. Gap analysis: existing plan vs. the brief

### 2.1 Event breadth — no gap, no action needed

The registry pattern (`references/events/README.md` + one file per event) in
the existing plan already generalizes fine: a second event is a new file
plus a registry line, nothing structural. **No change requested here** —
noting only so the roadmap below doesn't reintroduce scope that isn't
wanted.

### 2.2 Agentic behavior — the real gap: input goes in, nothing comes back out

The existing docs get the *shape* of athlete-initiated interaction right —
everything is either a chat session or a web UI action, never a timer. What's
missing is the **interpretation step** on the web UI side:

- Milestone B's schema (`workout_logs`, `nutrition_logs`, `strength_logs`)
  captures status/notes as free fields, but nothing in the plan defines what
  the coach *does* with a log that says "failed, too hard" versus one that
  says "completed as planned." Right now that log would just sit in the
  table until the athlete's next chat, and even then `SKILL.md` only has
  "factor last week's load into the new week" (Step 3) — true for TSS/volume,
  but there's no defined rule for a qualitative failure/difficulty signal.
- Strength/S&C logging (B5) is scoped as "mark complete, sets/reps/load" with
  no notion of "attempted but failed" and what that should trigger (regress
  the load next time, flag a technique/recovery concern, etc.).
- There's no shared place these interpretations land. A `coach_notes`-style
  object (or equivalent field on the log rows themselves) is needed so the
  athlete sees "next Thursday's session will be scaled back because Tuesday's
  was logged as too hard" — otherwise the interpretation, even if the coach
  makes it during the next planning chat, is invisible until then.

This is a **data-model and rule gap**, not an infrastructure gap — it doesn't
need a scheduler, a new service, or a notification channel. It needs (a)
structured signal fields on the log tables instead of free text alone, (b)
defined interpretation rules per signal, and (c) somewhere those
interpretations surface back to the athlete.

## 3. Revised functional requirements

### 3.1 Event architecture — carry forward as-is

- **FR1.** Keep Milestone A exactly as scoped in the existing tasks doc:
  registry + Badlands Ultra as the one event. No additional events required
  by this PRD.
- **FR2.** No structural change requested to the event file format. (If a
  second event is added later, confirm at that time whether shared
  periodization/session defaults should be factored out — not a now-decision.)

### 3.2 Input interpretation (replaces the autonomous-trigger design)

- **FR3. Structured signal fields on logs.** `workout_logs` and
  `strength_logs` carry, alongside free-text notes, an explicit status the
  web UI collects at log time: e.g. `completed_as_planned` /
  `completed_easier_than_planned` / `completed_harder_than_planned` /
  `failed_too_hard` / `skipped`. `nutrition_logs` similarly flags a plain
  signal (e.g. hit/missed carb target, hydration note) rather than relying
  on the coach to infer it from free text alone.
- **FR4. Defined interpretation rules per signal.** For each status above,
  document the concrete adjustment it implies, reusing existing
  `training-model.md`/`workout-library.md` concepts:
  - `failed_too_hard` on a given archetype → do not advance that archetype's
    progression step next time it's scheduled; consider substituting an
    easier variant; mention the adjustment and why in the next plan's
    last-week summary.
  - `completed_easier_than_planned` → eligible to advance the progression
    step a bit faster than the default rotation would.
  - `skipped` (repeated on the same archetype) → treat as a missed-session
    signal already partially covered by "factor last week's load," but make
    the rule explicit rather than left to judgment.
  - A logged strength session marked failed/too-hard → regress load/reps
    next occurrence per `strength-library.md`'s existing progression
    pattern, same principle as the bike-session rule.
- **FR5. Interpretations surface back to the athlete.** Add a field (or a
  lightweight `coach_notes` table keyed to the triggering log row) so an
  interpretation is visible in the web UI as soon as it's produced — the
  athlete who logs "Tuesday's session was too hard" should be able to see,
  without waiting for their next planning chat, that the coach registered it
  and what it means for the next occurrence of that session.
- **FR6. Everything stays athlete-triggered.** Interpretation runs either (a)
  synchronously when the athlete submits a log via the web UI (a normal
  request/response, not a background job — the athlete's own submit action
  is the trigger), or (b) at the start of the next chat planning session when
  `SKILL.md` Step 1 reads recent logs back in, exactly as already planned.
  **No scheduled job, cron, or timer-based process is introduced.** This
  replaces the earlier draft's "trigger-based re-engagement" / scheduled
  evaluator design, which is explicitly out of scope.

### 3.3 Data + web UI — Milestone B carries forward with the FR3–FR5 additions

- **FR7.** Milestone B (`B1`–`B7`) stands as scoped, with `workout_logs` /
  `strength_logs` / `nutrition_logs` gaining the structured status fields
  (FR3) at `B2` (schema), and the log-submission UI (`B3`–`B5`) gaining the
  status picker plus an inline "here's what that means" response (FR5) built
  from the FR4 rule table.
- **FR8.** `SKILL.md` Step 1 (data pull) gains an explicit sub-step reading
  these structured signals back in, applying the FR4 rules, and stating any
  resulting adjustment in the plan's last-week summary line — not left
  implicit in "factor last week's load."

## 4. Non-goals (explicit, to stop scope drift)

- **No autonomous/scheduled behavior.** Nothing in this system runs on a
  timer or independent of an athlete action. Every adjustment traces back to
  either a chat message or a web UI submission the athlete made.
- **Not multi-sport.** "Wider events" means a wider range of *cycling*
  events. Out of scope unless stated otherwise.
- **Not multi-athlete.** Single-athlete v1 stands, per the existing plan's
  resolved decision.
- **Not a notification channel.** No email/SMS/push. Interpretations surface
  in the web UI (on submission) or in the next chat plan — both already
  places the athlete is looking because they just acted.
- **No additional events required now** — Badlands Ultra alone is sufficient
  scope for Milestone A.

## 5. Revised roadmap

Keeps the existing tasks doc's numbering and content; the only changes are
additions inside Milestone B, not a new milestone or a resequencing:

1. **Milestone A — unchanged.** Ship exactly as scoped in
   `multi-event-and-webui-tasks.md` (A1–A8, Badlands Ultra only).
2. **Milestone B — unchanged, with FR3/FR5/FR7 folded into existing tasks:**
   - `B2` (schema): add the structured status fields (FR3) to
     `workout_logs`/`strength_logs`/`nutrition_logs`, and either a
     `coach_notes` column/table for FR5's surfaced interpretation.
   - `B3`–`B5` (logging UIs): add the status picker at log time and display
     the resulting interpretation inline after submit (FR5/FR6a).
   - `B6` (fold in Milestone A): unaffected by this PRD.
   - `B7` (polish): include a compliance view driven by the FR3 status
     history (e.g. how often sessions land as-planned vs. too-hard), which
     is a natural extension of the "compliance/trend charts" already scoped.
3. **New, small task — interpretation rules (fits inside Milestone A or as
   `A9`):** write the FR4 rule table into `training-model.md` /
   `workout-library.md` / `strength-library.md` (whichever governs each
   archetype's progression already) so `SKILL.md` Step 1 has a concrete rule
   to apply per logged status, per FR8. This is documentation, not
   infrastructure, and has no dependency on Milestone B shipping first — it
   can be written as soon as the status vocabulary (FR3) is agreed, and just
   sits unused by the chat flow until logged data exists to read.

## 6. Open questions

1. **Immediate vs. next-session interpretation (FR6)** — should logging a
   failed workout in the web UI produce an inline response right away
   (needs a small server-side function evaluating FR4's rules at submit
   time), or is it acceptable for the athlete to only see the adjustment
   reflected the next time they ask the coach to plan? Affects whether `B3`
   needs a rules-evaluation endpoint or just a data write.
2. **Status vocabulary (FR3)** — is the four-way split (`completed_as_planned`
   / `completed_easier_than_planned` / `completed_harder_than_planned` /
   `failed_too_hard` / `skipped`) the right granularity, or would a simpler
   binary (completed/failed) plus free text be preferred? Affects the UI
   picker and the FR4 rule table size.
3. **Multi-sport** — confirmed out of scope per §4 unless told otherwise.

## 7. Success metrics

- A workout logged through the web UI as `failed_too_hard` results in that
  archetype not progressing at its next scheduled occurrence, and the next
  plan's summary states the adjustment and why — traceable entirely to the
  athlete's own log entry, with no background process involved.
- A strength session logged as failed results in a load/rep regression next
  occurrence, per the same rule pattern.
- No code path in the system runs except in direct response to a chat
  message or a web UI request — verified by inspection (no cron, no
  scheduled function) as part of Milestone B review.
