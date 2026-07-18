import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * A session-less Supabase client for reading PUBLIC catalog data
 * (products, sellers, categories, reviews) from anywhere — Server Components,
 * Client Components, route handlers. It uses the anon key and does not persist
 * a session, so it's safe to share as a singleton and works in the browser and
 * on the server alike.
 *
 * Do NOT use this for anything that depends on the logged-in user (their
 * profile, their orders, their wishlist writes) — those need the cookie-aware
 * server client (supabase/server.ts) or the browser client (supabase/client.ts)
 * so Row Level Security sees the real user.
 */
export const supabaseAnon = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
