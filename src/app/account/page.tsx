import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await createClient();

  // getUser() re-validates the token with Supabase (more trustworthy than
  // getSession for gating protected pages).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.full_name || user.user_metadata?.full_name || "there";
  const joined = new Date(user.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-border bg-surface p-8">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome, {name}</h1>
            <p className="text-sm text-muted">Member since {joined}</p>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <Detail icon={Mail} label="Email" value={profile?.email || user.email || "—"} />
          <Detail icon={Phone} label="Phone" value={profile?.phone || "Not set"} />
          <Detail icon={MapPin} label="Address" value={profile?.address || "Not set"} />
          <Detail
            icon={ShieldCheck}
            label="Account type"
            value={(profile?.role ?? "buyer").replace(/^\w/, (c) => c.toUpperCase())}
          />
        </dl>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
          <Link
            href="/account/orders"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Your orders
          </Link>
          <Link
            href="/dashboard/products"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Seller dashboard
          </Link>
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Admin dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <Icon className="h-4 w-4" /> {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
