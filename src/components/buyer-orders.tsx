"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, PackageOpen } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyOrders, type OrderView } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel, orderStatusTone } from "@/lib/order-status";

/** Buyer-facing order history. */
export function BuyerOrders() {
  const { supabase, user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    getMyOrders(supabase, user.id)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [authLoading, user, supabase]);

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <PackageOpen className="mx-auto mb-3 h-8 w-8 text-muted" />
        <p className="text-muted">You haven&apos;t placed any orders yet.</p>
        <Link href="/search" className="mt-3 inline-block">
          <Button variant="outline">Start shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id} className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Order #{o.id.slice(0, 8)}</p>
              <p className="text-xs text-muted">
                {new Date(o.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <Badge tone={orderStatusTone(o.status)}>{orderStatusLabel(o.status)}</Badge>
          </div>
          <ul className="space-y-1.5 border-t border-border pt-3 text-sm">
            {o.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2 text-muted">
                <span className="truncate">
                  {i.quantity}× {i.title}
                </span>
                <span className="shrink-0 text-foreground">
                  {formatPrice(i.unitPrice * i.quantity, o.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold">
            <span>Total</span>
            <span>{formatPrice(o.total, o.currency)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
