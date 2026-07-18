import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate the whole admin section server-side.
  await requireAdmin();

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-8">
      <aside className="hidden w-52 shrink-0 md:block">
        <h2 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Admin
        </h2>
        <nav className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-2"
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
