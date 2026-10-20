<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Supabase migrations

Since 2026-10-30, Supabase no longer grants Data API access to new tables in `public`. Every migration that creates a table must grant it in the same file, or the service-role client returns "permission denied":

```sql
grant select, insert, update, delete on your_table to service_role;
```

The app only talks to the database through the service-role client (`src/lib/data/supabase.ts`), so don't grant `anon` or `authenticated` unless that changes.
