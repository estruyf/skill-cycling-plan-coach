# FatSecret integration — reading and using the data

Optional per-athlete connector for actual-vs-target fueling comparison.
Athletes who want a real food database and diary can connect FatSecret
from their own Claude client — this is a Claude-native MCP connector, the
same shape as `references/strava-pull.md`: **no OAuth code, no token
table, nothing in this repo at all** beyond this reference doc describing
which tool calls to make. See `documents/fatsecret-integration-plan.md`
for the full architecture and `documents/fatsecret-integration-tasks.md`
for the task breakdown this doc is part of (`FA2`).

## Setup (once, per athlete, entirely outside this repo)

The athlete (or whoever maintains their Claude setup) registers a free
FatSecret Platform API application and runs this project's fork of
`fcoury/fatsecret-mcp`'s own OAuth onboarding tooling locally, once. The
resulting per-user access token persists in the athlete's own
`~/.fatsecret-mcp-config.json` — entirely outside this repo's trust
boundary, identical to how Strava's connector already works. **No token,
secret, or credential of any kind is ever stored in this repo, Supabase,
or Vercel.** Manual setup steps are tracked as `FA1` in
`documents/fatsecret-integration-tasks.md`; until that's done for a given
athlete, none of this doc applies and behavior is unchanged.

## Tools

1. `search_foods` / `get_food` — database lookup, mainly useful when
   logging on the athlete's behalf (below).
2. `get_user_food_entries` — the athlete's own FatSecret food diary for a
   date range. Use this to read back what was actually logged.
3. `add_food_entry` — log a food item to the athlete's diary. Only call
   this when the athlete asks to log something through the conversation;
   never log on their behalf unprompted.

`saved_meal.*` (pushing a whole day's/week's planned meals as one
reusable saved meal) is **not available yet** — deferred fast-follow
`FD1`/`FD2`. Don't offer one-tap meal-plan push until that lands; today,
logging is per-food only.

## Reading back the diary vs. this run's targets

When the connector is available, call `get_user_food_entries` for the
last 1-2 days (or the window the athlete asks about) and sum `carbs`
(and `calories`, if useful context) per day. Compare the total against
that day's carb target from `references/nutrition.md`'s day-type table
(Rest/Endurance/Structured/Long) for whichever day type it actually was.
State the comparison in one plain sentence, the same register
`nutrition_logs`' `carb_target_status` read-back already uses — e.g. "Your
FatSecret diary shows ~340 g carbs logged yesterday against a 420 g
target for that structured session — a bit under." If a day has no
FatSecret entries at all, say so rather than treating it as a zero-carb
day (the athlete may simply not have logged that day).

This app remains the source of truth for the *target* side of that
comparison — FatSecret has no macro/calorie-target-setting endpoint at
all (verified against its own API docs), so nothing here ever writes a
target into FatSecret. FatSecret only ever supplies the *actual* side,
exactly the same relationship `nutrition_logs`/`web/app/nutrition`
already has with the plan's stated targets today.

## Logging an item

If the athlete asks to log something ("log a banana and a gel"), resolve
it via `search_foods`/`get_food` to a specific FatSecret food/serving, and
call `add_food_entry` for today (or the date they specify). Confirm what
was logged in one line.

## When the connector isn't available

If `get_user_food_entries`/`add_food_entry` aren't available (not
configured this session) or a call fails, skip this section silently and
continue — behavior is then unchanged from today, the same as an
unconnected Strava. Never block or delay the rest of the run on a
FatSecret call.

## Worked example

Sample `get_user_food_entries` result for yesterday (a Structured day):
three entries totalling 385 g carbs, 2,150 kcal. `nutrition.md`'s
Structured-day target for this athlete (70 kg) is 420-490 g carbs.

Tracing the rule above: 385 g falls just under the 420 g floor of the
Structured range → state it as "logged ~385 g carbs yesterday against a
420-490 g target for that structured session — a touch under; worth an
extra carb-dense snack on the next one." A day with zero FatSecret
entries would instead read "no FatSecret entries logged for yesterday" —
never silently rendered as "0 g logged."
