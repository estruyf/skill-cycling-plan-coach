# Badlands (Ultra-Distance Gravel Race)

**Status: draft, pending review/approval.** Course specifics below were pulled
from the official race site (badlands.cc) in September 2026. Badlands changes
its route, exact distance, elevation, and cutoff most editions — reconfirm
every figure against the current year's official course notes before relying
on it for pacing or safety-critical decisions (cutoffs, water/resupply
planning), and update this file once confirmed. Nothing here should be
treated as authoritative until an athlete/coach has reviewed it against the
current edition's official materials.

Event id: `badlands-ultra` · Event type: `ultra-gravel` · Registry: `README.md`

## Course profile

- **Format:** solo or pairs, single continuous effort, self-supported/
  unsupported (no drafting, no planned support crew, no pre-booked
  logistics — see Format rules below).
- **Start/finish:** Granada, Spain, looping through Almería province and
  back. 2026 edition started/finished at the Palacio de Congresos de
  Granada.
- **Distance / elevation (approximate, edition-dependent):** roughly 800 km
  with 14,000–16,000 m of climbing. Official materials have quoted both
  "817 km / 14,420 m" (a prior/preview course description) and
  "800 km / 16,000 m" (2026 official listing) — treat as "~800 km,
  ~15,000 m" for planning purposes and do not hard-code either figure into a
  pacing model without checking the current year's page.
- **Terrain mix:** Sierra Nevada high-mountain passes (including Pico
  Veleta, ~3,396 m — the highest paved road in continental Europe, on
  unpaved/gravel surface near the summit), sandy ramblas (dry riverbeds,
  loose and technical), the Tabernas and Gorafe deserts (arid, exposed,
  rocky/sandy badlands terrain), Cabo de Gata coastal sections (flat,
  wind-exposed, hot), and pine-forested mountain passes. One documented
  stretch after Almería stacks roughly 3,000 m of climbing into about
  100 km — expect the route to concentrate extreme climbing blocks rather
  than spread them evenly.
- **Cutoff:** approximately 96–108 hours (2026 edition: start 08:00, cutoff
  deadline roughly 4.5 days later). This is a hard deadline for the full
  ~800 km/~15,000 m course — riders who don't reach the finish by the
  deadline are recorded as DNF, though they may continue and return the
  tracker at a designated point. **Reconfirm the exact hour count for the
  current edition** — this is the single figure most load-bearing for
  pacing plans and back-of-the-envelope finish-time targets.

## Format rules (self-supported ultra)

- **Self-sufficiency:** food, drink, and belongings must be carried or
  acquired unplanned en route (shops, water sources). No pre-booked
  accommodation, no logistics support, no virtual base-camps, no planned
  support crew. Support is allowed only at the start and finish.
- **No drafting:** riders can't explicitly follow another rider or vehicle
  for aerodynamic benefit, except during the neutralized start or for the
  pairs category. Riding side-by-side (not paced) is allowed.
- **Mandatory tracker:** satellite tracker required for the whole route;
  long inactivity or turning it off is penalized. Relevant for training:
  athletes should practice managing tracker/electronics battery life
  alongside lights and navigation devices over multi-day efforts.
- **Night riding:** helmet, front and rear lights, and reflective gear are
  mandatory after dark; headphones are prohibited throughout. Given the
  cutoff length, most finishers will ride through at least one full night.
- **Eligibility/safety:** minimum age 18; valid liability and medical
  insurance covering rescue and repatriation is required to start.

## Limiters this event trains for

Ultra-gravel deprioritizes short-power work (VO2max/sprint) relative to a
criterium- or road-race-focused plan, in favor of:

- **Durability** — the ability to keep producing usable power after 10+
  hours and multiple days, not peak power on fresh legs.
- **Fat-max / low-intensity endurance** — most of the ~800 km is ridden
  well below threshold; an athlete who can fuel and move efficiently at low
  intensity for hours goes faster overall than one who can only hold high
  power briefly.
- **Back-to-back long days** — the format is one continuous multi-day
  effort, so the relevant training stress is accumulated fatigue across
  consecutive long rides, not single-session peak load.
- **Technical / loose-surface handling** — sandy ramblas, desert
  singletrack-adjacent gravel, and the unpaved section near Pico Veleta
  reward bike-handling skill on loose terrain, which a pure road/structured
  program won't build.
- **Heat tolerance** — Tabernas/Gorafe desert and Cabo de Gata coastal
  sections are hot and exposed; heat acclimation is a real limiter, not
  just a comfort issue.
- **Sleep deprivation / overnight riding** — the cutoff virtually
  guarantees at least one overnight stretch; the ability to fuel, navigate,
  and stay safe while sleep-deprived is a trainable skill, not just
  toughness.
- **Sustained high-altitude climbing** — Pico Veleta and the Sierra Nevada
  passes concentrate large, singular climbing efforts (see the ~3,000 m in
  ~100 km note above) rather than the shorter repeated climbs a criterium
  or crit-style plan would emphasize.

## Session archetypes + periodization overlay

Periodization toward `eventDate` follows `references/macrocycle-model.md`'s
(A9) five-phase season skeleton — **Base → Deload → Build → Deload →
Refine** — once `season-plan.json` exists for this event (see the
instantiation below); this replaces the generic rolling 3-build+1-taper
block from `training-model.md` when `targetEvent: badlands-ultra` is set.
On top of the standard archetypes in `workout-library.md`, add these
event-specific ones during Build/Refine:

- **Long back-to-back days** — two consecutive long endurance rides
  (Z2, fat-max pace) on a weekend, building total back-to-back volume over
  the Build phase rather than single-ride duration alone.
- **Heat acclimation** — endurance rides deliberately scheduled/dressed for
  heat exposure as the event date and typical desert conditions approach;
  substitute indoor heat sessions if ambient conditions don't allow it.
- **Overnight / low-sleep simulation** — at least one long ride starting
  late evening or extending past normal sleep hours during Refine, to
  rehearse fueling and decision-making while sleep-deprived. Use sparingly
  given the fatigue cost; this is a Refine-phase, not Base-phase, tool.
- **Loaded-bike climbing** — climbing repeats or long climbs done with
  race-representative bikepacking bag weight, to build climbing durability
  under the load the athlete will actually carry.
- **Technical/loose-surface handling** — dedicated gravel/off-road handling
  rides on sandy or loose terrain where available, or skills drills, rather
  than assuming road/smooth-gravel handling transfers directly.
- **Fasted/low-fuel long rides** (Base phase only, used deliberately and
  sparingly) — to build fat-max efficiency; do not combine with high
  intensity, and never use this as the default fueling approach for long
  rides once gut-training toward race fueling begins (see Fueling below).

Taper: reduce volume and back-to-back-day load while preserving one shorter
loaded-bike or technical-handling session to keep skills sharp; treat
race week (Refine's final block, per the macrocycle model) primarily as
glycogen/rest preparation, not fitness-building.

## Season macrocycle instantiation (A11)

Concrete instantiation of `macrocycle-model.md`'s (A9) phase algorithm and
`trial-events.md`'s (A10) ladder method for this event specifically — the
worked numbers a coach run would actually produce, not a re-derivation of
either generic method. Both files should be read first; only the
Badlands-specific output is repeated here.

**Event inputs:** `eventDate` = **2027-08-31** (the race start date, per
`athlete-config.md`'s `eventDate` field and the season-macrocycle PRD's
brief — the ~4.5-day cutoff means the athlete's actual finish falls several
days later, but the plan targets the start date, same as `daysToEvent`'s
existing definition). `D` ≈ 800 km, `E` ≈ 15,000 m, age band under 40
(`deloadWeeks` = 1) — the illustrative choice used below; an actual
athlete's older age band would only change the two deload lengths (2 or 3
weeks each per the age-band table), not the Build/Refine lengths or the
ladder's phase-fraction placement.

### Phase lengths

Both master phases are fixed at the algorithm's nominal length, which
already sits inside the PRD's 12–14 week range, so no shrink branch is
needed here:

- **Build:** 13 weeks.
- **Refine:** 13 weeks (nominal — Refine's actual end date is always the
  literal `eventDate`, so its true length absorbs whatever the runway's
  `totalDays % 7` remainder is, per `macrocycle-model.md` step 7).

### Worked skeleton

Illustrative `startDate` = 2026-09-26 (today, at the time this instantiation
was written — an actual run recomputes this from that athlete's onboarding
date). `totalDays` = 339, `totalWeeks` = 48 (floor). `reserved` = 13 + 13 +
2×1 = 28. `baseWeeks` = 48 − 28 = 20 (≥ 12, no shrink needed):

| Phase | Start | End | Length |
|---|---|---|---|
| Base | 2026-09-26 | 2027-02-13 | 20 weeks |
| Deload 1 | 2027-02-13 | 2027-02-20 | 1 week |
| Build | 2027-02-20 | 2027-05-22 | 13 weeks |
| Deload 2 | 2027-05-22 | 2027-05-29 | 1 week |
| Refine | 2027-05-29 | **2027-08-31** | 13 weeks + 3 days |

Sum spans the full runway exactly, `startDate` to the real `eventDate`, with
no gap and no fourth named phase — Refine absorbs the 3-day remainder that
48-week floor division leaves over, per `macrocycle-model.md` step 7.

### Trial-event ladder

Applying `trial-events.md`'s placement fractions (§4) to the phase dates
above, and its distance/elevation formulas (§2/§3) to `D` ≈ 800 km /
`E` ≈ 15,000 m:

| Rung | Category | Target date | Spec | Limiters rehearsed |
|---|---|---|---|---|
| C1 | C | 2026-12-19 (`Base + 12wk`) | 150–200 km, ~3,000–3,750 m; representative gravel/road terrain, no overnight/loaded-bike | Fat-max/low-intensity endurance, back-to-back long days (partial) |
| C2 | C | 2027-03-27 (`Build + 5wk`) | 250–300 km, ~4,500–6,000 m; representative terrain | Fat-max endurance, back-to-back long days, current gut-training g/h target |
| B1 | B | 2027-04-24 (`Build + 9wk`) | Same 250–300 km/4,500–6,000 m scale as C2, on Badlands-representative sandy/technical terrain at matching climbing density | Technical/loose-surface handling, sustained high-altitude climbing |
| B2 (culminating) | B | 2027-06-12 (`Refine + 2wk`, ~15% into Refine) | Loaded-bike, full-gear (lighting, tracker) rehearsal spanning a genuine sunset-to-sunrise stretch, at the then-current gut-trained g/h rate, with opportunistic resupply | Loaded-bike handling, sleep deprivation/overnight riding, heat tolerance, opportunistic-resupply fueling |

B2 lands ~15% into Refine, leaving roughly 11 of Refine's 13 weeks for
recovery, final race-specific sharpening, and taper before 2027-08-31 —
within `trial-events.md`'s required 15–25% window. Each rung's spec traces
directly to entries in this file's "Limiters this event trains for" section
above; C1/C2 deliberately don't target the discrete (terrain/overnight/
altitude/loaded-bike) limiters, per `trial-events.md` §1 — that's what
distinguishes them from B1/B2.

`season-plan.json`'s `trialEvents[]` entries for this event should carry
`distanceKm`/`elevationM` as the ranges above, `terrainFidelity: "low"` for
C1/C2 and `"high"` for B1/B2, `overnight`/`loadedBike: true` only on B2, and
`opportunisticResupply: true` on B2 (per Badlands' start/finish-only support
rule above).

## Gear/logistics notes relevant to training

- Train on the actual race setup (bike + bikepacking bags, race-representative
  weight) for at least the loaded-bike sessions above — handling, climbing,
  and fueling access all change meaningfully with load.
- Tubeless tire setup and puncture resistance matter more than usual given
  sandy/rocky desert terrain; if the athlete is testing new tire/tubeless
  setups, do it well before Refine, not race week.
- Lighting and tracker battery life should be tested on at least one
  overnight training ride, not assumed from specs.
- Because support is start/finish only, resupply logistics (carrying enough
  buffer between towns, planning around shop hours) are part of the athlete's
  own preparation, not something the plan needs to schedule — but the
  fueling plan (below) should assume unplanned, opportunistic resupply
  rather than reliable planned stops.

## Fueling delta

This section adds the Badlands-specific delta on top of the shared fueling
model in `references/nutrition.md` (long-ride daily carb periodization,
on-bike g/h targets, hydration/electrolyte guidance, and race-day fueling
principles) — read that file first; only the Badlands-specific emphasis is
repeated here.

- **Gut training toward the top of `nutrition.md`'s long-ride on-bike range
  (90–120 g/h)** on long training rides during Build/Refine, progressively,
  since the race requires sustained high carb intake for many consecutive
  hours across multiple days.
- **Desert heat electrolyte load** — sodium/electrolyte intake should be
  trained and tuned for heat exposure (Tabernas/Gorafe/Cabo de Gata
  conditions), not just carbohydrate.
- **Multi-day, unplanned-resupply-as-fuel-stop fueling** — because support
  is start/finish only, the athlete's fueling plan should rehearse buying
  and eating real food from shops/petrol stations opportunistically, not
  rely solely on carried race nutrition products.
- **Sleep-deprivation fueling** — caffeine timing and staying adequately fed
  while cognitively impaired by sleep loss should be rehearsed on the
  overnight/low-sleep training sessions above, not left to race day.

## Sources (for review)

- https://badlands.cc/rules/ — format rules, self-supported definition, drafting, tracker, mandatory gear, eligibility/insurance.
- https://badlands.cc/badlands2026/ — 2026 distance/elevation, start location, dates.
- https://bikepacking.com/event/badlands-2026/ — 2026 start location/date, terrain (Pico Veleta, deserts, coast), distance/elevation confirmation.
- https://badlands.cc/2026preview/ — course/terrain detail (climbs, desert sections); note this figure set (817 km/14,420 m) diverges from the 2026 official listing (800 km/16,000 m), which is the edition-to-edition variance this file flags throughout.
