# athlete.json - the per-athlete config

This file is the single source of truth for who a plan is for. Each user owns their own copy. The skill reads it; it is never edited inside SKILL.md.

| Field | Type | Meaning |
|---|---|---|
| `name` | string | The athlete's name, used in greetings. |
| `language` | string | Output language for everything the athlete reads (e.g. `en`, `nl`, `fr`, `de`, `es`, `it`). Machine keys stay English. |
| `units` | string | `metric` (km, km/h) or `imperial` (mi, mph). Power is always watts; strength uses W/kg regardless. |
| `styleNotes` | string | Writing rules to honor, e.g. tone, banned phrasings. |
| `goal` | string | The athlete's main goal, in their own words. Keep it concrete. The skill plans toward this every week. |
| `weightKg` | number | Body weight in kg (used for W/kg). Imperial users still store kg; convert at onboarding. |
| `fallbackFtp` | integer | FTP in watts to use when Strava is unreachable. Live FTP from Strava overrides it. |
| `targetWkg` | number | Target W/kg for context and progress. |
| `groupRideDays` | string[] | Days that are social group rides by default, e.g. `["Sat","Sun"]`. No structure is forced on these. |
| `typicalAvailableDays` | string[] | Days the athlete usually can train. The weekly intake can narrow this. |
| `maxStructuredSessions` | integer | Cap on structured key sessions per week (usually 2). |
| `strengthDefault` | string | `strength+core`, `core`, or `none`. |
| `riderTypeOverride` | string or null | Force a rider type (`sprinter`, `allrounder`, `diesel`) instead of deriving it. Null means derive from the power curve. |

Days use the three-letter English keys `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun` so the app can read them in any language.
