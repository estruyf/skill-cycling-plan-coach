# Cycling Plan Coach — web UI

Bare-bones Next.js frontend for **B3**/**B4**/**B5**
(`documents/multi-event-and-webui-tasks.md`). Lists the current week's
workouts (as posted by the skill, see the "Sync to Supabase" step in
`SKILL.md`) and lets the athlete log each one with the five-way status
vocabulary, writing to `workout_logs`. `/nutrition` adds a daily nutrition
entry form (carbs, calories, hit/missed carb target, hydration note, body
weight, notes) plus a history view, writing to `nutrition_logs` — one row
per athlete per day, editing a day re-submits the same date. `/strength`
adds a strength-session entry form (session name, the five-way status,
repeatable exercise/sets/reps/load rows, notes) plus a history view,
writing to `strength_logs`.

This isn't a full product surface — routing stays limited to `/login`,
`/plan`, `/nutrition`, `/strength`, `/compliance`, and `/season` (styling
follows the design system in `documents/ui-redesign/`). Onboarding, plan
generation, and config changes stay chat-driven (Claude Code); this app is
only for viewing the current week and logging data day to day, per
`documents/multi-event-and-webui-plan.md`.

## Auth

Supabase Auth magic link (`signInWithOtp`). No password to manage. The first
time an athlete signs in, Supabase creates their `auth.users` row; that
user's `id` then needs to be linked as `supabaseAthleteId` in `athlete.json`
so the skill's Supabase sync step (writes to `plans`/`workouts`) uses a
matching `athletes.id` — see `docs/infra.md`.

## Local development

```
cp .env.example .env.local
npm install
npm run dev
```

## Deployment

Deployed via the `cycling-plan-coach` Vercel project (linked to this repo,
root directory `web`). `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
are set as Vercel project environment variables (values match `.env.example`
— the publishable/anon key is safe to expose client-side, per `docs/infra.md`).
