# Cronometer integration — architecture plan

Status: proposed, not yet implemented. Written against issue
[#42](https://github.com/macken04/skill-cycling-plan-coach-dm/issues/42) to
resolve its central open question — Cronometer has no official API, unlike
Strava/Garmin/WHOOP — before any implementation task breakdown is written,
same role `whoop-integration-plan.md` serves for issue #39. No separate PRD
file is needed; this doc + a future tasks doc (once an option below is
chosen) would follow the same pattern.

## Background / goal

Let the athlete build/maintain recipes in Cronometer, have this app push the
week's fueling targets (calories, carbs/protein/fat, the day-type-scaled
g/kg table in `references/nutrition.md`) into Cronometer, and do day-to-day
calorie/macro logging there as the system of record — with results read
back into the coaching loop the same way `nutrition_logs` is today.

## The central fact that shapes every option below

**Cronometer does not have a public developer API or an OAuth program.**
Confirmed via Cronometer's own community forum: they've stated repeatedly
that no public API exists and given no timeline for one. This is
structurally different from every other connector this repo has:

| Connector | Auth model | Where it lives |
|---|---|---|
| Strava | Official OAuth | Entirely inside the athlete's own Claude runtime — no code, no token, nothing in this repo (`references/strava-pull.md`) |
| WHOOP | Official OAuth 2.0 | This repo owns it — Vault-encrypted tokens, Next.js route handlers (`web/app/api/whoop/*`), per `documents/whoop-integration-plan.md` |
| Garmin | No API used at all | Athlete pastes a manual JSON export in chat |
| **Cronometer** | **No official program of any kind** | Only unofficial/reverse-engineered options exist (below) |

Everything that talks to Cronometer programmatically today does so by
reverse-engineering one of Cronometer's two private protocols:

- The **web app's GWT-RPC protocol** (what cronometer.com's own frontend
  uses) — brittle wire format, but the more feature-complete surface once
  reversed.
- The **mobile app's internal REST API** (what the Android/iOS apps use) —
  cleaner JSON, reverse-engineered via static analysis of the app binary
  plus traffic interception (Frida/mitmproxy).

Both are "use at your own risk": Cronometer can change either one on any
app release with no notice or deprecation window, and doing so likely sits
outside Cronometer's terms of service for automated access. Every
open-source project built on either protocol says as much in its own
README.

## Survey of existing open-source options (this session's research)

No native/first-party Claude↔Cronometer integration exists — Anthropic
does not ship one. Multiple independent open-source **MCP servers**
wrapping one of the two unofficial protocols do exist, e.g.:

- `cphoskins/cronometer-mcp` — wraps the web GWT-RPC protocol. Needs a
  Cronometer **Gold** account. Tool surface (verified this session):
  read (food log, macro/micro totals, daily summaries, food-DB search,
  biometrics, fasting history, existing macro targets/templates) **and**
  write — `add_food_entry`, `remove_food_entry`, `copy_day`,
  `set_day_complete`, `set_macro_targets`, `create_macro_template`,
  `set_weekly_macro_schedule`. No recipe tools.
- `lukedemi/cronometer-api-mcp` (and near-identical forks —
  `jacobpunchdrunk/…`, `rwestergren/…`) — wraps the mobile REST API
  instead, reverse-engineered via static analysis of `libapp.so` plus
  traffic interception. Tool surface: `add_food_entry`,
  `remove_food_entry`, `add_custom_food`, exercise CRUD, `copy_day`,
  `mark_day_complete`, plus the same read surface as above. Only exposes
  *viewing* macro targets, not setting them (per this session's reading of
  its docs) — a real capability gap versus the GWT-based server above.
- `Pop101/Cronometer-MCP` — claims to work with a free-tier Cronometer
  account (unverified this session; the other two require Gold).
- Older, read/export-only, pre-MCP clients: `jrmycanady/gocronometer`
  (Go, CSV export only), `six-pebbles/Cronometer-API` (Python, pulls into
  SQLite). Superseded for this use case by the MCP servers above, which
  add write support the older clients never had.

**Both auth models found require credentials, not a revocable OAuth
token**: `CRONOMETER_USERNAME`/`CRONOMETER_PASSWORD` as plain environment
variables read by the MCP server process. There is no token to scope or
revoke — disconnecting means deleting the stored password and rotating it
in Cronometer if the athlete no longer trusts wherever it was held.

**No candidate exposes recipe creation or management.** The athlete's
"build recipes there" ask doesn't map onto any tool this research found —
Cronometer's Recipe object isn't part of either reverse-engineered surface
these servers cover. This is a hard gap, not a phasing choice — flag it to
the athlete rather than promising it.

## Options considered

### Option A (recommended for v1): Claude-native MCP connector, following the Strava precedent

The athlete installs and runs one of the open-source MCP servers above
themselves (their own Claude client/config, their own
`CRONOMETER_USERNAME`/`PASSWORD`), and this repo's skill just learns to use
its tool calls when present — exactly how Strava already works: "entirely
as a Claude-native connector... no Strava OAuth code in this repo, no
token table" (`documents/whoop-integration-plan.md`'s own description of
the Strava precedent).

**What this repo would need to change** (all documentation/prompt-level,
no schema, no backend):

1. New `references/cronometer-data.md`, mirroring `references/strava-pull.md`'s
   structure: which tool calls to use for reading today's/this week's
   Cronometer diary and macro targets, and how to map `references/nutrition.md`'s
   day-type g/kg table onto `set_macro_targets`/`create_macro_template`/
   `set_weekly_macro_schedule` calls (only available on the GWT-based
   server — see the capability gap above) when the athlete asks to push a
   week's targets.
2. `SKILL.md` — a new paragraph in Step 1 (read back logged Cronometer data
   the same way `nutrition_logs`/Garmin/WHOOP already are, when the tool
   calls are available) and a note in the fueling-guidance step (offer to
   push the week's targets to Cronometer; **check whether the write tools
   exist before promising it** — the mobile-API-based servers are read/log
   -only for targets — and gracefully fall back to today's plain-markdown
   fueling section when they don't).
3. `references/onboarding.md` — one new optional question, same tier as
   the existing Garmin/WHOOP asks: does the athlete use Cronometer and want
   it used as a nutrition source/target destination.
4. `README.md`'s "What it needs" list — one line noting Cronometer as an
   optional connector alongside Strava/Garmin/WHOOP once shipped.
5. **No changes needed** to `web/`, the Supabase schema, or
   `athlete.json`/`references/athlete-config.md` — there is no token to
   store because there is no token; credentials live only in the MCP
   server process the athlete runs, entirely outside this repo's trust
   boundary. `web/app/nutrition/page.tsx` and `nutrition_logs` are
   unaffected and keep working for athletes who don't opt in.

**Caveats to state plainly to the athlete before they opt in**: this is
unofficial/best-effort tooling with no SLA, it can break silently on any
Cronometer app update, it requires handing a Cronometer server-adjacent
account's real password to a third-party open-source project (not
Anthropic, not this repo's maintainer), and recipe push isn't available.

### Option B: build an in-repo integration mirroring WHOOP's OAuth/Vault architecture

Re-implement one of the reverse-engineered protocols ourselves in
TypeScript inside `web/app/api/cronometer/*`, storing the athlete's actual
Cronometer username/password in Supabase Vault (same mechanism as WHOOP's
tokens) in place of an OAuth token, since there's no OAuth to exchange.

- **Pros**: fits this repo's existing "sync route + Supabase" shape
  exactly; the athlete never has to install/host anything themselves.
- **Cons**: this repo would directly own reverse-engineering breakage
  risk instead of an external project absorbing it; storing a live,
  non-revocable password is a strictly worse security posture than the
  WHOOP token-vault pattern (a compromised Vault secret here is the
  athlete's actual Cronometer login, not a scoped, revocable token); no
  better ToS footing than Option A, just more of our own code directly
  exposed to it and directly on the hook to fix when it breaks.
- **Recommendation**: don't build this for v1. Revisit only if Option A's
  "athlete runs their own MCP server" UX proves to be a real adoption
  blocker in practice.

### Option C: passive/manual CSV bridge

Cronometer supports CSV export (diary, biometrics) and limited import.
This app could generate a CSV of the week's per-day targets in whatever
shape Cronometer's importer accepts and hand it to the athlete to import
by hand, or accept a pasted/uploaded Cronometer export back — the same
manual pattern `references/garmin-data.md` already uses for Garmin's JSON
export.

- **Pros**: lowest engineering and ToS risk of all three — no scripted
  login, no stored credential of any kind.
- **Cons**: weakest fit for "weekly meals pushed" — it's copy/paste on
  both sides, not a sync. Reasonable fallback for an athlete unwilling to
  hand any Cronometer credential to automation, not a v1 default.

## Recommendation

Ship **Option A**. It costs this repo nothing beyond documentation (no
schema, no Vercel/Supabase secret, no new attack surface here), matches
the trust boundary Strava already established, and is fully optional and
additive — an athlete who skips it sees zero behavior change, same as
WHOOP/Strava today. Tell the athlete plainly, before they opt in, about
the no-official-API caveat, the credential-handling model, and the
recipe-push gap. Treat Option B as a possible future escalation only if
Option A's self-hosted-connector UX turns out to be a real blocker, and
keep Option C in reserve for an athlete who wants zero automated
credential handling at all.

## Non-goals

- Not replacing `web/app/nutrition/page.tsx`/`nutrition_logs` — Cronometer
  is an additional, optional source/destination, not a replacement.
- Not an "officially supported" integration — there is no official program
  to be official against; every option here is best-effort against a
  private API that can change without notice.
- Not recipe creation/sync in v1 — no surveyed tool supports it.
- Not multi-provider nutrition-app abstraction — build Cronometer
  concretely first, same posture `whoop-integration-plan.md` took for
  wearables.

## Open questions

1. Is asking the athlete to install/host their own MCP server (with its
   own `CRONOMETER_USERNAME`/`PASSWORD`) acceptable UX, or does the
   convenience of Option B's fully-hosted flow outweigh its materially
   worse credential-security story for this specific athlete?
2. Which candidate server should `references/cronometer-data.md` document
   against — `cphoskins/cronometer-mcp` (GWT-based, has the
   macro-target-write tools the "push weekly targets" ask actually needs)
   vs. `lukedemi/cronometer-api-mcp` (mobile-API-based, cleaner payloads,
   but missing target-writing) vs. others? Needs a hands-on trial of at
   least the leading candidate before committing docs to it, and a
   plan for what happens when whichever one is chosen goes stale or is
   abandoned upstream.
3. Is losing recipe-push acceptable given the "build recipes there" part
   of the original ask, or does that gap alone make this not worth doing
   until/unless Cronometer ships an official API?

## References

- Cronometer community forum — "Does Cronometer offer an API for third
  party applications to retrieve user data from?" (no official API,
  confirmed by Cronometer staff).
- `github.com/cphoskins/cronometer-mcp`, `github.com/lukedemi/cronometer-api-mcp`,
  `github.com/Pop101/Cronometer-MCP` — candidate open-source MCP servers
  surveyed this session.
- `github.com/jrmycanady/gocronometer`, `github.com/six-pebbles/Cronometer-API`
  — older read/export-only unofficial clients, superseded for this use case.
- `references/strava-pull.md` — the Claude-native-connector precedent
  Option A follows.
- `documents/whoop-integration-plan.md` — the OAuth+Vault precedent
  Option B would follow if ever pursued, and the source of the "no
  scheduled job/timer" architectural constraint that any Cronometer sync
  would also need to respect if it ever gained a server-side component.
- `references/nutrition.md` — the fueling targets this integration would
  read/push.
- Issue [#42](https://github.com/macken04/skill-cycling-plan-coach-dm/issues/42).
