import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ShoppingBag, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Seller dashboard shell. Gated: you must be signed in. Non-sellers still reach
 * the pages (so they can hit the "open a store" call-to-action), but every
 * data query is scoped to the caller's own seller row via RLS.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/products");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Store className="h-4 w-4" />
        <span className="font-medium text-foreground">Seller dashboard</span>
      </div>
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 md:flex-col">
          <DashLink href="/dashboard/products" icon={Package}>Products</DashLink>
          <DashLink href="/dashboard/orders" icon={ShoppingBag}>Orders</DashLink>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function DashLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground"
    >
      <Icon className="h-4 w-4" /> {children}
    </Link>
  );
}
