# Design tokens

Extracted from `mockups/*.html`. These are the exact values used in every
mockup — copy them verbatim into whichever styling approach
`implementation-notes.md` settles on (a `:root` block in `globals.css`, a
Tailwind theme config, etc.).

## Color

```css
:root {
  /* neutrals */
  --ink:          #1B1F22;  /* body text */
  --ink-soft:     #5B6368;  /* secondary text */
  --ink-faint:    #8A9095;  /* tertiary / labels / placeholders */
  --paper:        #FAF8F4;  /* page background */
  --surface:      #FFFFFF;  /* card background */
  --line:         #E4E0D6;  /* card borders, dividers */
  --line-soft:    #EEEBE3;  /* table row dividers, subtler than --line */

  /* brand — navigation, links, primary actions. Never used for status. */
  --brand:        #1D5C63;
  --brand-dark:   #12363B;  /* sidebar / login panel background */
  --brand-strong: #144247;  /* hover state, active text on tint */
  --brand-tint:   #E1EEEC;  /* active nav item, "current phase" highlight */

  /* accent — rare emphasis only (a key session, a highlighted CTA).
     Never a routine action or it stops meaning anything. */
  --accent:       #DD5B27;
  --accent-tint:  #FBE7DB;  /* badge background; pair with #9A3E15 text */

  /* status roles — fixed, semantic, mild -> severe order. Mirrors
     STATUS_ROLE / STATUS_ROLE_COLOR in web/lib/types.ts; these hex values
     are a refined, higher-contrast pass over the ones currently in that
     file (see "Reconciling with lib/types.ts" below). */
  --good:         #1F8A57;  --good-tint:     #E3F3EA;
  --warning:      #B9790A;  --warning-tint:  #FBF0D9;
  --serious:      #C2542E;  --serious-tint:  #FBE7DE;
  --critical:     #C22B2B;  --critical-tint: #FAE0E0;

  /* geometry */
  --radius-s: 8px;
  --radius-m: 12px;
  --radius-l: 20px;
  --shadow: 0 1px 2px rgba(20,24,26,.04), 0 8px 24px rgba(20,24,26,.06);
}
```

### Reconciling with `lib/types.ts`

`STATUS_ROLE_COLOR` currently in code:

```ts
good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b"
```

The mockups use a slightly deeper/desaturated version of the same four
hues (`--good #1F8A57`, `--warning #B9790A`, `--serious #C2542E`,
`--critical #C22B2B`) for two reasons: better text contrast when the color
is used as text/icon color (not just a fill), and less visual competition
with the new teal brand color and ember accent. **Decide when implementing**
whether to adopt the new values (update `STATUS_ROLE_COLOR`, one line each)
or keep the current ones and adjust the mockup values to match — either is
fine, they encode the same four-role semantics either way. Keep them as a
single source of truth in `lib/types.ts` regardless.

## Typography

Google Fonts, loaded in every mockup via:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
```

| Role | Font | Weight | Size range | Used for |
|---|---|---|---|---|
| Display / headings | Sora | 600–700 | 14–34px | page titles, section heads, big numbers |
| Body | Public Sans | 400–500 | 12–15px | everything else |
| Data / numerals | JetBrains Mono | 500–600 | 11–40px | watts, kg, dates, countdowns, table numerics — anything measured |

Next.js equivalent: replace the `Geist`/`Geist_Mono` `next/font/google`
imports in `web/app/layout.tsx` with `Sora`, `Public_Sans`, `JetBrains_Mono`.

## Core components (see `styleguide.html` for a rendered reference)

- **`.card`** — `background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius-m); box-shadow: var(--shadow);` — the base
  container for every content block. Never a heavier drop shadow; emphasis
  is a 1px `--brand` ring (`box-shadow: 0 0 0 1px var(--brand)`), not a
  bigger shadow or a colored border.
- **`.btn` / `.btn-primary` / `.btn-ghost` / `.btn-accent`** — one primary
  action per view; `btn-accent` reserved for the rare cases `--accent`
  itself is reserved for.
- **`.badge` / `.badge-good` / `.badge-warning` / `.badge-serious` /
  `.badge-critical` / `.badge-brand` / `.badge-accent`** — pill, tinted
  background + matching solid text color, never a solid fill (keeps them
  readable and lower-contrast than a button).
- **Sidebar nav item** — `.nav-item`, `.nav-item.active` — see
  `mockups/plan.html` for the full markup (icon + label, active state is a
  translucent white fill on the dark sidebar).
- **Mobile tab bar item** — `.tab`, `.tab.active` — see `mockups/mobile.html`.
- **Stat card** — `.stat` / `.stat-label` / `.stat-value` — label in
  small-caps-style uppercase `--ink-faint`, value in Sora or mono depending
  whether it's a number.
- **Form field** — `.field label` + `.input` — every input gets a real
  `<label>` (already true in the current code — keep it) styled
  consistently instead of relying on browser defaults.

Full exact markup for every component is in the mockup files — copy the
class names and structure directly rather than re-deriving them.
