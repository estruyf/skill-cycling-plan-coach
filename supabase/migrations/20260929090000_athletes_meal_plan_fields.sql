-- Issue #2: persist the meal-plan onboarding fields from athlete.json
-- (references/athlete-config.md: mealPlanEnabled, mealPattern,
-- cookingConstraints, foodPreferences) on `athletes`, so SKILL.md Step 8's
-- athletes upsert can include them.
--
-- `meal_plan_enabled` is nullable on purpose: athletes onboarded before the
-- field existed have it unset, and SKILL.md asks the opt-in question once to
-- backfill it rather than assuming a value. `meal_pattern` and
-- `cooking_constraints` are null whenever `meal_plan_enabled` is false/unset.

alter table athletes
  add column meal_plan_enabled boolean,
  add column meal_pattern text
    check (meal_pattern in ('threeMealsPlusTwoSnacks', 'threeMealsNoSnacks', 'grazing')),
  add column cooking_constraints text
    check (cooking_constraints in ('cooksFreshMostDays', 'batchPrep', 'minimalTimeWeekdays')),
  add column food_preferences text not null default '';
