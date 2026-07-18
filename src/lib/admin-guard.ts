import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

/**
 * Server-side admin gate. Confirms there's a signed-in user whose profile role
 * is 'admin'; otherwise redirects. Call at the top of every admin page/layout.
 * Returns the admin user's id for convenience.
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/");

  return { userId: user.id };
}
