# Maintainer Hand-Off Guide

This is the accounts/infrastructure guide for whoever takes over maintaining
HOA-ARC after the current board member rotates off. It complements
[README.md](./README.md) (what the app does and what's stubbed) and
[../DESIGN.md](../DESIGN.md) (the intended architecture) — this file is
specifically about *who owns what, and how to get access*.

Everything here was deliberately built to run on **$0/month**, and every
account below was set up under shared/dedicated identities rather than any
one person's personal accounts, specifically so this hand-off doesn't
require untangling anything from a departing board member's personal life.

## Quick reference

| Thing | Value |
|---|---|
| Live app | https://hoa-arc-rust.vercel.app |
| GitHub repo | https://github.com/mallard-bay-hoa/HOA-ARC (public) |
| Vercel project | `hoa-arc`, currently under a personal Hobby account (see below) |
| Supabase project | `hoa-arc`, ref `zkhapqcivafvkbmhzauq`, region `us-east-1` |
| Supabase dashboard | https://supabase.com/dashboard/project/zkhapqcivafvkbmhzauq |

## 1. GitHub

- **Org**: `mallard-bay-hoa` (free plan — unlimited collaborators, no billing
  needed).
- **Repo**: `HOA-ARC`, intentionally **public**. This isn't an oversight —
  Vercel's free Hobby plan cannot deploy a *private* repo owned by a GitHub
  Organization (only Pro/Enterprise support that), so the repo is public to
  stay on Vercel's free tier. There's nothing sensitive in it: no secrets,
  no resident data, just source code. If that ever changes, revisit whether
  Vercel needs a paid plan instead of keeping the repo public.
- **To get access**: ask an existing org member to invite you (org Settings
  → People → Invite member) with Write or Admin access, using your *own*
  GitHub account — there's no shared login to hand over.
- **When a board member rotates off**: remove them from org membership
  (org Settings → People). The repo itself is unaffected.
- Clone with: `git clone https://github.com/mallard-bay-hoa/HOA-ARC.git`,
  then `cd HOA-ARC/web` — **the git repo root is the `web/` subfolder**, not
  the top-level `HOA-ARC` folder (`DESIGN.md`/`REQUIREMENTS.md` live one
  level up, outside git).

## 2. Supabase (database)

- **Account**: `mallardbayhoaboard@gmail.com` — a dedicated account, not
  anyone's personal one.
- **Org**: "Mallard Bay HOA" (id `ayuvwqdspvnvvpuznyii`).
- **Project**: `hoa-arc` (ref `zkhapqcivafvkbmhzauq`), `us-east-1`.
- **To get access right now**: ask the current maintainer for the
  `mallardbayhoaboard@gmail.com` login.
- **Recommended going forward** (don't just keep re-sharing that password):
  have each new maintainer invited as a member of the "Mallard Bay HOA" org
  using **their own** Supabase account (org Settings → Team → Invite), and
  remove departing members instead. One thing to watch: Supabase's free tier
  caps each *person* at 2 active free projects, counted across every org
  where they're an Owner/Admin — so check whoever's account holds
  Owner/Admin here isn't already at that cap on unrelated projects of
  their own.
- **A real gotcha we hit, worth knowing**: Supabase now has two API key
  systems. This app's code (`src/lib/data/supabase.ts`) needs the **legacy
  JWT-format `service_role` key** — a long string starting `eyJ`, about 219
  characters — found under Project Settings → API → **"Legacy API Keys"**.
  The newer, shorter `sb_secret_...` key from the main "API Keys" section
  will fail with a bare "Invalid API key" error that looks like a
  credentials mismatch but is actually just the wrong key format. Cost us a
  lot of debugging the first time — don't repeat it.
- Schema lives at
  [`supabase/migrations/0001_initial_schema.sql`](./supabase/migrations/0001_initial_schema.sql)
  (6 tables: `requests`, `board_comments`, `official_messages`, `votes`,
  `magic_links`, `board_members`; RLS enabled on all of them with **no**
  policies — only the `service_role` key, used server-side only, can read
  or write, since every DB call goes through trusted server code, never the
  browser).

## 3. Vercel (hosting)

- Currently sits on the **current maintainer's personal** free Hobby
  account — deliberately **not** moved to a shared Team, because Vercel
  Teams require a paid Pro plan (~$20/mo/member), which would break the
  $0-budget goal.
- **This is the one account that genuinely needs a manual hand-off**, since
  it's tied to a real person. At hand-off time:
  1. In the `hoa-arc` project → Settings → General → **Transfer Project**
     (may be under a "Danger Zone" section depending on the current Vercel
     UI).
  2. The next maintainer needs their own free Vercel account to receive it
     — no Team/Pro plan required, this is a personal-account-to-personal-
     account transfer.
  3. **After transfer, re-check the Git integration.** It commonly needs
     re-authorizing: in GitHub, confirm the "Vercel" GitHub App has access
     to the `mallard-bay-hoa` org (org Settings → Third-party Access), then
     in the Vercel project → Settings → Git, reconnect if it shows
     disconnected. We hit exactly this after moving the GitHub repo — pushes
     silently stopped triggering deployments until this was redone.
  4. **Re-verify both environment variables** (Settings → Environment
     Variables, for **both** Production and Preview):
     - `NEXT_PUBLIC_SUPABASE_URL` = `https://zkhapqcivafvkbmhzauq.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY` = the legacy JWT key (see §2's gotcha
       above)
     - Do **not** mark `NEXT_PUBLIC_SUPABASE_URL` as "Sensitive" in Vercel —
       Sensitive variables are excluded from the build step, and Next.js
       needs to read `NEXT_PUBLIC_` variables at build time. `
       SUPABASE_SERVICE_ROLE_KEY` should stay Sensitive, since it's a real
       secret.
     - Trigger a redeploy after any env var change — it doesn't happen
       automatically.

## 4. Local development

```bash
git clone https://github.com/mallard-bay-hoa/HOA-ARC.git
cd HOA-ARC/web
npm install
```

Create `.env.local` (gitignored, never committed) with:

```
NEXT_PUBLIC_SUPABASE_URL=https://zkhapqcivafvkbmhzauq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<the legacy service_role JWT — see §2>
```

Then:

```bash
npm run dev
```

Open http://localhost:3000.

**Known local-only gotcha**: on some networks, Node's `fetch` tries IPv6
first and fails reaching Supabase with a bare `TypeError: fetch failed`
(no useful detail). Already worked around — `package.json`'s `dev` script
forces IPv4-first DNS resolution
(`NODE_OPTIONS=--dns-result-order=ipv4first`). If you ever see this error
again, confirm that's still in place.

## 5. Outstanding items (not yet done)

- **Delete the old Supabase project** (id `eufifaswhjhsxhvlqvky`, under the
  previous maintainer's *personal* account) once confirmed it's no longer
  needed — it was superseded by the current one above during the account
  migration and is just left over.
- **Full Supabase Auth + Row Level Security** (DESIGN.md §3/§8) — the app
  still uses a hand-rolled magic-link/cookie session (see README.md's "What's
  stubbed"), not Supabase's own Auth product, and RLS policies were never
  authored (tables are locked down by omission, not by real policies).
- **Google Drive integration** and **Resend** (transactional email) — not
  yet provisioned. When they are, set them up under the shared
  `mallardbayhoaboard@gmail.com`-style identity from day one, not anyone's
  personal account, so this whole migration doesn't have to happen a third
  time.
- Remaining category question trees / the daily notification-and-timer cron
  job — see `DESIGN.md`'s Suggested Build Order for what's left.
