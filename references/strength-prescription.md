# Strength prescription (sets, reps, RIR, load, progression)

How hard and how much to lift, by phase and experience. Which exercises to pick is in `references/strength-patterns.md`; how a session is laid out (warm-up, ramp-up sets, cool-down, output template) is in `references/strength-session.md`. Evidence base: `documents/strength-research-brief.md`.

**Confidence tags.** Every rule is tagged so the coach stays honest about what is proven:
- `[evidence]`: RCTs or reviews in cyclists or close populations (small trials; the newest meta-analysis rates certainty as low).
- `[consensus]`: widely used, plausible, extrapolated from general resistance-training science.
- `[convention]`: reasoned practice with no direct evidence for this population.

**Controller is RIR** (reps in reserve): RIR 3 = stop with 3 clean reps left. %1RM is only a guide. Translate exercise names, load cues and rest cues into the athlete's language.

## What strength is for

Heavy, low-rep, high-intent work improves sub-maximal efficiency, sprint/peak power and 5-45 min all-out power; it does not raise VO2max or FTP `[evidence]`. Never promise FTP or VO2max gains from lifting. Gym strength supplements on-bike specific work, it does not replace it `[consensus]`. For the steep-climb / high-intensity limiter, pair Build/Refine strength weeks with one low-cadence torque or short-sprint bike effort (see "On-bike pairing").

## Phase x experience table

Intensity is approximate %1RM; RIR is what you actually prescribe. Frequency assumes strength days sit >=24 h before key bike sessions. Emphasis letters are the categories in `strength-patterns.md`: **K** knee-dominant bilateral, **U** unilateral, **H** hinge, **C** calf, **T** trunk, **P** pull/upper.

### `new` (no or recent-none lifting)

| Phase | Sets x reps | Intensity | Frequency | Emphasis |
|---|---|---|---|---|
| Base wk 1-3 (anatomical adaptation) | 2 x 8-12 | 55-70% (RIR 3-4) | 2x | K (leg press/goblet), U (light step-up), H (trap bar/light RDL), T, P; technique gates |
| Base wk 4-8 | 3 x 6-8 | 70-80% (RIR 2-3) | 2x | K, U, H, C, T, P; add single-leg hip flexion |
| Base wk 9-12 (max-strength intro) | 3 x 4-6 | 80-87% (RIR 1-3) | 2x | K (trap bar/leg press), U, H, C |
| Deload | 2 x 6-8, load held | same or -10% load, RIR 4 | 1x | Same lifts, half volume |
| Build | 3 x 4-6 main lift, 2 x 6-8 accessories | 82-88% (RIR 2) | 1-2x (2x only if bike load allows) | K, U, H, T; fast concentric; add on-bike torque/sprint work |
| Refine | 2-3 x 3-5 | 85-90% (RIR 2-3) | 1x | K, U + trunk; no new exercises |
| Taper (last 14 d) | see "Taper" | 70-85% (RIR >=3) | 0-1x | Neural primer only |

### `returning` (some prior training; treat as `new` until 4 weeks of consistent training)

| Phase | Sets x reps | Intensity | Frequency | Emphasis |
|---|---|---|---|---|
| Base | wk 1-2: 2-3 x 8-10; wk 3-8: 3 x 5-8; wk 9-12: 3 x 4-6 | 65% to 85% (RIR 3 to 1-2) | 2x | K, U, H, C, T, P |
| Deload | 2 x 5-6, load held | RIR 3-4 | 1x | Main lifts only |
| Build | 3 x 4-6 | 85-88% (RIR 1-2) | 1-2x | K, U, H; sprint/torque on bike |
| Refine | 2-3 x 3-5 | 85-90% (RIR 2-3) | 1x | K, U |
| Taper | as `new` | as `new` | 0-1x | Primer |

### `experienced` (>=2 y consistent heavy lifting)

| Phase | Sets x reps | Intensity | Frequency | Emphasis |
|---|---|---|---|---|
| Base | 3 x 6-10 for 3-4 wk, then 3-4 x 3-5 | 75-85%, then 85-92% (RIR 1-2) | 2-3x | K, U, H, C, hip flexion, T, P |
| Deload | 2 x 3-5, load held | RIR 3-4 | 1x | Main lifts |
| Build | 3 x 3-5 | 85-90% (RIR 1-2) | 1-2x | K, H, U; add power (jump squat, loaded box jump, or on-bike sprints) if freshness allows |
| Refine | 2 x 3-4 | 85-90% (RIR 2-3) | 1x | Main lifts + trunk |
| Taper | as `new` | as `new` | 0-1x | Primer |

Table confidence: `[consensus]` for the ramp shape (all cycling trials started strength-naive cyclists on a 10RM to 4RM ramp, `[evidence]` for that trial design); Build/Refine 1x/week maintenance `[evidence]`.

## Season phase mapping

Applies once `season-plan.json` exists (per `references/macrocycle-model.md`). Use the athlete's `strengthExperience` row above for the phase in `currentPhaseId`.

- **Base** = anatomical adaptation then heavy intro. Key the ramp to **week-in-phase**, not calendar weeks. Base is not always 12 weeks: if Base is shorter, keep the wk 1-3 stage, then compress so the final 2-3 weeks of Base land on the 3 x 4-6 stage.
- **Deload (either block)** = half the volume, load held, RIR 3-4, at most 1x, `[consensus]`. Never schedule max-strength or power work in a deload.
- **Build** = 3 x 4-6 main lift, 2 x 6-8 accessories, fast concentric. Progress per the logged-outcome table below.
- **Refine, until the culminating B2 rehearsal** = maintenance at held load (2-3 x 3-5, RIR 2-3), 1x/week, no new exercises, so legs are fresh for B2.
- **Refine, B2 onward** = maintenance tapering to none; follow "Taper" inside the last 14 days.

Without a season skeleton, use the experience row's Base ramp counted in weeks since the athlete's first strength session (or since a re-ramp), and the Build row once past week 12.

**Worked example (Badlands Ultra):** Build (13 weeks per `badlands-ultra.md`'s instantiation) runs the max-strength stage throughout, including through C2 and B1. Refine opens into maintenance because B2 lands about 15% into Refine (per `trial-events.md`).

## Starting loads `[consensus]`

- `strengthCurrentLifts` is a free-text anchor, not a 1RM. Treat the reported weight as a load the athlete has handled for sets (assume 5-8 reps).
- For a **new movement pattern** (trap bar, leg press, goblet squat), prescribe the first session at roughly **60% of that anchor** and set the real working load in-session: add weight until the set lands at the target RIR. Label session 1 explicitly as a **load-finding session** in the plan.
- No formula-based 1RM estimation (the Epley formula was unverified in the brief).
- Conservative first-session anchors when nothing is reported (adjust by RIR): goblet squat 16-24 kg x 10, trap-bar deadlift 40-50 kg x 8, leg press 60-80 kg x 10, step-up bodyweight to 2 x 8-10 kg x 8/leg, RDL 30-40 kg x 10.
- If `strengthRecentFrequency` is `none` or low, an otherwise `experienced` lifter still gets a short re-ramp: one progression step back for the first 1-2 sessions, like a `returning` lifter.
- Technique gates before adding load: bracing and neutral spine under load; hinge without lumbar rounding; leg press/squat to target depth without knee valgus; step-up with control for 8 reps/leg; two consecutive sessions with pain <=2/10 `[consensus]`.

## Progression `[consensus]`

Double progression inside the phase's rep range. Add load when **all sets hit the top of the range at the target RIR on two consecutive sessions**: +2.5-5 kg for upper body/accessories, +5-10 kg for main lifts (about +2.5 kg for squat and step-ups). Never progress by adding failure sets. Expect roughly 15-25% strength gain over 8-12 weeks for a strength-naive rider.

## Cross-cutting rules

- Fast concentric intent on every rep, eccentric about 2-3 s `[consensus]`.
- No failure sets on compound lifts (RIR 0 is not needed for endurance athletes) `[consensus]`.
- Rest 2-3 min on heavy compound sets `[evidence]`; 60-90 s on accessories.
- Strength >=24 h before a quality bike session, ideally 36-48 h in the first weeks or after a heavy hinge day `[evidence]` (soreness/damage markers stay elevated about 45 h).
- If bike load is very high (>15 h/week with a hard-week peak), fall back to 1x/week and tell the athlete `[consensus]`.
- If the season only allows 1x/week overall, run one full session (3 x 4-6 heavy K/U/H + trunk) rather than two half sessions `[consensus]`.
- Avoid endurance-style 15-25 rep leg circuits as the main driver `[consensus]`.
- **Pain rule:** stop or regress a lift if pain >3/10 persists >24 h or alters mechanics; keep hinge load submaximal until pain-free for two consecutive sessions `[consensus]`.
- **Soreness rule:** DOMS >=6/10 at 48 h means cut lower-body volume about 30% next session and keep it away from hard bike days; soreness >72 h or with joint pain means deload and reassess `[consensus]`.
- Deload triggers beyond the plan: two "too hard" sessions in a row, or rising knee/back symptoms.
- Masters (this athlete is 39): no special modification beyond sensible load; keep 6-12 hard lower-body sets per session and RIR 2-3 early `[consensus]`.

## Taper `[convention]`

No strength in the last 5-7 days before the target event. At most **one light primer** (1-2 x 3-5 at about 70-85%, RIR >=3) around **10-14 days out**. Nothing novel and nothing eccentric. There is no RCT on strength timing in a cyclist taper.

## On-bike pairing `[consensus]`

Tag every Build/Refine strength week with a suggestion of one low-cadence torque or short-sprint bike effort: sprint and 5-min all-out findings are the closest evidence for a steep-climb limiter (short-sprint training beat heavy lifting for 6-s sprint power). The strength file only suggests it; the bike week builder decides placement.

## Logged-outcome rules (override the default progression above)

Once an athlete logs a strength session's outcome (web UI, per `documents/multi-event-and-webui-tasks.md` B5/B8), its status overrides the default double-progression rule for that exercise's next occurrence. Same status vocabulary as `workout-library.md`'s bike-session rules. `SKILL.md` Step 1 reads back recent `strength_logs` each run when `supabaseAthleteId` is set (per B8) and applies this table; when an exercise's last occurrence has no logged status (or `supabaseAthleteId` is `null`), the plain default rule stands.

| Logged status | Adjustment at the next occurrence of that exercise |
|---|---|
| `completed_as_planned` | Progress per "Progression" above. |
| `completed_easier_than_planned` | Apply the next load increment now (+2.5-5 kg accessory, +5-10 kg main lift), one step ahead of the default cadence; treat as RIR >=4 (add about 5% lower body). |
| `completed_harder_than_planned` | Hold at the same load; do not add load next time. |
| `failed_too_hard` | Regress to the load/rep scheme this exercise used one occurrence back (cut load 5-10%); if there is no prior occurrence, use the Base wk 1-3 row for the athlete's experience (light load, 2 x 8-12, RIR 3-4). State the adjustment and why in the next plan's last-week summary. |
| `skipped` (this session skipped twice or more in a row) | Missed-training signal: re-ramp at reduced load (about 85-90% of last loads at RIR 3) for the next 1-2 sessions before returning to the previously-working load. A single skipped session: resume without catching up. |

Failed two consecutive sessions on the same lift: cut load 10% and rebuild, or swap to a variation from the same pattern in `strength-patterns.md`.

## Known limits (stated, not hidden)

- No trial covers strength training for a 700+ km, multi-day self-supported event; durability evidence is from 3-hour protocols, so ultra-length and steep-climb effects are unproven.
- Meta-analytic certainty is low: small samples, unblinded trials.
- Hinge, hip-thrust and trunk work, and the taper rule, are consensus/convention.
- No verified cyclist relative-strength benchmarks exist (x bodyweight), so none are used as gates.
