import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Reads/writes the session from cookies so auth state survives across requests.
 *
 * Must be created per-request (cookies() is request-scoped) — never cache it in
 * a module-level variable.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` was called from a Server Component, where cookies are
            // read-only. Safe to ignore when middleware is refreshing sessions.
          }
        },
      },
    },
  );
}

/**
 * Admin client — uses the service_role key and BYPASSES Row Level Security.
 * SERVER-ONLY. Never import this into a Client Component. Use only for trusted
 * operations (seeding, admin tasks) where you've already authorized the caller.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
