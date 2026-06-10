# athlete.json - the per-athlete config

This file is the single source of truth for who a plan is for. Each user owns their own copy. The skill reads it; it is never edited inside SKILL.md.

| Field | Type | Meaning |
|---|---|---|
| `name` | string | The athlete's name, used in greetings. |
| `language` | string | Output language for everything the athlete reads (e.g. `en`, `nl`, `fr`, `de`, `es`, `it`). Machine keys stay English. |
| `units` | string | `metric` (km, km/h) or `imperial` (mi, mph). Power is always watts; strength uses W/kg regardless. |
| `styleNotes` | string | Writing rules to honor, e.g. tone, banned phrasings. |
| `goal` | string | The athlete's main goal, in their own words. Keep it concrete. The skill plans toward this every week. |
| `age` | integer | Athlete's age in years. Used to tune recovery expectations (masters athletes 40+ need more recovery between hard sessions) and contextualise W/kg benchmarks. Not available from Strava — always ask at onboarding. |
| `gender` | string | `male`, `female`, or `other`. Pulled from Strava `get_athlete_profile` when available; ask at onboarding if Strava is unreachable. Used to contextualise W/kg benchmarks and training load norms. |
| `weightKg` | number | Body weight in kg (used for W/kg). Imperial users still store kg; convert at onboarding. |
| `fallbackFtp` | integer | FTP in watts to use when Strava is unreachable. Live FTP from Strava overrides it. |
| `targetWkg` | number | Target W/kg for context and progress. |
| `groupRideDays` | string[] | Days that are social group rides by default, e.g. `["Sat","Sun"]`. No structure is forced on these. |
| `typicalAvailableDays` | string[] | Days the athlete usually can train. The weekly intake can narrow this. |
| `typicalWorkoutDurationMin` | number | Default workout duration in minutes (e.g. `60`). The weekly intake can override this per day. |
| `maxStructuredSessions` | integer | Cap on structured key sessions per week (usually 2). |
| `strengthDefault` | string | `strength+core`, `core`, or `none`. |
| `riderTypeOverride` | string or null | Force a rider type (`sprinter`, `allrounder`, `diesel`) instead of deriving it. Null means derive from the power curve. |

## How age and gender influence the plan

- **Age < 40:** standard recovery windows apply (hard day, one easy day, repeat).
- **Age 40–49 (masters):** add an extra easy day between hard sessions when possible; cap weekly TSS slightly lower.
- **Age 50+ (senior masters):** two easy or rest days between hard sessions is the default; volume comes second to quality.
- **Gender:** use gender-appropriate W/kg benchmarks when contextualising progress (e.g. 3.5 W/kg is a different relative level for male vs female athletes). Never adjust raw watt targets — those are FTP-derived and already personalised.

Days use the three-letter English keys `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun` so the app can read them in any language.
