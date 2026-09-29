# Season skeleton – markdown format

Parallel to `plan-format.md`, but for the season-level skeleton (A9's
`season-plan.json`) rather than a single training week. One file per
athlete, `season-plan.md`, regenerated whenever the skeleton is generated
or replanned (A13) — it is a rendering of `season-plan.json`, not a second
source of truth. Only produced when `athlete.json` has `targetEvent` and
`eventDate` set; an athlete with no event has no season skeleton and no
`season-plan.md`.

Per the PRD's FR5: **only the current phase renders in full week-by-week
detail.** Every other phase renders as a one-line summary plus its
trial-event entries — enough to see the shape of the season, not enough to
act as a ready-to-run weekly plan. This is what makes the "live" phase
visually distinguishable from the outline around it.

## File structure

### 1. Header block

```markdown
# Season Plan – <event display name> (<event date>)
**Days to event:** <N> · **Current phase:** <phase label>
**Season:** <startDate> → <eventDate> (<totalWeeks> weeks)
**Age band:** <band> · **Deload length:** <N> week(s) per block
```

### 2. Phase table

Always 5 rows, in order, regardless of which phase is current — this is the
season-at-a-glance view.

```markdown
| Phase | Dates | Length | Focus |
|-------|-------|--------|-------|
| Base | <start> – <end> | <N> wk | <one-line focus> |
| Deload | <start> – <end> | <N> wk | Reset — reduced volume/intensity |
| Build | <start> – <end> | <N> wk | <one-line focus> |
| Deload | <start> – <end> | <N> wk | Reset — reduced volume/intensity |
| Refine | <start> – <end> | <N> wk | <one-line focus> |
```

Mark the current phase's row (e.g. bold the phase name or add "← current"
in the Focus cell) so it's identifiable at a glance in addition to the
"Current phase" header line.

### 3. Trial-event ladder

One table, all rungs, sorted by date — the full-season ladder is short
enough (typically 4 rows, per `trial-events.md`) to show in full regardless
of phase, unlike the week-by-week detail this file otherwise withholds for
future phases.

```markdown
| Rung | Category | Target date | Phase | Spec | Status |
|------|----------|-------------|-------|------|--------|
| C1 | C | <date> | Base | <distance/elevation/terrain summary> | Planned |
| C2 | C | <date> | Build | <distance/elevation/terrain summary> | Planned |
| B1 | B | <date> | Build | <distance/elevation/terrain, fidelity note> | Planned |
| B2 | B | <date> | Refine | <culminating rehearsal summary> | Planned |
```

`Status` is `Planned` or `Logged`, per `season-plan.json`'s `status` field.
A `Logged` row adds a one-line outcome summary beneath the table (per A10's
interpretation rules once A15 lands) rather than a new column, so the table
itself stays stable whether or not a rung has happened yet.

### 4. Current phase — full detail

Only the phase matching `currentPhaseId` gets this section. Its content is
**that week's `plan-format.md` output**, unchanged — this file does not
reinvent weekly rendering, it just gates which phase gets one. Reference
the week file(s) rather than inlining them:

```markdown
## Current phase: <phase label> (<start> – <end>)

<one-line focus, same text as the phase table row>

This week: `<YYYY-Wnn-plan.md>`
```

If the athlete asks to plan ahead into a future phase (FR6), that phase's
detail is generated on demand and appended under its own `## ` heading the
same way — it does not retroactively expand that phase's row in the
one-line summaries above.

### 5. Future/past phase summaries

Every phase that is not current stays at the one-line-plus-trial-events
level already shown in sections 2–3 above — no additional section is added
for them. This is the mechanism that keeps a past phase from re-rendering
(no value in re-showing completed weeks) and a future phase from looking
like a ready-to-run plan before its time.

## Example

Badlands Ultra athlete, using `references/events/badlands-ultra.md`'s (A11)
actual instantiation of the macrocycle model (48-week runway, `startDate`
2026-09-26, real `eventDate` 2027-08-31) and `trial-events.md`'s worked
ladder for the same inputs. Today's date falls inside Build.

```markdown
# Season Plan – Badlands Ultra (2027-08-31)
**Days to event:** 187 · **Current phase:** Build
**Season:** 2026-09-26 → 2027-08-31 (48 weeks + 3 days)
**Age band:** Under 40 · **Deload length:** 1 week per block

## Phases

| Phase | Dates | Length | Focus |
|-------|-------|--------|-------|
| Base | 2026-09-26 – 2027-02-13 | 20 wk | Aerobic durability, general-prep strength, fueling baseline |
| Deload | 2027-02-13 – 2027-02-20 | 1 wk | Reset — reduced volume/intensity |
| **Build** | 2027-02-20 – 2027-05-22 | 13 wk | **← current** — event-specific limiter work, max strength, fueling ramp |
| Deload | 2027-05-22 – 2027-05-29 | 1 wk | Reset — reduced volume/intensity |
| Refine | 2027-05-29 – 2027-08-31 | 13 wk + 3d | Race-specific rehearsal, power/maintenance strength, taper |

## Trial-event ladder

| Rung | Category | Target date | Phase | Spec | Status |
|------|----------|-------------|-------|------|--------|
| C1 | C | 2026-12-19 | Base | 150–200 km, ~3,000–3,750 m, representative terrain | Logged |
| C2 | C | 2027-03-27 | Build | 250–300 km, ~4,500–6,000 m, representative terrain | Planned |
| B1 | B | 2027-04-24 | Build | 250–300 km / 4,500–6,000 m, Badlands-representative sandy/technical terrain | Planned |
| B2 | B | 2027-06-12 | Refine | Loaded-bike, overnight, full-gear rehearsal, opportunistic resupply | Planned |

C1 completed as planned — see `2026-12-19-trial-event-log.md`.

## Current phase: Build (2027-02-20 – 2027-05-22)

Event-specific limiter work, max strength, fueling ramp toward Badlands'
90–120 g/h target.

This week: `2027-W12-plan.md`
```
