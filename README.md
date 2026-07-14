# Mallard Bay ARC — Web App

First-pass implementation of the Architectural Request Center described in
[REQUIREMENTS.md](../REQUIREMENTS.md) and [DESIGN.md](../DESIGN.md). This is a
working, clickable vertical slice — not the final architecture. Read this
file before assuming anything is production-ready.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. No environment variables or accounts are
required to try the full flow — see "What's stubbed" below.

## What's real

- **Data model** (`src/lib/domain/types.ts`) — mirrors DESIGN.md's schema.
- **All 5 category rule engines** (`src/lib/domain/{fence,home-alteration,detached-structure,landscape,solar}.ts`),
  each with an adaptive question tree and flag evaluation against the actual
  HOA Rules/CCRs and Saratoga Springs City Code figures researched in
  REQUIREMENTS.md §4/§6a (fence height/setbacks, R1-10 zone setbacks for
  additions and accessory structures, satellite dish restrictions,
  new-construction landscaping deadlines, solar permit requirements). A
  shared registry (`src/lib/domain/registry.ts`) and branching helper
  (`src/lib/domain/question-tree.ts`) mean adding category #6 is a matter of
  writing one new file and a one-line registry entry, not touching every
  page that renders a questionnaire.
- **Workflow logic** (`src/lib/data/requests.ts`) — status transitions,
  14-day SLA / 28-day failsafe / 90-day approval-expiry date math, the
  2-matching-votes rule (symmetric for approve and deny, with citations/
  conditions aggregated across every matching vote so one board member's
  input can't be silently dropped by another's), the conflict-of-interest
  check (a board member can't vote on their own address), and the Utah HB
  217 citation requirement on denials.
- **Every page in the sitemap**, for all 5 categories: start → magic-link →
  category select → adaptive questionnaire → readiness summary → submit →
  resident detail, plus the full board side (dashboard, tabs, internal
  discussion, official messages, vote & decide) — including actual (stubbed)
  email notifications on info-requests and decisions.

## What's stubbed (and why)

Nothing here needed real credentials to prove out the flows, so these are
deliberately faked rather than left half-built:

| Piece | File | Stub behavior | Real version |
|---|---|---|---|
| Database | `src/lib/data/store.ts` | JSON file at `.data/db.json` | Supabase Postgres (`supabase/migrations/0001_init.sql` has the target schema) |
| Auth | `src/lib/session.ts`, `src/lib/data/auth.ts` | Unsigned cookies; a "simulate clicking the emailed link" button stands in for a real email | Supabase Auth magic-link sign-in (DESIGN.md §3) |
| File storage | `src/lib/drive.ts` | Records file metadata only, never persists bytes | Google Drive API via a service account on a Shared Drive (DESIGN.md §5) |
| Email | `src/lib/email.ts` | Logs to the server console | Resend (DESIGN.md §7) |
| Timers | date fields are computed and displayed | no daily job actually fires | Vercel Cron hitting an API route (DESIGN.md §6, doubles as the Supabase keep-alive) |

All 5 categories are enabled. An admin UI for editing question trees is
still the one deferred piece from DESIGN.md §4 — for now, adding or tweaking
a question means editing its category file directly.

## Moving off the dev store

When the Supabase project exists, `src/lib/data/*.ts` and `src/lib/session.ts`
are the only files that should need real changes — every page and Server
Action calls functions from those modules rather than touching storage
directly, so the swap is contained. Fill in `.env.example` as each
integration comes online.

## A known rough edge

Board sessions and resident sessions are both just cookies with no signing
or expiry beyond a 30-day max-age — fine for clicking through locally, not
something to expose publicly before Supabase Auth replaces it.
