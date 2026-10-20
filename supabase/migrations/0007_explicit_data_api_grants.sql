-- From 2026-10-30 Supabase stops granting the Data API roles access to new
-- tables in `public`. Live tables keep the grants they already have, so this
-- is a no-op on production. It matters when the schema is rebuilt from these
-- files (a new project or `supabase db reset`): without it, every table
-- created above would answer "permission denied".
--
-- Only `service_role`: the app talks to the database solely through the
-- service-role client (src/lib/data/supabase.ts), and no table has a policy
-- that would let `anon` or `authenticated` read a row anyway.
--
-- Every new table from here on grants in the migration that creates it.
grant select, insert, update, delete on
  requests,
  board_comments,
  official_messages,
  votes,
  magic_links,
  properties,
  residents,
  resident_properties,
  board_request_views
to service_role;
