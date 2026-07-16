import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key — every caller in
// src/lib/data is itself server-only (Server Components/Actions/API
// routes), so this mirrors the old fs-based store's trust boundary:
// only our own server code ever touches the data, never the browser.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
