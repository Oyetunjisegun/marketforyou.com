import { DollarSign, Package, ShoppingBag, Store, Users } from "lucide-react";
import { getAdminStats } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Users", value: stats.users.toLocaleString(), icon: Users },
    { label: "Sellers", value: stats.sellers.toLocaleString(), icon: Store },
    { label: "Products", value: stats.products.toLocaleString(), icon: Package },
    { label: "Orders", value: stats.orders.toLocaleString(), icon: ShoppingBag },
    {
      label: "Paid orders",
      value: stats.paidOrders.toLocaleString(),
      icon: ShoppingBag,
    },
    {
      label: "Revenue",
      value: formatPrice(stats.revenue, "USD"),
      icon: DollarSign,
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{label}</p>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
