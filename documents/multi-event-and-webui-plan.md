# Multi-event coaching + web UI — architecture plan

Status: proposed, not yet implemented. This document captures the plan discussed
before any code changes, so it can be picked up and executed (or revised) later.

## Background / goal

The current skill (`cycling-plan-coach`) is a single, generic-goal, weekly-cadence
coaching skill: it reads `athlete.json`, pulls Strava/Garmin, classifies rider type,
and writes a weekly markdown plan + ZWO workouts. There is no event concept, no
nutrition domain, and no persistence beyond local files written per chat session.

The goal is to go deeper — event-specific training (starting with the **Badlands
Ultra** gravel race), nutrition data collection, and strength & conditioning — so
the skill behaves like a professional coach tracking an athlete over time, plus a
lightweight web UI for viewing plans and logging workouts/nutrition day to day.

## Part 1 — Multi-event coaching content

Keep this as **one skill with an internal event-module system**, rather than
separate installable skills per domain (cycling / nutrition / S&C) or a
multi-agent (housekeeper + subagents) design.

Why not multi-agent: the Skills format has no native "spawn a subagent"
primitive that works consistently across Claude Code, claude.ai, and API skill
use — relying on the Agent tool would tie the skill to Claude-Code-only
environments. A literal subagent split also risks inconsistent decisions across
domains (e.g. a nutrition agent and a training agent disagreeing on load for the
same day). One skill reading in the right reference file at the right workflow
step gets the same separation of concerns without that cost or the portability
loss.

### New pieces

1. **`references/events/`** — one file per event, e.g. `badlands-ultra.md`, plus
   a short `README.md` registry (event id, display name, aliases for matching
   free-text onboarding answers, event type tag such as `ultra-gravel`). Each
   event file covers: course profile (distance/elevation/terrain/climate),
   format rules (self-supported/unsupported, cutoffs, checkpoints — flagged as
   approximate/edition-dependent since these change year to year and matter for
   safety on a self-supported desert ultra), the specific limiters it trains
   for, event-specific session archetypes and a periodization overlay, gear/
   logistics notes relevant to training, and an event-specific fueling delta on
   top of the generic nutrition module.

2. **`references/nutrition.md`** — new shared fueling module: daily carb
   periodization, training-day fueling, hydration/electrolytes, race-day fueling
   principles. Event files add only the delta on top (e.g. Badlands' gut-training
   for 90–120 g/h carbs, desert heat/electrolyte load, multi-day/resupply-as-
   fuel-stop logistics, sleep-deprivation fueling) rather than duplicating it.

3. **Config additions** (`athlete-config.md` / `athlete.json`): `targetEvent`
   (event id or null), `eventDate`, derived `daysToEvent`. `goal` stays free text
   but is populated/confirmed from the event when one is set.

4. **`onboarding.md`**: made dynamic rather than a flat checklist, in three
   parts. **(a)** New goal-branch question — "Are you training for a specific
   event, or do you want a general training plan?" — offering the supported
   list (Badlands Ultra Gravel Race, or "general training plan"/"no specific
   event") plus event date. Unmatched event names still get captured (name +
   date) and fall back to generic ultra-endurance heuristics, degrading
   gracefully as more events get added later. **(b)** Every question with a
   definitive/categorical answer (units, gender, strength default, session
   count, training/group-ride days) presents an explicit list of options to
   choose from, rather than free text with examples. **(c)** One
   open-narrative question invites the athlete to describe physical
   challenges/limiters (e.g. pain, fatigue, power that won't transfer to the
   pedals on climbs) in their own words; the raw text is stored and read
   qualitatively alongside the data-derived rider type (`rider-types.md`)
   when the coach sets session and strength emphasis — a hypothesis to weigh,
   never a silent override of the power-curve-derived limiter.

5. **`SKILL.md` workflow**: config resolution also resolves the event file and
   countdown; the training-model step branches to countdown-driven periodization
   (base/build/peak/taper toward `eventDate`) when an event is set, instead of
   the generic rolling 3-build+1-taper block; rider-type priorities can be
   overridden by the event (e.g. ultra-gravel deprioritizes VO2/sprint work in
   favor of durability, fat-max endurance, back-to-back long days, technical/
   loose-surface handling); new session archetypes go into
   `workout-library.md` (long back-to-back days, heat acclimation, overnight/
   low-sleep simulation, loaded-bike climbing); plan output gains an event
   countdown/phase header line and a fueling section, plus a race-day fueling/
   pacing deliverable once close to the event.

6. **`plan-format.md`**: add the optional countdown/phase header line and
   fueling subsection.

7. Version bump (breaking config shape), CHANGELOG entry, README/SKILL.md
   description updated to describe multi-event + nutrition support.

## Part 2 — Persistent data + web UI

Decision: all onboarding, plan generation, and config changes continue to
happen via Claude Code (chat-driven). The web frontend is only for **viewing
plans and logging data** (workouts, nutrition, S&C) day to day — it does not
replace the coaching conversation.

### Why this needs new infrastructure

Claude Code sessions run in **ephemeral containers** — nothing written to local
disk persists between sessions or is reachable by a separately-hosted web app.
So local `athlete.json` + markdown files can't remain the source of truth once a
web app needs to read/write the same data; there must be an external, persistent
store both sides talk to over the network.

### Architecture

```
Claude Code (skill runs here: onboard, plan, adjust)
        │  HTTPS (curl / Bash tool, service key)
        ▼
Postgres + auto REST API (Supabase)
        ▲
        │  HTTPS (Supabase JS client)
Web frontend (view plans, log workouts & nutrition)
```

- **Database + API:** Postgres via Supabase — gives the DB, an auto-generated
  REST API (PostgREST) with row-level security, and auth, on a free tier, with
  no hand-rolled backend server to write or host. Claude Code hits it with
  `curl` using a service key stored as an environment variable in the Claude
  Code environment; the web app uses the Supabase JS client.
- **Frontend:** minimal Next.js app on Vercel's free tier — a plan viewer, a
  workout log, a nutrition log. Not a product, just enough surface for logging.
- **Auth:** Supabase Auth (email/password or magic link). Schema is keyed by
  `athlete_id` from day one so a second athlete isn't a rewrite later, even
  though today it's single-athlete.

### Schema (v1)

| Table | Purpose |
|---|---|
| `athletes` | mirrors today's `athlete.json` — identity, goal, physiology, preferences |
| `events` | `athlete_id`, `event_key` (e.g. `badlands-ultra`), `event_date`, notes |
| `plans` | one row per generated week — `week_id`, `phase`, `focus`, `ftp_used`, `rider_type`, rendered markdown |
| `workouts` | belongs to a plan — `day`, `archetype`, target JSON, ZWO content, `status` (planned/completed/skipped), `actual` JSON |
| `workout_logs` | completion entries from the web UI — RPE, notes, actual TSS/duration, source |
| `nutrition_logs` | daily entries from the web UI — carbs, calories, hydration, body weight, notes |
| `strength_logs` | S&C completion — sets/reps done, load, notes |

The skill writes `plans`/`workouts` after generating a week; the web app writes
`workout_logs` / `nutrition_logs` / `strength_logs` as the athlete logs things;
the skill reads recent logs back in at the next planning session (in addition to
what Strava/Garmin readiness data provides today).

### Phased delivery

1. **Provision infra** — Supabase project, Vercel project (account creation is
   a manual step for the user; schema/config can then be scripted against real
   credentials).
2. **Schema + API access** — create the tables above, RLS policies, a
   service-role key stored as an env var in the Claude Code environment.
3. **Core loop, minimal** — skill posts a generated plan/workouts to the API
   instead of (or alongside) local files; a bare-bones frontend page lists the
   current week's workouts with a "mark complete" action. Closes the loop
   end-to-end.
4. **Nutrition logging UI** — daily entry form + history view; skill reads it
   back for next week's fueling adjustments.
5. **S&C logging UI** — same pattern for strength/core sessions.
6. **Fold in Part 1** (multi-event support, Badlands Ultra module, nutrition
   module, deeper phase periodization) on top of this data layer instead of
   flat files.
7. **Polish** — event countdown view, compliance/trend charts on the frontend,
   taper/race-week views.

This sequencing gets a working (if plain) log-and-view loop fast in steps 1–3,
then layers the deeper coaching intelligence on top once the plumbing exists,
rather than building the rich content first and re-plumbing it later.

## Part 3 — Season macrocycle layer

A later review (`documents/season-macrocycle-prd.md`) added a requirement
this original plan didn't cover: the coach needs to build a long-term,
multi-phase plan toward a single A-priority event (Base/Build/Refine, each
12–14 weeks, with deload/transition blocks absorbing the slack between three
phases and the event's actual runway), place coach-designed B/C "dry run"
trial events in that calendar, and generate only the current phase in full
detail while later phases stay as a dated outline — all changeable as the
athlete's actual training diverges from the skeleton. See that PRD for the
full brief, gap analysis, and resolved decisions; see
`multi-event-and-webui-tasks.md` tasks A9-A15 for the implementing work. This
sits above the weekly-planning flow described in Part 1 — the weekly flow
reads its current phase/deload/trial-event context from the season skeleton
instead of computing a phase from raw `daysToEvent` directly — and persists
as a local file (`season-plan.json`) until Milestone B's data layer picks it
up (`B9`, deferred).

## Open decisions — resolved

- **Hosting:** Supabase + Vercel, as drafted above (not self-hosting a DB/API).
- **Athlete scope:** single-athlete for v1; schema stays keyed by `athlete_id`
  for future-proofing per the schema section above, but v1 logic/auth assumes
  one athlete.
- **Supabase/Vercel provisioning:** kept as an explicit, trackable task rather
  than assumed pre-existing.

See `multi-event-and-webui-tasks.md` for the full task breakdown that
implements this plan, sequenced and with test criteria per task.
