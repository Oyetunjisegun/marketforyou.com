import { getAdminOrders } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { orderStatusLabel, orderStatusTone } from "@/lib/order-status";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Orders</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-muted">{o.buyerEmail || "—"}</td>
                <td className="px-4 py-3 text-muted">{o.itemCount}</td>
                <td className="px-4 py-3">{formatPrice(o.total, o.currency)}</td>
                <td className="px-4 py-3">
                  <Badge tone={orderStatusTone(o.status)}>
                    {orderStatusLabel(o.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
