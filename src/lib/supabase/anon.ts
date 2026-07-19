import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * A session-less Supabase client for reading PUBLIC catalog data
 * (products, sellers, categories, reviews) from anywhere — Server Components,
 * Client Components, route handlers. It uses the anon key and does not persist
 * a session, so it's safe to share as a singleton and works in the browser and
 * on the server alike.
 *
 * IMPORTANT: the underlying client is created LAZILY, on first use — not at
 * import time. `createClient` throws "supabaseUrl is required" when the env
 * vars are absent, and during Next's build-time page-data collection this
 * module can be imported (e.g. by sitemap.ts) in a context where the env is
 * not resolved. Constructing at import time therefore crashed the build before
 * any function body — and its try/catch — could run. A lazy getter defers that
 * construction until an actual query is made, where a missing env fails inside
 * the caller's try/catch instead of at import.
 *
 * Do NOT use this for anything that depends on the logged-in user (their
 * profile, their orders, their wishlist writes) — those need the cookie-aware
 * server client (supabase/server.ts) or the browser client (supabase/client.ts)
 * so Row Level Security sees the real user.
 */
let client: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }

  client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/**
 * A proxy that constructs the real client on first property access. Existing
 * call sites keep using `supabaseAnon.from(...)` unchanged, but importing this
 * module no longer runs `createClient`, so a missing env at import time can no
 * longer throw.
 */
export const supabaseAnon = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getClient(), prop, receiver);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});
