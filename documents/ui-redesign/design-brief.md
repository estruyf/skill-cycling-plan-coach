# Cycling Plan Coach — web UI redesign brief

Audit of the shipped web UI (`web/app/*`) plus a full redesign proposal.
Written after Milestones A/B (onboarding, plan/nutrition/strength logging,
compliance/trend views, season plan) were functionally complete but the UI
itself had never had a design pass — see `web/README.md`: "intentionally not
a product — no styling system."

## 1. What's wrong with the current UI

**No design system.** Every page (`login`, `plan`, `nutrition`, `strength`,
`compliance`, `season`) hand-writes its own inline `style={{...}}` objects.
Buttons, `<select>`s and text inputs are unstyled native browser controls —
inconsistent across browsers, no visual identity. Font is a bare Arial
fallback (`font-family: Arial, Helvetica, sans-serif` in `globals.css`).

**Navigation is copy-pasted per page and has already drifted.** Each page
re-implements its own `<header><nav>` with a hardcoded list of `<Link>`s.
They don't agree with each other:
- `plan/page.tsx` links to Season/Nutrition/Strength/Compliance, not itself.
- `season/page.tsx` only links back to `/plan` — no way to reach
  Nutrition/Strength/Compliance from the season view.
- No page marks itself as the "active" nav item, so there's no way to tell
  which screen you're on from the chrome alone.

**The header nav has no responsive story.** It's a `flex` row with
`justify-content: space-between` holding five or six text links plus a
sign-out button. Under ~600px it just wraps onto multiple ragged lines above
the page content — there's no mobile navigation pattern at all, just
`max-width` on the `<main>`.

**Status color is reinvented per page instead of shared.** `lib/types.ts`
already defines a real semantic system for this — `STATUS_ROLE`,
`STATUS_ROLE_COLOR`, `STATUS_ROLE_LABELS` (four roles: good / warning /
serious / critical, deliberately ordered mild → severe, used correctly on
`compliance/page.tsx`). But `plan/page.tsx`, `nutrition/page.tsx` and
`strength/page.tsx` don't use it — they hardcode their own one-off green/red
(`#2a7d2a`, `#b00020`) for what is conceptually the same status vocabulary.
The same outcome (e.g. "failed, too hard") reads as a different color
depending which page shows it.

**No visual hierarchy for what actually matters.** The event countdown, the
current phase, today's workout, a flagged "key session," the taper/race-week
banner — all real, high-signal data from the schema — render as the same
plain 1px-bordered `<div>` as everything else on the page. Nothing tells the
athlete where to look first when they open the app.

**Compliance duplicates its own data.** Every section (`By bike archetype`,
`By strength session`, `Trend by week`) renders the *same* counts twice: once
as a stacked bar, then again as a full `<table>` directly underneath. It's
redundant and makes an already data-dense page busier than it needs to be.

**Loading/empty/error states look broken, not idle.** They're bare
unstyled text — `"Loading..."`, `"Something went wrong: ..."`, `"No plan has
been generated yet..."` — with no card, no icon, no visual weight. The app
looks like it crashed rather than like it's waiting on a fetch.

**Login has no product identity.** A centered, unbranded form with one line
of copy. Nothing signals this is the same coaching product with real
season/event context — it could be any bare Supabase auth demo.

## 2. Redesign direction

Full interactive mockups are in `mockups/*.html` (open in a browser) and the
extracted tokens/components are in `design-tokens.md`. Summary of the
approach:

### Design system

- **Color:** warm neutral ground (`--paper #FAF8F4`, `--surface #FFFFFF`)
  instead of stark white, so long reading sessions (a full week's plan, a
  season table) don't glare. Brand color is a deep teal (`--brand #1D5C63`)
  used for the sidebar, primary actions and links — deliberately **not** in
  the status vocabulary, so "is this good or bad" is never ambiguous with
  "is this a link or button." An ember accent (`--accent #DD5B27`) is
  reserved for rare emphasis only (a key session, a highlighted CTA) —
  never a routine action, or it stops meaning anything.
- **Status color is the existing four-role system, finally applied
  everywhere** (`good` / `warning` / `serious` / `critical`, same order,
  same intent as `lib/types.ts` — see `design-tokens.md` for the exact hex
  values used in the mockups, chosen for ≥4.5:1 contrast on white and to
  stay visually distinct from the teal/ember brand colors).
- **Type:** Sora (headings, big numbers) / Public Sans (body) / JetBrains
  Mono (every measured value — watts, kg, dates, countdowns — so data reads
  as data, distinct from prose).

### Navigation

- **Desktop (≥960px):** a persistent 248px sidebar replaces the per-page
  header — brand mark, five destinations with icons, an active-state
  highlight, athlete identity + sign-out anchored at the bottom. One
  component, used identically on every page, so it can't drift again.
- **Mobile (<960px):** the sidebar collapses into a fixed bottom tab bar
  (Today / Season / Fuel / Strength / Trends) — thumb-reachable, always
  visible, no header overflow. See `mockups/mobile.html`.

### Per-screen changes

- **Plan (`plan.html`):** event countdown + phase as a hero card; the
  current day's workout visually distinguished (accent border) from the
  rest of the week; a "key session" badge for flagged workouts; coach notes
  as a distinct, lower-emphasis section.
- **Season (`season.html`):** the plain phase table becomes a horizontal
  timeline with a "you are here" marker; the trial-event ladder becomes a
  rung-by-rung card list (spec chips: distance, elevation, loaded-bike,
  terrain fidelity) instead of a dense table row.
- **Nutrition (`nutrition.html`) / Strength (`strength.html`):** a stats
  row (7-day avg carbs, target hit rate, latest weight) above a cleaner
  logging form; history as a table (nutrition) or tag-based session cards
  (strength) instead of bullet lists.
- **Compliance (`compliance.html`):** drop the redundant table — keep the
  stacked bar with a one-line count breakdown underneath; legend rendered
  as badges instead of raw colored squares.
- **Login (`login.html`):** branded split screen — product context (event
  countdown, season length, ladder size) on one side, the magic-link form
  on the other, with a line clarifying this account is for viewing/logging
  only (onboarding and plan changes still happen in chat).

### What this is *not*

No data-model change, no new routes, no new features — this is a visual and
interaction redesign of the six routes that already exist. Sample data in
the mockups is invented but shaped to the real types in `web/lib/types.ts`.

## 3. Open decision before implementing

The app currently has **zero CSS dependencies** (`web/package.json`: just
`next`, `react`, `@supabase/supabase-js`). Bringing in this design system
means picking one of:

1. **Hand-rolled CSS** — a `globals.css` (or CSS Modules) with the tokens in
   `design-tokens.md` as CSS custom properties, plus component classes
   (`.card`, `.btn`, `.badge`, etc.) matching the mockups almost exactly —
   zero new dependencies.
2. **Tailwind CSS** — faster to iterate in, standard in the Next.js
   ecosystem, but a new dependency and a bigger diff on a codebase that has
   deliberately avoided one so far.

See `implementation-notes.md` for the fuller tradeoff and a suggested
default. This should be confirmed with the athlete/maintainer before
writing implementation code.
