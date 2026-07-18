"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";

/** OAuth providers wired through Supabase (enable each in the dashboard first). */
const OAUTH = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "facebook", label: "Facebook" },
] as const;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("name") ?? "").trim();
    const supabase = createClient();

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        // If email confirmation is on, there's no session yet.
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in.");
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      // Success with a live session: refresh so the server re-reads auth state.
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  async function oauth(provider: (typeof OAUTH)[number]["id"]) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <div className="rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-2xl font-bold">{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-muted">
          {isRegister ? "Join Marketforyou to buy and sell." : "Sign in to continue."}
        </p>

        {/* oauth */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {OAUTH.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => oauth(p.id)}
              className="rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-surface-2"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isRegister && (
            <Field icon={User} label="Full name" name="name" autoComplete="name" required />
          )}
          <Field icon={Mail} label="Email" name="email" type="email" autoComplete="email" required />
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <div className="flex items-center rounded-lg border border-border px-3 focus-within:ring-2 focus-within:ring-ring">
              <Lock className="h-4 w-4 text-muted" />
              <input
                type={showPw ? "text" : "password"}
                name="password"
                required
                minLength={8}
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="text-muted hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!isRegister && (
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary" role="status">
              {notice}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRegister ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isRegister ? "Already have an account? " : "New to Marketforyou? "}
          <Link href={isRegister ? "/login" : "/register"} className="font-medium text-primary hover:underline">
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div className="flex items-center rounded-lg border border-border px-3 focus-within:ring-2 focus-within:ring-ring">
        <Icon className="h-4 w-4 text-muted" />
        <input
          {...props}
          className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
        />
      </div>
    </div>
  );
}
