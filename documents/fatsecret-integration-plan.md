# FatSecret integration — architecture plan

Status: proposed, not yet implemented. Written against issue
[#42](https://github.com/macken04/skill-cycling-plan-coach-dm/issues/42)
after comparing Cronometer against alternatives and choosing FatSecret —
see `documents/cronometer-integration-plan.md` for why Cronometer (no
official API, no recipe support in any surveyed client) was ruled out.
This doc is the implementation target; the Cronometer doc stays only as a
record of the alternatives considered. Same role/format as
`documents/whoop-integration-plan.md` served for issue #39 — no separate
PRD file needed.

## Background / goal

The athlete wants a good-enough food database to actually find what they
ate, real recipe/meal support, and macro tracking that can be compared
against this app's own coaching process (fueling targets in
`references/nutrition.md`, logged training load) — without this repo
having to build and maintain a food database or a diary UI from scratch.

## Why FatSecret (recap of the comparison in issue #42)

| App | Official API? | Diary write? | Recipe/meal object? | Verdict |
|---|---|---|---|---|
| Cronometer | No — community forum confirms no public API program | Only via reverse-engineered clients | Not supported by any surveyed client | Ruled out (`cronometer-integration-plan.md`) |
| MyFitnessPal | Closed to new third parties years ago | N/A | N/A | Ruled out |
| Nutritionix | Yes, but enterprise-oriented, weak home-cooking coverage | Yes | Limited | Ruled out |
| Edamam | Yes | **No user diary concept at all** | Recipe analysis only | Ruled out |
| **FatSecret** | **Yes — documented Platform API, 3-legged OAuth** | **Yes** (`food_entry.create/edit/delete`) | **Yes** (`saved_meal.create`/`saved_meal_item.add` — see caveat below) | **Chosen** |

FatSecret's database covers 1.9M+ verified foods across 56 countries — in
the same league as Cronometer's/MyFitnessPal's for "can I find the food I
ate" — and, critically, it's the one mainstream option built specifically
for third parties to read/write on a user's behalf via OAuth, so this app
can genuinely close the loop (push targets, read logged intake back into
the coaching process) instead of just linking out to a black box.

## FatSecret Platform API — verified capabilities (this session's research)

- **Auth**: full 3-legged OAuth (OAuth 1.0a, OAuth 2.0 also supported) —
  the athlete authorizes this integration once; FatSecret issues a
  **revocable per-user access token**, never a stored password. This is a
  materially better trust story than every Cronometer option, which all
  required the athlete's actual account password as a plain credential.
- **Food diary** (Profile - Food Diary, 3-legged OAuth): `food_entry.create`,
  `food_entry.edit`, `food_entry.delete` — full read/write on a user's
  logged meals. Not gated to a paid tier.
- **Saved meals** (Profile - Saved Meals, 3-legged OAuth): `saved_meal.create`,
  `saved_meal.edit`, `saved_meal_item.add`, `saved_meal_item.edit`. This is
  FatSecret's closest equivalent to a "recipe" object — a reusable named
  group of foods/servings the athlete can log as one unit. **Caveat**:
  there is no separate `recipes.create` for a true user-authored recipe
  with instructions/steps — `recipes.search`/`recipes.get` only expose
  FatSecret's own curated recipe database read-only. "Saved meal" is good
  enough for pushing this app's own meal plans (a list of foods/servings
  per meal), but doesn't let the athlete publish a cook-along recipe with
  method steps the way Cronometer's in-app recipe builder does.
- **No macro/calorie-target-setting endpoint exists** in FatSecret's API
  at all (verified against their own docs — not merely undocumented).
  This app remains the source of truth for the athlete's fueling targets
  (`references/nutrition.md`); FatSecret only ever holds *actual* logged
  intake to compare against, exactly the same relationship
  `nutrition_logs`/`web/app/nutrition` already has with the plan's stated
  targets today.
- **Tiers**: Basic edition is free, 5,000 calls/day, **US-only food
  dataset**, requires visible FatSecret attribution — almost certainly
  sufficient for one athlete's personal use. Premier (quoted, not
  metered) adds the other 55 countries and removes the attribution
  requirement; only worth it if the athlete needs non-US food data or a
  white-labeled experience.

## Existing open-source connector

`fcoury/fatsecret-mcp` — a Claude-native MCP server already built against
this official API, same "athlete runs it themselves, zero code in this
repo" shape as the Strava precedent (`references/strava-pull.md`).
Verified this session:

- **Implemented**: `search_foods`/`get_food` (database search), `search_recipes`/
  `get_recipe` (read-only against FatSecret's curated recipes, not the
  athlete's own), `get_user_profile`, `get_user_food_entries` (diary
  read-back), `add_food_entry` (diary write). Ships its own OAuth
  onboarding tooling (`start_oauth_flow`/`complete_oauth_flow`/
  `set_credentials`, plus a CLI), so the athlete authorizes once and the
  per-user token persists locally (`~/.fatsecret-mcp-config.json`) —
  entirely outside this repo's trust boundary, same as Strava's tokens
  today.
- **Not implemented (gap in this specific project, not the platform)**:
  no `saved_meal.*` tools, so today it can log individual foods to the
  diary but can't push a whole meal plan as one reusable saved meal, and
  no diary edit/delete exposed either (create-only).

## Recommended approach

Same shape this repo already uses for Strava, and the shape we'd
recommended for Cronometer's "Option A" — a Claude-native MCP connector,
**zero backend code, schema, or credential footprint in this repo** —
except this time it rides an official API with real per-athlete OAuth
tokens instead of an unofficial protocol needing a stored password. This
is a strict upgrade over the Cronometer path on every axis that mattered
there (official support, token revocability, recipe/meal support,
ToS standing) except raw food-database size, which FatSecret is still
close enough on not to matter for "can I find what I ate."

### What this repo would need to change

1. New `references/fatsecret-data.md`, mirroring `references/strava-pull.md`:
   which MCP tool calls to use to (a) read back the athlete's recent
   FatSecret diary (`get_user_food_entries`) the same way `nutrition_logs`
   is read today, and (b) — once the saved-meal gap below is closed —
   push a day's/week's planned meals as a saved meal the athlete can log
   in one tap.
2. `SKILL.md` Step 1 — new paragraph alongside the existing
   `nutrition_logs`/Garmin/WHOOP reads: when a FatSecret connection is
   available, read back logged diary entries and fold the actual-vs-target
   comparison into the fueling guidance the same way `nutrition_logs`'
   `carb_target_status` is folded in today.
3. `SKILL.md` fueling-guidance step — offer to push the week's planned
   meals to FatSecret when asked; check for `saved_meal.*` tool
   availability first (see gap below) and gracefully fall back to
   `add_food_entry`-per-item, or to just stating the plan in markdown as
   today, when it's absent.
4. `references/onboarding.md` — one new optional question, same tier as
   Garmin/WHOOP/Strava: does the athlete want to connect FatSecret.
5. `README.md`'s "What it needs" list — one line once shipped.
6. **No changes** to `web/`, Supabase schema, or `athlete.json`/
   `references/athlete-config.md` — no token is ever held by this repo;
   it lives in the athlete's own MCP server config, identical to how
   Strava's connector already works. `web/app/nutrition/page.tsx` and
   `nutrition_logs` are unaffected and keep working for athletes who
   don't connect FatSecret.

### Closing the saved-meal (recipe-push) gap

`fcoury/fatsecret-mcp` is open source (MIT-style) and the four missing
calls (`saved_meal.create`, `saved_meal.edit`, `saved_meal_item.add`,
`saved_meal_item.edit`) are a small, scoped addition against an API the
project already authenticates against — not a new integration. Two
options, not mutually exclusive:

- Ship v1 without meal-plan push (diary logging + read-back already work
  end-to-end today) and treat saved-meal push as a fast-follow.
- Fork/PR the four missing tool calls into `fcoury/fatsecret-mcp` (or a
  maintained fork this repo's docs point to instead) before promising
  meal-plan push to the athlete.

## Non-goals

- Not pushing numeric macro/calorie targets into FatSecret — no such
  endpoint exists; this app stays the source of truth for targets, same
  as today.
- Not a true recipe-with-instructions object — "saved meal" (a list of
  foods/servings) is the closest available primitive.
- Not replacing `web/app/nutrition/page.tsx`/`nutrition_logs` — additive
  and optional, exactly like Strava/WHOOP.
- Not multi-provider nutrition-app abstraction.

## Resolved decisions (issue #42's open questions)

**1. V1 scope.** Diary-only. Ship read-back (`get_user_food_entries`) and
per-food logging (`add_food_entry`) as v1 — both already work end-to-end
today via `fcoury/fatsecret-mcp` as-is. One-tap meal-plan push
(`saved_meal.*`) is a fast-follow, not a blocker (see `F-D` in
`documents/fatsecret-integration-tasks.md`).

**2. Connector strategy.** Fork and extend `fcoury/fatsecret-mcp` ourselves
rather than wait on upstream, so the saved-meal fast-follow above has a
concrete timeline this project controls. This repo's docs
(`references/fatsecret-data.md`) point athletes at our fork, not upstream.

**3. API tier.** Free Basic tier (5,000 calls/day, US-only food dataset,
requires visible FatSecret attribution) is sufficient for one athlete's
personal use. Revisit only if the athlete later needs non-US food data or
a white-labeled experience — not required for v1.

## References

- `platform.fatsecret.com/docs/guides` — Platform API method reference
  (`food_entry.*`, `saved_meal.*`, `recipes.*` read surface, editions/pricing).
- `github.com/fcoury/fatsecret-mcp` — existing open-source Claude-native
  connector this plan builds on.
- `documents/cronometer-integration-plan.md` — the ruled-out alternative
  and the fuller comparison of options considered.
- `references/strava-pull.md` — the Claude-native-connector precedent this
  follows.
- `references/nutrition.md` — the fueling targets this integration reads
  actuals against.
- Issue [#42](https://github.com/macken04/skill-cycling-plan-coach-dm/issues/42).
