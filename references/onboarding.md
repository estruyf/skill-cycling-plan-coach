# Onboarding - first run

Run this when `athlete.json` is missing or incomplete. Keep it conversational and dynamic, not a form read aloud: ask in the order below, but branch where noted, skip what a prior answer already implies, and only circle back for something missing at the end. Ask in the athlete's language once it is known (start in English, switch as soon as they pick a language). After writing `athlete.json`, continue directly into weekly planning in the same turn.

## Before you start - check the runtime

Claude Code is a fully supported native runtime for this skill, the same as claude.ai or Claude Desktop with Skills — per `documents/multi-event-and-webui-plan.md`, onboarding, plan generation, and config changes are designed to happen via Claude Code chat, with the web dashboard only for viewing plans and logging data afterward. Strava and other connectors attach to whichever Claude client is running the skill, Claude Code included (see `docs/infra.md`). Being on Claude Code is not by itself a reason to flag anything below.

The one runtime this flow cannot reproduce is working directly inside this skill's own GitHub source repository — a session editing `SKILL.md`, `references/*.md`, or other files that ship *in* the skill, rather than a session where the skill is installed as a packaged skill (or run from a real athlete's own project) with only `athlete.json` and generated output living alongside it. That kind of dev-repo session has no real athlete, no real connector state, and no real `supabaseAthleteId` to link. If it looks like onboarding is being asked for inside this dev repo rather than through an installed skill, say so plainly before proceeding, and continue with a simulated/dev run only if the person explicitly confirms that's what they want — treat any `athlete.json` produced there as a dev fixture, not a real athlete's config.

This is a long list because the plan may need to engineer large changes — big weight loss, a first ultra-distance finish, a big strength or power jump — not just optimize around a stable baseline, and getting that safely right needs a real baseline. Move briskly anyway: many questions below are explicitly optional or skippable, say so when you ask them, and never make the athlete feel like they're filling out a medical form. A short "skip" or "don't know" is always an acceptable answer where noted.

Every question below is tagged with how to ask it:

- **[choice]** — a definitive/categorical answer. Present the options as an explicit list the athlete picks from (use the interactive picker when available; otherwise a lettered/numbered list). Never phrase these as "e.g." prose that leaves the athlete guessing the valid values. If a picker call errors, is unavailable, or comes back denied, do not retry it or explain the failure mid-flow — drop to a plain lettered/numbered list immediately for that question and every remaining choice question in the run.
- **[value]** — a concrete number or short fact (age, weight, FTP, a date). Free text is fine because there's nothing to categorize.
- **[narrative]** — an open invitation for a longer, personal answer. Tell the athlete a few sentences are welcome and useful. Do not offer a pick-list here; the value is in what the athlete chooses to describe.

Ask one question per turn regardless of tag: ask it, wait for the athlete's answer, then ask the next. Never bundle multiple questions — even several **[value]** ones back to back, like age/weight/FTP/target W/kg — into a single message the athlete has to parse and answer all at once. This applies uniformly across choice, value, and narrative questions.

## 1. Language and units

1. **[choice]** Language for your plans? Options: English, Nederlands, Francais, Deutsch, Espanol, Italiano, or name another.
2. **[choice]** Units? Options: metric (km, km/h), imperial (mi, mph).

## 2. Goal branch — what this plan is for

This is the question that shapes everything else, so ask it before the logistics questions below.

3. **[choice]** Are you training for a specific event, or do you want a general training plan? Build the option list dynamically from the `Display name` column of `references/events/README.md` (one option per registry row, growing automatically as events are added — never hardcode a specific event as one of only two permanent options), then append two fixed options last:
   - *(one option per row in the event registry, e.g. "Badlands (Ultra-Distance Gravel Race)")*
   - Other event (not in the list above) — name it (free text, then match against the registry's aliases as a fallback; if it now matches a row, treat it as 3a; otherwise go to 3b).
   - A general training plan, not tied to one event.

   **3a. Matched event** (picked directly from the list, or matched via the "Other event" fallback). Ask **[value]** "What's the event date?" and set `targetEvent` to the matched event id and `eventDate` accordingly. Confirm the goal in one line using the event's own framing (e.g. "training toward Badlands on 2027-08-31") — the athlete can still override with their own words in question 4.

   **3b. Unmatched event name** (from the "Other event" fallback, still not found in the registry). Still capture it as `targetEvent` (free text, no registry id) and ask for the date. Tell the athlete this event isn't in the supported list yet, so the plan will use generic ultra-endurance heuristics rather than an event-specific overlay.

   **3c. No event.** Set `targetEvent` to `null` and `eventDate` to `null`. Continue to question 4 for the goal in the athlete's own words.

4. **[value]** What is your main goal this season? Keep it concrete: a group pace, a climb, a time, a race result. If an event was matched in 3a, this can simply confirm or sharpen that framing (e.g. "finish inside the cutoff and stay upright on the descents") rather than restate the event name.

## 3. Cycling background and current training status

The goal above says where the athlete wants to go; this section says where they're starting from — years riding, the biggest thing they've done, and whether they're currently in form, coming back from time off, or starting from nothing. A power curve (Step 2 of the main workflow) shows current fitness but not this context, and a first-run athlete may have no Strava/Garmin history to derive anything from yet, so ask directly.

5. **[value]** How many years have you been cycling with any structured training or racing behind it — not just casual riding? A rough number is fine.
6. **[value]** What's the longest ride or event you've completed to date — distance or duration, and whether it was a race, an organized ride, or just a personal effort? "None yet" is a fine answer.
7. **[choice]** Have you ever done a multi-day or ultra-distance event before (roughly 12+ hours, 100+ miles, or spread over multiple days)? Options: yes, finished one or more; yes, started but didn't finish; no, this would be a first for me.
8. **[choice]** How would you describe your training over the last 2-3 months? Options: training consistently (structured sessions or high volume), coming back after a break (illness, injury, life, off-season), or starting from little to no structured training.

   **8a.** (only if "coming back after a break") **[value]** Roughly how long was the break? This is a fallback signal for ramp-up pacing when there's no Garmin training-status/ACWR data yet (see `training-model.md`) — treat a longer or more recent break as reason to ramp volume before intensity, the same way `garmin-data.md` treats a low ACWR.

Store as `cyclingYearsExperience`, `longestEffortCompleted`, `ultraDistanceExperience` (`finished`, `attemptedDnf`, or `none`), `currentTrainingStatus` (`consistent`, `returningFromBreak`, or `new`), and `trainingBreakDuration` (string, `null` if not asked).

## 4. Physical profile

9. **[value]** How old are you? (age in years — used to set recovery expectations)
10. **[choice]** Gender? Options: male, female, other, prefer not to say. Used to contextualise W/kg benchmarks; a skip is fine.
11. **[value]** Body weight? (kg or lb; convert to kg)
12. **[choice]** Do you know your FTP? Options: yes (give a number in watts), no (estimate it later from Strava).
13. **[value]** Target W/kg, if you have one? (optional; default 3.5)
14. **[choice]** Is race weight or body composition something you specifically want to work on this season, separate from the goal above? Options: yes, meaningful weight loss is part of it; yes, a modest adjustment; no, current weight/composition is fine; prefer not to focus on this.
15. **[value]** If you know your body fat % or lean mass from any measurement (scale, DEXA, calipers, whatever), share it — otherwise skip, this is optional.

> **Gender note:** If Strava is reachable it will be pulled automatically from the athlete profile. Still ask at onboarding so the config is complete before the first Strava pull, and to allow the athlete to correct it.

Store questions 14-15 as `bodyCompositionGoal` (`significantLoss`, `modestAdjustment`, `maintain`, or `notFocused`) and `bodyFatPercent` (number or `null`).

**If `bodyCompositionGoal` is `significantLoss`:** say plainly, once, that combining meaningful weight loss with heavy training load (especially toward an ultra-distance goal) needs a conservative rate to avoid under-fueling — see the energy-availability guidance in `nutrition.md` — and that a real weight-loss target is worth discussing with a doctor or dietitian alongside this plan. Don't be alarmist about it; state it once and move on.

## 5. What's holding you back — in your own words

16. **[narrative]** Is there anything that feels like it's holding you back physically on the bike? Describe it in your own words — pain, fatigue, or power you can't seem to put down, especially on climbs or hard efforts. A few sentences are more useful here than a quick label.

    For example, an athlete might say: *"When climbing up steep gradients, I feel like I am dragging on the bike. I feel pain in my lower back. I feel like I cannot apply the power that my legs have to the bike. This is something I feel like I need to work on."* That kind of detail is exactly what's useful — it points at something like a posture/core/posterior-chain limiter that a power curve alone can't surface.

    Store the answer verbatim as `physicalNotes` in `athlete.json` (empty string if the athlete has nothing to add — don't force an answer). Treat it as a **hypothesis to weigh, not a diagnosis**: when Step 2/3 of the main workflow sets session and strength/core emphasis, read `physicalNotes` alongside the data-derived rider type from `rider-types.md`, never in place of it. If the two disagree (e.g. the narrative suggests a strength limiter but the power curve looks fine), say so plainly rather than picking one silently.

    **16a. Structured follow-up** (only if question 16 described an actual issue — skip entirely if the athlete had nothing to add). The narrative alone doesn't say how often it matters or whether it's been looked at, so ask two quick closed questions before moving on. If the athlete's answer bundled more than one distinct thing (e.g. a power limiter and a pain location), ask these about whichever one they'd flag as most relevant to training — the full verbatim answer is already preserved in `physicalNotes`, this just adds two data points on top of it.

    - **[choice]** How often does this come up — every ride, mainly on hard efforts or climbs, or only occasionally? Options: every ride, mainly hard efforts/climbs, occasionally. Store as `physicalNotesFrequency`.
    - **[choice]** Has this been looked at by a physio, doctor, or bike fitter? Options: yes, no, not yet but planning to. Store as `physicalNotesAssessed`.

    Mention once, briefly, that this isn't fixed forever — the athlete can tell you at any point that it's changed, better, worse, or gone, and you'll update `physicalNotes` (and the two follow-up fields) then, rather than only ever asking at first setup.

## 6. Strength and training background

17. **[choice]** Have you strength-trained before — things like squats, deadlifts, or similar barbell/dumbbell lifts? Options:
    - New to it / never really lifted
    - Some experience, but out of practice
    - Yes, I train regularly already

    Store as `strengthExperience`: `new`, `returning`, or `experienced`. This gates how `strength-prescription.md` prescribes load: a first-time lifter starts conservative (lighter load, more form-focused reps) before working up to the standard prescriptions; an experienced lifter can start there directly.

18. **[value]** (skip if "yes, I train regularly already" above) Roughly how many years of structured strength training do you have, on and off? A rough total is fine. Store as `strengthYearsExperience` (number or `null`).
19. **[choice]** How often have you strength-trained in the last 2-3 months? Options: not at all, about once a week, about twice a week, three or more times a week. Store as `strengthRecentFrequency`. This is a recency check on top of question 17's lifetime experience — someone "experienced" but at "not at all" recently should still get a short re-ramp, not the full working load on day one.
20. **[value]** If you currently strength train, roughly what are your current working weights on the key lifts — squat, deadlift, or similar? Whatever you know off the top of your head is fine, exact numbers aren't required; skip if you don't lift right now. Store verbatim as `strengthCurrentLifts` (empty string if skipped). When this is given, `strength-prescription.md` should anchor the first block's loads to it directly rather than the generic conservative default.
21. **[value]** (skip if "yes, I train regularly already" was picked at question 17) Any past injuries, surgeries, or joint issues that matter for lifting — knees, back, shoulders, or anything else? Optional, free text, leave blank if nothing comes to mind. Store as `strengthInjuryNotes` (empty string if skipped). This is separate from `physicalNotes` above: it's specifically about what to avoid or adapt when selecting strength exercises, not about what limits the athlete on the bike.
22. **[choice]** What strength equipment do you have access to? Options: a full gym (barbells, racks, machines, cables), home dumbbells/bands, or bodyweight only. Store as `equipment`: `fullGym`, `homeDumbbells`, or `bodyweight`. This gates which exercises `strength-patterns.md` can offer (a `bodyweight` athlete gets regressions only). Kept in `athlete.json` only, not synced to Supabase.

## 7. Resting heart rate and metabolic baseline

Garmin (`garmin-data.md`) supplies `vo2max`, `lthr`, and readiness/HRV automatically when connected. These questions are the fallback baseline for everyone else, so onboarding isn't blind to fitness context just because a wearable isn't hooked up yet.

23. **[value]** Do you know your resting heart rate? (beats per minute; optional, skip if you don't track it — most wearables show this even without a full Garmin export)
24. **[choice]** Have you had any lab or field testing done — a VO2max test, lactate threshold test, or metabolic/fat-max test? Options: yes, no.

    **23a.** (only if yes) **[value]** What did it show, and roughly when? Numbers and an approximate date, whatever you remember — this doesn't need to be precise.

Store as `restingHr` (number or `null`) and `labTestingNotes` (string, verbatim, empty if none or not asked). Both are self-reported fallbacks: once Garmin or Strava supplies a live equivalent, that live data takes priority the same way live FTP overrides `fallbackFtp`.

## 8. Training logistics

25. **[choice]** Which days are your group or social rides? Options: Mon/Tue/Wed/Thu/Fri/Sat/Sun (multi-select); default Saturday and Sunday if skipped.
26. **[choice]** Which days can you usually train? Options: Mon/Tue/Wed/Thu/Fri/Sat/Sun (multi-select); default all if skipped.
27. **[value]** Typical session duration? (minutes per workout, e.g. 60 or 90; the weekly intake can vary this per day)
28. **[choice]** How many structured key sessions per week? Options: 1, 2, 3. Default 2.
29. **[choice]** Strength by default? Options: strength + core, core only, none.
30. **[narrative]** Any writing preferences? (tone, things to avoid; optional — free text, no wrong answer)

## 9. Nutrition and current eating pattern

31. **[choice]** Any dietary restrictions or allergies I should plan fueling around? Options (multi-select): none, vegetarian, vegan, gluten-free, dairy-free, other (name it). Store as `dietaryRestrictions` (string array; empty array for "none").
32. **[narrative]** Anything you've noticed about fueling on the bike — foods or products that upset your stomach during hard or long rides, or ones you know you tolerate well? A few sentences is useful: brand names, food types, whatever you've noticed, even if it's never been formally diagnosed. Store as `fuelingNotes` verbatim (empty string if nothing to add).
33. **[choice]** For on-bike fueling, do you lean toward gels/drink mix, real food, or a mix of both? Options: mostly gels/drink mix, mostly real food, a mix of both, no preference yet. Store as `fuelingPreference`.
34. **[narrative]** Roughly, what does a typical day of eating look like for you right now? A few sentences is plenty — meals, snacks, whether you track anything. This is just a baseline for context, not a food diary. Store as `currentEatingPatternNotes` verbatim (empty string if skipped).
35. **[choice]** Right now, are you actively trying to lose weight, gain weight/mass, or maintain? Options: losing weight, gaining weight/mass, maintaining, not a current focus. Store as `currentWeightGoalDirection`.

> **FatSecret note:** mention once, briefly, that connecting a FatSecret account (`references/fatsecret-data.md`) is optional and lets the plan compare actual logged carbs against this week's fueling targets — same tier as the Strava/Garmin/WHOOP connectors, nothing to set up here in the config itself, and skipping it changes nothing about the plan.

## 10. Meal planning (optional)

36. **[choice]** Would you like a full weekly meal plan — an actual day-by-day breakfast/lunch/dinner/snack list — or just the fueling targets and on-bike guidance you already get either way? Options: yes, build a full meal plan; no, targets and guidance only. Store as `mealPlanEnabled` (bool).

    *(questions 36-38 only if opted in above; skip straight to "Write the config" otherwise)*

37. **[choice]** What's your usual meals/snacks pattern? Options: 3 meals + 2 snacks, 3 meals with no snacks, grazing / no fixed pattern. Store as `mealPattern` (`threeMealsPlusTwoSnacks`, `threeMealsNoSnacks`, or `grazing`).
38. **[choice]** How would you describe your cooking time or setup? Options: I cook fresh most days, I batch-cook on set days and eat leftovers, weekdays need to be minimal-time (weekends can be more involved). Store as `cookingConstraints` (`cooksFreshMostDays`, `batchPrep`, or `minimalTimeWeekdays`).
39. **[narrative]** Any cuisines or foods you genuinely enjoy, and anything beyond your dietary restrictions above that you actively dislike? A few examples are plenty. Store as `foodPreferences` verbatim (empty string if skipped) — this is about preference, not restriction; `dietaryRestrictions` already covers what to avoid outright.

None of questions 35-38 are write-once, same principle as every other self-reported field here — update on the spot when the athlete mentions a change (a new dislike, a schedule change that shifts cooking constraints, wanting to turn the meal plan on or off).

## Write the config

Map the answers onto the fields in `athlete-config.md` and write `athlete.json`, including `targetEvent`, `eventDate`, and `physicalNotes` (plus `physicalNotesFrequency` / `physicalNotesAssessed` when question 16a was asked) from the goal branch and narrative questions above, `cyclingYearsExperience`, `longestEffortCompleted`, `ultraDistanceExperience`, `currentTrainingStatus`, `trainingBreakDuration`, `bodyCompositionGoal`, `bodyFatPercent`, `strengthExperience`, `strengthYearsExperience`, `strengthRecentFrequency`, `strengthCurrentLifts`, `strengthInjuryNotes`, `equipment`, `restingHr`, `labTestingNotes`, `dietaryRestrictions`, `fuelingNotes`, `fuelingPreference`, `currentEatingPatternNotes`, `currentWeightGoalDirection`, `mealPlanEnabled`, `mealPattern`, `cookingConstraints`, and `foodPreferences` from the sections above. Set `riderTypeOverride` to null so the skill derives the rider type from data. Confirm in one line — goal, event if any, and that a physical note was captured if given — and continue to the weekly plan.

None of the self-reported fields above are fixed forever: if the athlete brings up a change later (an injury clearing up, more lifting experience, a return to consistent training, a new fueling sensitivity), update the relevant field(s) in `athlete.json` on the spot rather than treating onboarding as the only time these are ever asked.

If FTP is unknown, set `fallbackFtp` to a conservative estimate (e.g. 2.5 W/kg times weight) and tell the athlete the first Strava pull or an FTP test will replace it.
