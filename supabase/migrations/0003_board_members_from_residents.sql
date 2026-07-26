-- Board members are just residents flagged is_board_member — the sign-in
-- page lists them and, on click, emails a magic link to the address on
-- file (not a hardcoded roster anyone could impersonate). magic_links gets
-- a purpose column so the link's consumer knows whether to grant a board
-- or resident session. The old standalone board_members table (3 seeded
-- placeholder rows) is superseded by this — see 0004_drop_board_members.sql.

alter table residents add column is_board_member boolean not null default false;
alter table magic_links add column purpose text not null default 'resident' check (purpose in ('resident', 'board'));
