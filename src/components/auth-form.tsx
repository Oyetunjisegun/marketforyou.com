"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

/** OAuth providers wired through the auth service (seam only in this build). */
const OAUTH = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "facebook", label: "Facebook" },
];

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Seam: POST /api/v1/auth/{login|register}. Mocked with a short delay.
    setTimeout(() => {
      setLoading(false);
      setError("Auth backend not connected in this demo build.");
    }, 900);
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
              onClick={() => setError("Social sign-in not connected in this demo build.")}
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
