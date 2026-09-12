-- Deep-linking magic links: notification emails can now carry a sign-in
-- link that drops the recipient straight onto the relevant page instead
-- of the default post-login landing page. Also gives links an explicit
-- expiry — infrequent-checking residents/board members need these to
-- outlive a typical "haven't opened my inbox in a week" gap.
alter table magic_links add column redirect_to text;
alter table magic_links add column expires_at timestamptz not null default (now() + interval '30 days');

-- Per-board-member "have I seen this request's latest activity" tracking,
-- so the dashboard can flag an unread resident reply.
create table board_request_views (
  board_member_id text not null,
  request_id uuid not null references requests(id) on delete cascade,
  last_viewed_at timestamptz not null default now(),
  primary key (board_member_id, request_id)
);

alter table board_request_views enable row level security;
