# Web UI redesign — briefing folder

Status: **implemented.** `web/app/*` now uses the design system, sidebar/tab-bar
shell and per-screen layouts described below (Tailwind CSS, per the styling
decision in `implementation-notes.md`). This folder is kept as the design
record — the mockups are still the visual reference if the UI needs further
work, and the audit in `design-brief.md` documents why the change was made.

## Start here

1. Read `design-brief.md` — the audit of the current UI (why it's unusable)
   and the redesign direction (design system, navigation pattern, per-screen
   changes).
2. Open `mockups/*.html` directly in a browser (or serve the folder — see
   below) — these are the actual proposed screens, fully clickable. They're
   standalone static files with all CSS inlined; no build step needed.
3. Read `implementation-notes.md` — the concrete plan for turning these
   mockups into the real Next.js app: component breakdown, page-by-page
   order, and the one open decision (styling approach) that needs a call
   before writing code.

## What's in this folder

```
documents/ui-redesign/
├── README.md                  — this file
├── design-brief.md            — full UI audit + redesign rationale
├── design-tokens.md           — colors, type, spacing as a copy-pasteable reference
├── implementation-notes.md    — how to build this into web/app, in what order
└── mockups/                   — the actual proposed screens (open in any browser)
    ├── plan.html              — "This week's plan" (the hub) — desktop
    ├── season.html            — Season plan
    ├── nutrition.html         — Nutrition log
    ├── strength.html          — Strength log
    ├── compliance.html        — Compliance & trends
    ├── login.html             — Sign in
    ├── mobile.html            — "This week's plan" — mobile (390px), shows
    │                             the bottom-tab-bar pattern replacing the
    │                             sidebar under ~960px
    └── styleguide.html        — design system reference sheet (color,
                                  type, buttons, badges, form fields,
                                  navigation rationale)
```

The sidebar nav in `plan.html`/`season.html`/etc. and the tab bar in
`mobile.html` are real `<a href>` links between these files, so you can
click through the whole flow. Open `mockups/plan.html` first — that's the
entry point — or run a static server from this folder:

```
cd documents/ui-redesign/mockups && python3 -m http.server 8080
```

then visit `http://localhost:8080/plan.html`.

## Where this data/content came from

The sample data in the mockups (rider type, FTP, phase, event countdown,
trial-event ladder, nutrition/strength history, compliance counts) is
invented but shaped to match the real schema in `web/lib/types.ts` and the
current pages in `web/app/*/page.tsx` — nothing here implies a data-model
change. The mockups are a visual/interaction redesign of the *existing*
six routes (`/login`, `/plan`, `/nutrition`, `/strength`, `/compliance`,
`/season`), not a new feature set.

## Origin

This folder mirrors an interactive prototype built earlier in a canvas
Artifact (claude.ai) during the review session that produced this brief.
That artifact is private to the user who ran that session and isn't a
dependency for this work — everything needed to implement the redesign is
in this folder.
