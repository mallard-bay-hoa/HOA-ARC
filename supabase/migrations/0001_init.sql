-- Mirrors DESIGN.md §2. Not yet applied anywhere — this is the target schema
-- for when the Supabase project is provisioned (see README "Moving off the
-- dev store" section). RLS policies are sketched per DESIGN.md §8 but left
-- as TODOs since they depend on how auth.jwt() is populated once Supabase
-- Auth is wired up.

create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users (id),
  email text not null,
  full_name text,
  role text not null check (role in ('resident', 'board_member', 'admin')),
  created_at timestamptz not null default now()
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  lot_number text,
  owner_name text,
  owner_email text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories (id),
  active boolean not null default true,
  sort_order int not null default 0
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id),
  prompt text not null,
  input_type text not null check (input_type in ('text', 'number', 'boolean', 'select', 'file')),
  options jsonb,
  parent_id uuid references questions (id),
  shows_if_answer jsonb,
  rule_citation jsonb,
  sort_order int not null default 0,
  active boolean not null default true
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id),
  property_id uuid references properties (id),
  resident_email text not null,
  status text not null default 'draft' check (
    status in ('draft', 'submitted', 'in_review', 'info_requested', 'approved', 'approved_conditional', 'denied', 'auto_approved')
  ),
  submitted_at timestamptz,
  last_resubmitted_at timestamptz,
  sla_due_at timestamptz,
  failsafe_due_at timestamptz,
  decided_at timestamptz,
  approval_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table request_answers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests (id) on delete cascade,
  question_id uuid not null references questions (id),
  answer jsonb not null,
  created_at timestamptz not null default now()
);

create table request_flags (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests (id) on delete cascade,
  flag_type text not null check (flag_type in ('hoa_conflict', 'government_violation', 'permit_reminder')),
  citation jsonb,
  description text not null,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests (id) on delete cascade,
  drive_file_id text,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by text,
  uploaded_at timestamptz not null default now()
);

create table board_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests (id) on delete cascade,
  author_id uuid not null references profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

create table official_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests (id) on delete cascade,
  author_id uuid not null references profiles (id),
  message_type text not null check (
    message_type in ('info_request', 'approved', 'denied', 'approved_conditional', 'general')
  ),
  body text not null,
  cited_sections jsonb[] default '{}',
  sent_email_at timestamptz,
  created_at timestamptz not null default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests (id) on delete cascade,
  board_member_id uuid not null references profiles (id),
  decision text not null check (decision in ('approve', 'deny')),
  created_at timestamptz not null default now(),
  unique (request_id, board_member_id)
);

create table governing_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  version_label text,
  effective_date date,
  drive_file_id text,
  created_at timestamptz not null default now()
);

create table governing_document_sections (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references governing_documents (id) on delete cascade,
  section_number text not null,
  title text,
  summary text,
  category_tags text[]
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests (id),
  actor_email text,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- RLS: enable now, author policies once Supabase Auth is wired up (DESIGN.md §3, §8).
alter table requests enable row level security;
alter table board_comments enable row level security;
alter table official_messages enable row level security;
alter table votes enable row level security;
