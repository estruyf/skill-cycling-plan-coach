---
description: Give detailed written feedback on a specific meal/snack from this week's meal plan (issue #45)
---

# /nutrition-feedback

The web dashboard's "This week's meals" section (`web/app/nutrition/page.tsx`)
already lets the athlete rate an item 1-5 and toggle keep/change with an
optional one-line comment. This command is for the opposite case: the
athlete wants to explain *why* something didn't work in their own words,
more than a rating widget invites — the same "detailed written prose
instead of filling in a web form" this command was scoped for.

Feedback given here lands in the same `meal_feedback` table
(`source: 'chat'`) the web UI writes to (`source: 'web-ui'`), so both feed
the same read-back in `SKILL.md` Step 1 and the same
`references/meal-library.md` Logged-feedback rules — there is no separate
interpretation path for a chat-sourced row.

**Argument:** `$ARGUMENTS` — the athlete's feedback, in their own words. If
empty, ask for it: "What would you like to tell the coach about this
week's meals?"

## Preconditions

1. Load `athlete.json` (next to this skill). If it's missing, or
   `mealPlanEnabled` is not `true`, say so plainly — there's no itemized
   meal plan to give per-item feedback on yet (`mealPlanEnabled` opts into
   it, per `references/onboarding.md` §10) — and stop.
2. If `supabaseAthleteId` is `null`, say plainly that per-item feedback
   needs a linked web account first (same one-time link `SKILL.md`'s Step 7
   describes) — until then, mention what didn't work as free text during
   the next weekly-availability intake instead, which still reaches
   `references/meal-library.md`'s Logged-feedback rules via the narrative
   route. Stop here.
3. If this session has no Supabase MCP connector attached to project
   `gurxzxcdxxxezwyatwlf` (`docs/infra.md`), say so plainly — this command
   needs a session with that connector, same constraint `SKILL.md` Step 7
   already has for its own writes — and stop rather than guessing at a
   write that can't happen.

## Steps

1. **Find this week's meal items.** Via `execute_sql`:
   ```sql
   select mr.id, mr.day, mr.slot, mr.description
   from meal_recommendations mr
   join plans p on p.id = mr.plan_id
   where mr.athlete_id = '<supabaseAthleteId>'
   order by p.week_start_date desc, mr.created_at asc
   limit 100;
   ```
   Scope to the most recent `week_start_date` present in the result (the
   current week's plan) — ignore older weeks' items even if the query
   returns them.

   If this returns no rows, say plainly that no itemized meal plan has been
   generated yet this week (Step 6 item 5 of `SKILL.md` produces one only
   once a "plan my week" run has happened with `mealPlanEnabled: true`) and
   stop.

2. **Match the feedback to one or more specific items.** Read `$ARGUMENTS`
   against the day/slot/description list from step 1. An athlete will
   often name a day and a rough description ("Tuesday's oat breakfast",
   "the recovery shake after the long ride") rather than the exact stored
   text — match on the closest reasonable item rather than requiring an
   exact string match.
   - **One clear match:** proceed to step 3 for that item.
   - **Several items plausibly meant** (e.g. the feedback could mean either
     of two snack slots): ask a short clarifying question listing the
     candidates rather than guessing which one.
   - **No plausible match at all** (the feedback is about the week's meals
     in general, not any one item — e.g. "I didn't have time to cook much
     this week"): don't force it onto one item. Say so, and suggest either
     picking the specific item that was hardest, or raising it as
     `cookingConstraints` feedback in the next weekly-availability intake
     instead, since that's the field it actually belongs to.
   - The feedback may name more than one item (e.g. praising one thing and
     flagging another) — handle each separately, repeating steps 3-4 per
     item.

3. **Infer the category**, the same way `references/meal-library.md`'s
   Logged-feedback rules table categorizes the weekly narrative question:
   `disliked`, `giDistress`, `tooTimeConsuming`, or `likedOrNoComplaint`.
   State the inferred category back to the athlete in one line before
   saving (e.g. "sounds like a GI-distress report on the on-bike gel —
   saving that") — never silently reclassify a vague comment, same
   principle `meal-library.md` already states for the narrative route.
   Set `wants_changed` to `false` only for `likedOrNoComplaint`; `true` for
   the other three categories.

4. **Insert the feedback row.** Via `execute_sql`:
   ```sql
   insert into meal_feedback (athlete_id, meal_recommendation_id, wants_changed, comment, source)
   values ('<supabaseAthleteId>', '<matched meal_recommendation.id>', <true|false>, '<feedback text for this item>', 'chat');
   ```
   Leave `rating` unset (`null`) — this command captures narrative detail,
   not a 1-5 score; the web UI's rating control is the only writer of a
   numeric rating. `comment` should be the athlete's own words for that
   specific item, not the full multi-item message when more than one item
   was addressed.

5. **Confirm.** State in one line what was recorded per item (e.g. "Logged:
   Tuesday's on-bike gel — GI distress, will swap next time it's
   scheduled"). This won't change anything about a plan already in hand —
   `SKILL.md` Step 1 reads it back and `meal-library.md`'s Logged-feedback
   rules apply the swap the next time that item is due, exactly the same
   as a web-ui rating would.
