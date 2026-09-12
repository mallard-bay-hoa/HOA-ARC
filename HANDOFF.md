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
| Live app | https://mallardbayhoa.org (custom domain; also reachable at https://hoa-arc-rust.vercel.app) |
| Domain registrar | Porkbun, account `mallardbayhoaboard@gmail.com` (shared identity, see §3a) |
| GitHub repo | https://github.com/mallard-bay-hoa/HOA-ARC (public) |
| Vercel project | `hoa-arc`, currently under a personal Hobby account (see below) |
| Supabase project | `hoa-arc`, ref `zkhapqcivafvkbmhzauq`, region `us-east-1` |
| Supabase dashboard | https://supabase.com/dashboard/project/zkhapqcivafvkbmhzauq |
| Resend account | **Currently under the current maintainer's personal account** (see §3b) — needs manual hand-off, same caveat as Vercel |

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

## 4. Domain (mallardbayhoa.org)

- **Registrar**: Porkbun, account `mallardbayhoaboard@gmail.com` (shared
  board identity — ask the current maintainer for the login, same as
  Supabase in §2).
- **DNS records currently set at Porkbun**:
  - `ALIAS @ → cname.vercel-dns.com` — points the bare domain at Vercel.
    We initially tried a plain `A` record (`76.76.21.21`, Vercel's
    documented value), but Porkbun's ALIAS/ANAME flattening was found to
    inject one of its own IPs alongside Vercel's, which broke TLS for
    roughly half of requests. Switched to explicit `A` records instead
    (see below) — **if `mallardbayhoa.org` ever stops resolving, check
    `dig mallardbayhoa.org A` from a couple of different resolvers
    (`@8.8.8.8`, `@1.1.1.1`) for a stray non-Vercel IP mixed in; that's
    this exact issue recurring.**
  - Two `A` records on `@`: `216.198.79.1` and `64.29.17.1` (Vercel's
    currently-recommended IPs — check `vercel domains verify
    mallardbayhoa.org` for the current recommendation, since Vercel can
    change these).
  - A pre-existing wildcard `CNAME * → pixie.porkbun.com` (Porkbun's
    default parking page for undefined subdomains) — left in place,
    harmless. It does **not** affect the bare root domain or any
    explicitly-defined subdomain (explicit records always win over a
    wildcard). If `www.mallardbayhoa.org` should ever work, it'll need
    its own explicit `CNAME www → cname.vercel-dns.com`, since right now
    it falls through to this wildcard (Porkbun's parking page).
  - Resend domain verification records (MX + TXT/SPF on `send.mallardbayhoa.org`,
    DKIM TXT on `resend._domainkey.mallardbayhoa.org`, DMARC TXT on
    `_dmarc.mallardbayhoa.org`) — see §5.
- **Vercel side**: the domain is attached to the `hoa-arc` project
  (`vercel domains inspect mallardbayhoa.org` to check status). If it ever
  shows `misconfigured`, re-run `vercel domains verify mallardbayhoa.org`
  for the current expected records.

## 5. Resend (transactional email)

- **Currently under the current maintainer's personal Resend account —
  this needs the same manual hand-off treatment as Vercel (§3).** At
  hand-off time, either transfer/share the Resend account itself, or
  create a new one under a shared identity (e.g.
  `mallardbayhoaboard@gmail.com`, matching Supabase/Porkbun) and redo the
  domain verification below under that account instead.
- **Sending domain**: `mallardbayhoa.org`, verified in Resend (Domains →
  mallardbayhoa.org should show a green "Verified" status). If it's ever
  unverified again, redo the DNS records Resend's dashboard shows you at
  Porkbun (see §4's Resend bullet for which records those are).
- **From address**: `arc@mallardbayhoa.org` (hardcoded in
  `src/lib/email.ts`). **Reply-To**: `mallardbayhoaboard@gmail.com` — so
  replies from residents land in the board's real inbox rather than an
  unmonitored address.
- **API key**: `RESEND_API_KEY` in Vercel → Settings → Environment
  Variables, currently set for **Production only** (not Preview) —
  intentional, so preview deployments still use the console-log stub
  instead of sending real email to residents during testing. If that
  changes, add the same key to Preview too.
- **Important safety mechanism**: `src/lib/email.ts` exports
  `emailIsStubbed` (true whenever `RESEND_API_KEY` isn't set). Both
  `src/app/start/actions.ts` and `src/app/board/signin/actions.ts` check
  this before deciding whether to put the magic-link token in the
  `/start/link-sent` URL and show the dev-only "simulate clicking the
  emailed link" bypass button. **Do not remove that check** — without it,
  the token (and a working sign-in bypass) would be exposed in the URL/
  browser history to anyone who saw that page, once email is genuinely
  live. This bit us once already: the bypass was originally unconditional
  from early development and only gated behind `emailIsStubbed` after
  Resend went live.

## 6. Local development

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

## 7. Outstanding items (not yet done)

- **Delete the old Supabase project** (id `eufifaswhjhsxhvlqvky`, under the
  previous maintainer's *personal* account) once confirmed it's no longer
  needed — it was superseded by the current one above during the account
  migration and is just left over.
- **Full Supabase Auth + Row Level Security** (DESIGN.md §3/§8) — the app
  still uses a hand-rolled magic-link/cookie session (see README.md's "What's
  stubbed"), not Supabase's own Auth product, and RLS policies were never
  authored (tables are locked down by omission, not by real policies).
- **Move the Resend account off the current maintainer's personal
  account** to a shared identity (see §5) — it was set up under a personal
  account rather than `mallardbayhoaboard@gmail.com`-style shared identity
  like Supabase/Porkbun were, so it needs the same manual hand-off Vercel
  does (§3).
- **Admin UI for editing question trees** (DESIGN.md §4) — adding/tweaking
  a category's questions currently means editing its file directly under
  `src/lib/domain/`.

Google Drive was never provisioned and won't be — DESIGN.md originally
specified it for document storage, but that was superseded by Supabase
Storage instead (see README.md's Database section), since the project
already runs on Supabase. All 5 category question trees and the daily
notification/timer cron job (also originally listed here as outstanding)
are done — see README.md's "What's real" for both.
