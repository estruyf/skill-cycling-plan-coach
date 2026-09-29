# Meal-building-block library

Turns `references/nutrition.md`'s daily carb/protein/fat targets into an
actual day-by-day list of meals and snacks, built from a small set of common
foods rather than a real food database — the same "library the skill
assembles from" pattern `references/workout-library.md` uses for sessions
and `references/strength-patterns.md` uses for exercises. Only produced when
`mealPlanEnabled` is `true` (`references/athlete-config.md`); an athlete with
it unset or `false` sees no meals output, only the existing fueling targets
in `plan-format.md` §6.

Approximate, coaching-register figures, same register as the rest of this
skill (g/kg ranges, not exact grams) and `nutrition.md`'s own caveat — not a
substitute for individualized medical or dietetic advice. Land each day's
totals within **±10% of `nutrition.md`'s day-type carb/protein/fat target**;
exact-gram precision is never the goal.

Worked examples below use a 70 kg athlete, the same reference weight
`nutrition.md` uses. Scale every block's portion by the athlete's actual
`weightKg` when building a real plan.

## Personalizing within the model

Four onboarding fields narrow which blocks fill a template's slots without
changing the target macros the template is built to hit (FR5):

- **`dietaryRestrictions`:** never select a block whose tags don't cover
  every restriction the athlete has. `vegan` excludes anything not also
  tagged `vegan`; `glutenFree`/`dairyFree` exclude blocks not tagged with
  those. An `other` restriction (free text from onboarding) has no matching
  tag in this file — flag it plainly when a template would otherwise include
  a block that might conflict, and ask rather than guess.
- **`foodPreferences`:** a hypothesis from the athlete's own account, read
  the same way `fuelingNotes` is read in `nutrition.md` — prefer blocks/
  cuisines it names as enjoyed when more than one same-category, same-tag
  option would otherwise fit equally well; avoid anything it names as
  disliked even before a logged-feedback signal confirms it.
- **`fuelingPreference`:** biases the on-bike fueling slot specifically (not
  the rest of the day) — `gels` leans on the gel/drink-mix blocks below,
  `realFood` leans on the real-food on-bike options, `mixed` combines both,
  `noPreference` uses whichever best hits the day type's g/h target.
- **`mealPattern`** and **`cookingConstraints`** reshape how the day's
  templates are grouped into eating occasions and how much active cooking
  each slot assumes — see "Adjusting for meal pattern" and "Adjusting for
  cooking constraints" below. Neither changes the day's target macros, only
  how they're distributed and how much prep each slot needs.

## Food-building blocks

Approximate macros per stated portion. `g` figures are carb/protein/fat in
grams. Tags list which `dietaryRestrictions` values the block is compatible
with; a block with no tags listed is compatible with none of
`vegetarian`/`vegan`/`glutenFree`/`dairyFree` restrictions (typically meat/
fish) and should be swapped when any of those apply.

### Grain / starch

| Block | Portion | Carb | Protein | Fat | Tags |
|---|---|---|---|---|---|
| Oats (cooked) | 100 g dry | 69 g | 12.5 g | 7.5 g | vegetarian, vegan, dairyFree *(not glutenFree unless certified GF oats)* |
| White or brown rice (cooked) | 200 g | 45 g | 4 g | 0.5 g | vegetarian, vegan, glutenFree, dairyFree |
| Baked potato | 250 g | 45 g | 5 g | 0 g | vegetarian, vegan, glutenFree, dairyFree |
| Wholegrain bread | 2 slices (~70 g) | 30 g | 8 g | 2 g | vegetarian, vegan, dairyFree *(swap for GF bread when `glutenFree`)* |
| Pasta (cooked) | 200 g | 50 g | 7 g | 1 g | vegetarian, vegan, dairyFree *(swap for GF pasta when `glutenFree`)* |

### Protein

| Block | Portion | Carb | Protein | Fat | Tags |
|---|---|---|---|---|---|
| Chicken breast (cooked) | 150 g | 0 g | 35 g | 4 g | glutenFree, dairyFree |
| Eggs | 2 large | 1 g | 12 g | 10 g | vegetarian, glutenFree, dairyFree |
| Greek yogurt | 200 g | 8 g | 20 g | 5 g | vegetarian, glutenFree |
| Tofu | 150 g | 3 g | 15 g | 8 g | vegetarian, vegan, glutenFree, dairyFree |
| Lentils (cooked) | 200 g | 30 g | 18 g | 1 g | vegetarian, vegan, glutenFree, dairyFree *(also a starch source — counts against either slot)* |
| Whey protein (1 scoop) | ~30 g powder | 3 g | 24 g | 2 g | vegetarian, glutenFree |
| Plant protein (1 scoop) | ~30 g powder | 2 g | 20 g | 2 g | vegetarian, vegan, glutenFree, dairyFree |

### Fat

| Block | Portion | Carb | Protein | Fat | Tags |
|---|---|---|---|---|---|
| Olive oil | 1 tbsp (14 g) | 0 g | 0 g | 14 g | vegetarian, vegan, glutenFree, dairyFree |
| Avocado | ½ (100 g) | 9 g | 2 g | 15 g | vegetarian, vegan, glutenFree, dairyFree |
| Almonds or peanut butter | 30 g / 2 tbsp | 6 g | 7 g | 15 g | vegetarian, vegan, glutenFree, dairyFree *(flag if `dietaryRestrictions` names a nut allergy under `other`)* |
| Cheese | 30 g | 0 g | 7 g | 9 g | vegetarian, glutenFree |

### Fruit / veg

| Block | Portion | Carb | Protein | Fat | Tags |
|---|---|---|---|---|---|
| Banana | 1 medium | 27 g | 1 g | 0 g | vegetarian, vegan, glutenFree, dairyFree |
| Mixed berries | 150 g | 12 g | 1 g | 0 g | vegetarian, vegan, glutenFree, dairyFree |
| Side salad / cooked veg | 150 g | 6 g | 2 g | 0 g | vegetarian, vegan, glutenFree, dairyFree |
| Dried dates | 30 g (~3) | 24 g | 0 g | 0 g | vegetarian, vegan, glutenFree, dairyFree |

### On-bike / recovery fueling

Sized against `nutrition.md`'s g/h on-bike ranges and post-ride 1–1.2 g/kg
carb + 0.3–0.4 g/kg protein window, not restated here.

| Block | Portion | Carb | Protein | Fat | Tags | `fuelingPreference` fit |
|---|---|---|---|---|---|---|
| Energy gel | 1 (~40 g carb) | 40 g | 0 g | 0 g | vegetarian, vegan, glutenFree, dairyFree *(verify per brand)* | `gels` |
| Sports drink mix | 1 scoop | ~30 g | 0 g | 0 g | vegetarian, vegan, glutenFree, dairyFree *(verify per brand)* | `gels` |
| Rice cakes / dates / banana | as needed | varies (see blocks above) | — | — | as per underlying block | `realFood` |
| Recovery shake | 1 scoop protein + 1 banana + 30 g dates | ~54 g | ~25 g (whey) / ~21 g (plant) | ~2 g | as per protein block chosen | n/a — post-ride, not on-bike |

`mixed` combines a gel/drink-mix block for the first on-bike serving with a
real-food block later in the ride; `noPreference` picks whichever combination
of the blocks above lands closest to the day type's on-bike g/h target.

## Day-type templates

One template per day type — Rest / Endurance (Z2) / Structured-or-key /
Long — the same four buckets `nutrition.md`'s carb table uses. Each maps to
whichever of the week's actual 7 days share that day type (Step 4), rather
than being authored bespoke per calendar day (this repo's chosen tradeoff
between variety and authoring effort). Worked examples below are for a 70 kg
athlete against `nutrition.md`'s midpoint carb target for that day type, a
flat 1.6–1.8 g/kg protein target (endurance-athlete general guidance — needs
less day-to-day carb-style periodization), and a fat target that tapers as
carb need rises (roughly 1.0 g/kg on Rest down to 0.7 g/kg on Long) so the
three stay in balance without inventing a separate total-calorie estimate:
target kcal is simply 4×carb + 4×protein + 9×fat, never computed
independently.

Default eating pattern shown is 3 meals + 2 snacks
(`mealPattern: threeMealsPlusTwoSnacks`); see "Adjusting for meal pattern"
below for the other two `mealPattern` values.

### Rest

Target: 245 g carb · 112 g protein · 70 g fat (±10%: 220–270 / 101–123 /
63–77). No ride — no on-bike fueling slot.

| Slot | Contents | Carb | Protein | Fat |
|---|---|---|---|---|
| Breakfast | Oats 100 g + Greek yogurt 200 g + banana 1 | 104 g | 33.5 g | 12.5 g |
| AM snack | Mixed berries 150 g + almonds 30 g | 18 g | 8 g | 15 g |
| Lunch | Wholegrain bread 2 slices + chicken breast 150 g + side salad 150 g + olive oil 1 tbsp | 36 g | 45 g | 20 g |
| PM snack | Dried dates 30 g + peanut butter 1 tbsp | 27 g | 3.5 g | 8 g |
| Dinner | Rice 200 g + tofu 150 g + veg 150 g + olive oil 1 tsp | 54 g | 21 g | 13.5 g |
| **Total** | | **239 g** | **111 g** | **69 g** |

### Endurance (Z2)

Target: 385 g carb · 119 g protein · 63 g fat (±10%: 346–424 / 107–131 /
57–69). On-bike fueling applies once the ride passes ~90 min (30–60 g/h).

| Slot | Contents | Carb | Protein | Fat |
|---|---|---|---|---|
| Breakfast (pre-ride) | Oats 100 g + Greek yogurt 150 g + banana 1 | 102 g | 28.5 g | 11.25 g |
| On-bike (~2 h @ ~45 g/h) | 2 gels + a little drink mix | 90 g | 0 g | 0 g |
| Post-ride recovery | Whey 1 scoop + banana + dates 30 g | 71 g | 25 g | 2 g |
| Lunch | Wholegrain bread 3 slices + chicken breast 150 g + avocado ½ + side salad 150 g | 60 g | 51 g | 22 g |
| PM snack | Mixed berries 150 g + almonds 30 g | 18 g | 8 g | 15 g |
| Dinner | Rice 200 g + tofu 150 g + veg 150 g + olive oil 1 tbsp | 54 g | 21 g | 22.5 g |
| **Total** | | **395 g** | **133.5 g** | **72.75 g** |

Protein/fat land a little above the top of the ±10% band here — trim the
lunch avocado to a quarter portion (or drop the dinner oil to 1 tsp) if the
athlete's actual numbers need pulling back toward the middle of the range.

### Structured / key session

Target: 455 g carb · 126 g protein · 56 g fat (±10%: 410–500 / 113–139 /
50–62). On-bike fueling once the session passes ~75 min (60–90 g/h, timed
around the hard efforts).

| Slot | Contents | Carb | Protein | Fat |
|---|---|---|---|---|
| Breakfast (pre-ride) | Oats 100 g + banana 1 + honey 1 tbsp + Greek yogurt 100 g | 117 g | 23.5 g | 10 g |
| On-bike | 2 gels | 80 g | 0 g | 0 g |
| Post-ride recovery | Whey 1 scoop + banana + dates 30 g | 54 g | 25 g | 2 g |
| Lunch | Rice 200 g + wholegrain bread 2 slices + chicken breast 150 g + avocado ½ + veg 150 g | 90 g | 51 g | 21.5 g |
| PM snack | Mixed berries 150 g + almonds 30 g | 18 g | 8 g | 15 g |
| Dinner | Pasta 200 g + tofu 150 g + veg 150 g | 59 g | 24 g | 9 g |
| **Total** | | **418 g** | **131.5 g** | **57.5 g** |

### Long ride

Target: 525 g carb · 126 g protein · 49 g fat (±10%: 472–578 / 113–139 /
44–54). On-bike 80–120 g/h, building progressively across a block — worked
example below uses an already gut-trained ~80 g/h average over a 4 h ride.

| Slot | Contents | Carb | Protein | Fat |
|---|---|---|---|---|
| Breakfast (pre-ride) | Oats 100 g + banana 1 + honey 1 tbsp | 113 g | 13.5 g | 7.5 g |
| On-bike (~4 h @ ~80 g/h avg) | Gels/drink mix/rice cakes/dates, mixed to `fuelingPreference` | 325 g | 0 g | 0 g |
| Post-ride recovery | Whey 1 scoop + banana + dates 30 g | 54 g | 25 g | 2 g |
| Dinner | Rice 200 g + chicken breast 220 g + veg 150 g + olive oil 1 tbsp | 51 g | 55.3 g | 20.4 g |
| PM snack | Greek yogurt 200 g + mixed berries 150 g + avocado ½ | 29 g | 23 g | 20 g |
| **Total** | | **572 g** | **116.8 g** | **49.9 g** |

A long day's on-bike carb dominates the day's total — the other slots exist
mainly to hit protein/fat and round out pre-/post-ride carb, not to
independently hit a large share of the day's carb target themselves.

## Adjusting for meal pattern

- **`threeMealsPlusTwoSnacks`** (default, shown above): use the templates as-is.
- **`threeMealsNoSnacks`**: fold each snack's blocks into the nearest meal
  (AM snack into breakfast or lunch, PM snack into lunch or dinner) rather
  than dropping the macros — the day's total target is unchanged, only the
  number of eating occasions.
- **`grazing`**: split each meal's blocks into two smaller occasions spread
  across the day instead of three discrete meals — again, unchanged day
  total, just distributed across more, smaller occasions. On-bike and
  post-ride fueling slots stay fixed to the ride itself regardless of
  pattern, since they're timed to training, not to the athlete's general
  eating rhythm.

## Adjusting for cooking constraints

- **`cooksFreshMostDays`**: templates as written need no adjustment.
- **`batchPrep`**: favor blocks that hold well and reheat (rice, lentils,
  baked chicken/tofu, roasted veg) for lunch/dinner slots, prepared in a
  larger batch once and portioned across several days of the same day type
  in the week — say so plainly in the meals file (e.g. "Tuesday and
  Thursday's dinners are the same batch, cooked once").
- **`minimalTimeWeekdays`**: lean weekday slots toward no-cook or single-step
  items (Greek yogurt, wholegrain bread, pre-cooked rice pouches, canned
  lentils, a shake) and reserve any multi-step cooking (baked potato,
  from-scratch pasta sauce) for weekend days, regardless of day type.

## Logged-feedback rules

Two feedback routes both land here, since issue #45 shipped structured
per-item feedback alongside the original narrative question:

- **Narrative (phase 1, still live):** each week's narrative feedback
  question (`SKILL.md`'s weekly-availability intake, when `mealPlanEnabled`
  is true) is read the same way `fuelingNotes` is read: a hypothesis from
  the athlete's own account, not a lab result.
- **Structured (phase 2, issue #45):** a `meal_feedback` row against a
  specific `meal_recommendations` item — either the web UI's rating (1-5) +
  keep/change toggle + optional comment (`source: 'web-ui'`), or a
  `/nutrition-feedback` chat entry with a narrative comment and no numeric
  rating (`source: 'chat'`). `SKILL.md` Step 1 reads both back, latest row
  per item, no `source` filter — a `chat` row's comment is read exactly
  like the narrative question's answer; a `web-ui` row with `wants_changed:
  true` and no comment defaults to the `disliked` category below, stated
  plainly that no reason was given.

Either way, state the category inferred from what the athlete said
explicitly in the plan before applying the row below — never silently
reclassify a vague comment (or a bare `wants_changed` toggle) into one of
these categories without saying so.

| Inferred category | Adjustment at that item's next scheduled occurrence |
|---|---|
| `disliked` | Swap for a different block from the same category and the same `dietaryRestrictions` tags (e.g. a disliked oats breakfast swaps to the eggs-based option). Never repeat the disliked item unchanged. |
| `giDistress` | Swap out the flagged item the same as `disliked`, and treat it the same way `nutrition.md` treats a fueling-related GI report — steer away from it even before any further signal confirms it. If the flagged item was an on-bike fueling block, also note it in the plan's Fueling section, not just the meals file. |
| `tooTimeConsuming` | Swap for a lower-prep block from the same category (e.g. a from-scratch dinner swaps toward a `batchPrep`/`minimalTimeWeekdays`-style option per the constraints table above), regardless of the athlete's stated `cookingConstraints` — a specific complaint about one item overrides the general default for that item only. |
| `likedOrNoComplaint` | Repeat the item unchanged; no adjustment needed. |

Every resulting swap is stated explicitly in the meals file (e.g. "swapped
Wednesday's oatmeal breakfast for the eggs-based option — logged as disliked
last week"), never silently absorbed, per FR10.

## Energy-availability tie-in

When `nutrition.md`'s energy-availability caution applies
(`currentWeightGoalDirection: losing` or `bodyCompositionGoal:
significantLoss`), state plainly in the meals file where the deficit is
being taken from — per `nutrition.md`'s existing guidance to concentrate it
on lower-volume days — rather than trimming every day's meals evenly. In
practice: trim the Rest day's snack portions first (they carry the least
training-critical carb) before touching the Structured/Long day templates,
whose on-bike and post-ride slots stay at nutrition.md's full stated rate
regardless of the deficit.
