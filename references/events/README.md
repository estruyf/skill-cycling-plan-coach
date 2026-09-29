# Event registry

One row per supported event. `SKILL.md` onboarding matches free-text answers
against `aliases` (case-insensitive substring match) to resolve `targetEvent`
in `athlete.json`. An unmatched name is still captured as free text and falls
back to generic ultra-endurance heuristics — it does not need a row here.

| Event id | Display name | Aliases | Event type | Reference file |
|---|---|---|---|---|
| `badlands-ultra` | Badlands (Ultra-Distance Gravel Race) | Badlands, Badlands Ultra, Badlands Gravel Race, Badlands Gravel Challenge | `ultra-gravel` | `badlands-ultra.md` |

## Adding a new event

1. Add a row here (id, display name, aliases, event type).
2. Create `references/<event-id>.md` covering: course profile, format rules,
   limiters trained for, session archetypes + periodization overlay,
   gear/logistics notes, fueling delta (on top of `nutrition.md`).
3. Source course specifics (distance, elevation, cutoffs, format rules) from
   the event's official site/rulebook — never invent them. Flag them as
   approximate and edition-dependent, since organizers change routes,
   distances, and cutoffs year to year.
4. Get the event file reviewed and approved before `SKILL.md` treats it as
   authoritative — it drives real pacing/safety decisions (cutoffs,
   self-supported logistics) for a training plan, not just descriptive color.
