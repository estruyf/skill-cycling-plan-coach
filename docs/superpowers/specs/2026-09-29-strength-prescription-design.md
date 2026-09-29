# Evidence-based, athlete-specific S&C prescription — design

Date: 2026-09-29. Status: draft for review. Source evidence: `documents/strength-research-brief.md`.

## Problem

Generated S&C plans (e.g. `2026-W40-strength.md`) read as generic. `references/strength-library.md` is a fixed exercise bank with hardcoded sets/reps, vague load cues ("heavy", "light"), a one-line warm-up, no rationale for exercise choice, and no use of most `athlete.json` data (age, bodyweight, event, injury notes, equipment). It also conflicts with the research: Base is prescribed as 3-4x10-12 throughout, where evidence supports a short anatomical block ramping to 3x4-6 heavy by weeks 9-12.

## Goal

Every strength plan states, per exercise, why it was chosen for this athlete, the sets x reps, an RIR target and a load, and includes a structured warm-up. Prescriptions follow the research brief's phase x experience decision table. Rules carry a confidence tag (evidence / consensus / convention) so the coach is honest about what is proven.

## Non-goals

- No change to the `workouts.target` strength JSON shape (`web/lib/types.ts`): the reason is folded into `load_cue`. No migration, no web change.
- No per-athlete movement-screen / strength-profile generation at onboarding (deferred; could read the same fields later).
- No change to bike-session logic.

## Design

### 1. File structure

`strength-library.md` is split into three references (the old file is removed; all links updated):

| File | Contents |
|---|---|
| `references/strength-patterns.md` | Six categories: knee-dominant bilateral (K), unilateral (U), hinge (H), calf (C), trunk (T), pull/upper (P). Per category: cycling role, exercises with regressions/progressions, contraindication flags keyed to `strengthInjuryNotes`, equipment needed, and rotation rule (swap accessory variants every 3-4 weeks; keep one main lift per pattern stable). Selection rule: full session = one K or H main lift + one U + one H or C + one T (+ P when ultra target). Low-back/quad-tightness flag: trap bar and leg press before back squat and straight-bar deadlift for the first two blocks. |
| `references/strength-prescription.md` | The phase x experience table from the research brief (sets x reps, RIR, approx %1RM, rest 2-3 min, frequency), progression and deload rules, starting-load rules, taper rule, and the existing logged-outcome table (moved unchanged, retargeted to RIR). Cross-cutting rules: fast concentric intent, no failure sets, strength >=24 h before quality bike sessions, 1x/week if bike load is very high. |
| `references/strength-session.md` | RAMP warm-up template, ramp-up sets for the first lift, cool-down/mobility (hip flexors, thoracic, hamstrings, ankles), duration, placement against bike days. |

Every rule is tagged `[evidence]`, `[consensus]` or `[convention]` per the brief's ratings.

### 2. Prescription model

- **Controller is RIR**, %1RM is a guide. Phases follow the brief's table for the athlete's `strengthExperience` category. Season phase mapping replaces the "Season strength periodization" section of the old file: Base = anatomical adaptation (wk 1-3, 2x8-12, RIR 3-4), then 3x6-8, then 3x4-6 intro; Deload = half volume, load held; Build = 3x4-6 main lift, 2x6-8 accessories, fast concentric; Refine = 2-3x3-5, 1x/week; Taper below.
- **Starting loads.** `strengthCurrentLifts` is a free-text anchor, not a 1RM. Rule: treat the reported weight as a load the athlete has handled for sets (assume 5-8 reps); prescribe first-session loads for a *new movement pattern* (trap bar, leg press) at roughly 60% of that anchor and set the real working load in-session by RIR (add weight until the set lands at target RIR). No formula-based 1RM estimation (the Epley formula was unverified in the brief). Session 1 is explicitly labelled a load-finding session.
- **Progression.** Double progression within the phase's rep range; add load (2.5-5 kg upper body/accessories, 5-10 kg main lifts) when all sets hit the top of the range at the target RIR on two consecutive sessions.
- **Taper (convention).** No strength in the last 5-7 days before the target event; at most one light primer (1-2x3-5 at ~70-85%, RIR >=3) around 10-14 days out; nothing novel or eccentric.
- **On-bike pairing (consensus).** Build/Refine strength weeks are tagged for one low-cadence torque or short-sprint bike effort, because the sprint/5-min findings are the closest evidence for the athlete's steep-climb limiter. The strength file suggests it; the bike week builder decides placement.

### 3. Session structure and output

- Strength file gains sections: session header (phase, intent, RIR target), **Warm-up** (RAMP, 8-10 min, then ramp-up sets for the first lift, e.g. 50%x5, 70%x3, 85%x1-2 of the working load), the main table, **Cool-down/mobility**, and **Why this session** (one line per exercise citing the athlete field or phase driving the choice, e.g. "trap bar over back squat: lower-back tightness in `strengthInjuryNotes`").
- `plan-format.md` section 5 table adds the reason to `load_cue`; the JSON stays `{"exercise","sets_reps","load_cue","rest"}`.
- New `athlete.json` field `equipment` (`fullGym` | `homeDumbbells` | `bodyweight`), added to `athlete-config.md` and asked in onboarding (section 6). It gates exercise availability in `strength-patterns.md`. Existing athletes with the field missing are asked once.

### 4. SKILL.md and checks

- Step 3 (strength emphasis) points at the three new files, requires a reason + RIR + load for every exercise, and keeps naming the athlete-specific driver in one line.
- Step 6 item 3 requires the warm-up, cool-down, and reason blocks in the strength file.
- "Quality checks before delivering" gains items: every exercise has a stated reason, RIR target and load; a warm-up block exists; the phase/experience row used is named; taper rule respected.
- `CLAUDE.md` and the Step 7 sync text update file references; the `target` JSON shape statement is unchanged.

### Testing

No test suite exists. Verification: regenerate the strength file for W40 (Base, `new`, lower-back note, full gym) and check against the brief's decision table and the new quality checks; then a second run with a logged `failed_too_hard` status to confirm the outcome rules still apply; then `npm run build` (packaging) and `cd web && npm run lint` (no web change expected).

### Known limits (stated in the files, not hidden)

Ultra-length durability and steep-climb effects are unproven; meta-analytic certainty is low; hinge/hip-thrust/trunk work and the taper rule are consensus/convention; no verified cyclist strength benchmarks, so none are used as gates.

## Open items for the implementation plan

- Ordering of the file split vs. `SKILL.md` edits so no link is ever dangling.
- Whether `README.md` needs a mention.
