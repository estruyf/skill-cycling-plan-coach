# Implementation notes

How to turn `mockups/*.html` into real changes in `web/app/*`. Written so a
fresh session can start coding without re-deriving the plan.

## 0. Confirm the styling approach first

`web/package.json` currently has no CSS dependency at all. Pick one before
writing component code — don't default silently, ask the user if it isn't
already decided when this is picked up:

- **Hand-rolled CSS (recommended default if no preference is stated).**
  Add the tokens from `design-tokens.md` as a `:root` block in
  `web/app/globals.css`, plus the component classes (`.card`, `.btn`,
  `.badge`, `.nav-item`, etc.) as plain CSS in the same file or split into
  a `web/app/components.css`. Zero new dependencies, smallest diff,
  consistent with the project's existing minimalism — it just finally
  *has* a system instead of none.
- **Tailwind CSS.** Faster iteration, but a new dependency
  (`tailwindcss`, `postcss`, config files) on a codebase that has
  deliberately stayed dependency-light. Only worth it if there's an
  appetite for a bigger refactor than "restyle the existing six pages."

Either way, the actual visual result should match the mockups — this
decision only affects *how* the CSS is authored, not the design itself.

## 1. Shared components to extract first

Every page currently duplicates its own header/nav and its own `Centered`
helper. Before touching individual pages, pull out:

- **`<AppShell>`** (or `<Sidebar>` + layout) — the branded sidebar for
  desktop, collapsing to the bottom tab bar under 960px. This alone fixes
  the nav-drift bug (each page hardcoding a different link set) since
  every page renders the same component with an `active` prop instead of
  writing its own `<nav>`.
- **`<StatusBadge status={SessessionStatus} />`** — wraps
  `STATUS_ROLE` / `STATUS_ROLE_COLOR` / `STATUS_ROLE_LABELS` from
  `lib/types.ts` into the `.badge-*` classes. Replaces the ad hoc
  `#2a7d2a` / `#b00020` inline colors in `plan/page.tsx`,
  `nutrition/page.tsx`, and `strength/page.tsx` — this is the fix for the
  "same outcome, different color per page" issue called out in the brief.
- **`<Card>`, `<Stat>`, `<Button>` (primary/ghost/accent)** — thin
  wrappers if useful, or just shared CSS classes applied directly — either
  is fine, the mockups don't require a heavy component library.
- **`<Centered>`** already exists per-page (identical implementation
  copy-pasted 5 times) — move it to a shared location as part of this pass
  regardless of the styling approach; it's pure duplication today.

## 2. Suggested page order

Do `plan/page.tsx` first — it's the entry point after login and exercises
the sidebar, the status badge, and the "today" card treatment that other
pages reuse. Then:

1. `plan/page.tsx` — sidebar/shell, event countdown hero, workout rows,
   today/key-session treatment, coach notes section.
2. `login/page.tsx` — split-screen branding; independent of the shell
   (no sidebar, not signed in yet), good second target since it's
   self-contained.
3. `nutrition/page.tsx` and `strength/page.tsx` — same shell, stats row,
   redesigned forms; do together since they share the most structure.
4. `compliance/page.tsx` — shell + status badges/legend + drop the
   redundant table (keep the bar + one-line breakdown, per the brief).
5. `season/page.tsx` — shell + phase timeline + trial-event ladder cards;
   last because the timeline is the most bespoke piece of markup.

## 3. Responsive behavior

Only `mockups/mobile.html` shows the small-viewport version explicitly
(390px, bottom tab bar). The desktop mockups are fixed at 1440px for the
canvas tool that produced them — when implementing, the sidebar/shell needs
an actual breakpoint (suggested: 960px, matching the brief) where it
switches from the persistent sidebar to the fixed bottom tab bar, not just
a shrink. Test at common widths (375, 768, 1024, 1440) since none of the
current pages have ever been checked on anything but a full-width desktop
viewport.

## 4. Loading / empty / error states

The brief calls out that these currently render as bare text. When
rewriting each page, give the `loading` / `no-session` / `no-plan` /
`error` branches the same `<Card>` treatment as real content (a centered
card on the `--paper` background, not raw `<p>` tags) — there's no mockup
screen dedicated to these states, but the pattern is: reuse the shell's
centered-content layout with a `.card` wrapping the message.

## 5. Verifying the result

Per this project's own working norms: after implementing each page, run
the dev server (`cd web && npm run dev`) and check it in an actual browser
against the corresponding mockup — don't rely on type-checking/lint alone
to confirm it "looks right." Compare side by side with
`mockups/<page>.html` open in another tab.
