"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

interface AuthContextValue {
  user: User | null;
  /** True until the initial session check resolves — avoids UI flicker. */
  loading: boolean;
  /** The shared browser Supabase client, for authenticated reads/writes. */
  supabase: SupabaseClient<Database>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialSession,
  children,
}: {
  initialSession: Session | null;
  children: ReactNode;
}) {
  // Seed from the server-detected session so the first paint already knows
  // whether the user is logged in (no flash of "Sign in").
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [loading, setLoading] = useState(!initialSession);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    // Reconcile on mount, then subscribe to future changes (login in another
    // tab, token refresh, sign-out) so the whole app stays in sync.
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const value = useMemo(
    () => ({ user, loading, supabase, signOut }),
    [user, loading, supabase, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
