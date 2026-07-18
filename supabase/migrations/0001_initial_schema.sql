-- Pragmatic schema actually deployed to Supabase (see src/lib/data/requests.ts
-- and src/lib/data/auth.ts, which read/write these tables directly). This is
-- deliberately smaller than the full DESIGN.md §2 schema in
-- supabase/design_target_schema.sql.future — no profiles/properties/
-- categories/questions/documents/governing_documents tables, since the app
-- doesn't use Supabase Auth yet and category/question data lives in code
-- (src/lib/domain), not the database. `documents` is a jsonb array column on
-- `requests` rather than its own table.
--
-- Corresponds to the migration named "initial_schema" applied via the
-- Supabase MCP tools (remote migration version 20260716012935).

create table board_members (
  id text primary key,
  name text not null,
  email text not null,
  address text not null
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null,
  address text not null,
  resident_name text not null,
  resident_email text not null,
  status text not null default 'draft',
  answers jsonb not null default '{}'::jsonb,
  flags jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  submitted_at timestamptz,
  last_resubmitted_at timestamptz,
  sla_due_at timestamptz,
  failsafe_due_at timestamptz,
  decided_at timestamptz,
  approval_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table board_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  author_id text not null,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table official_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  author_id text not null,
  message_type text not null,
  body text not null,
  cited_sections text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  board_member_id text not null,
  decision text not null,
  cited_sections text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (request_id, board_member_id)
);

create table magic_links (
  token uuid primary key default gen_random_uuid(),
  email text not null,
  address text not null,
  name text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index requests_resident_email_idx on requests (lower(resident_email));
create index requests_sla_due_at_idx on requests (sla_due_at);
create index board_comments_request_id_idx on board_comments (request_id);
create index official_messages_request_id_idx on official_messages (request_id);
create index votes_request_id_idx on votes (request_id);

insert into board_members (id, name, email, address) values
  ('board-1', 'J. Alvarez', 'j.alvarez@example.com', '456 Teal Ct'),
  ('board-2', 'R. Chen', 'r.chen@example.com', '789 Heron Way'),
  ('board-3', 'S. Whitfield', 's.whitfield@example.com', '210 Pintail Ln');

alter table requests enable row level security;
alter table board_comments enable row level security;
alter table official_messages enable row level security;
alter table votes enable row level security;
alter table magic_links enable row level security;
alter table board_members enable row level security;
