"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, PackageOpen } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyStore } from "@/lib/seller";
import {
  getSellerOrders,
  setLineFulfillment,
  type OrderView,
} from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import {
  fulfillmentLabel,
  fulfillmentTone,
  orderStatusLabel,
  orderStatusTone,
} from "@/lib/order-status";
import type { FulfillmentStatus } from "@/lib/types";

/** Seller-facing view of orders containing their items, with fulfillment controls. */
export function SellerOrders() {
  const { supabase, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const store = await getMyStore(supabase);
    if (!store) {
      setHasStore(false);
      setLoading(false);
      return;
    }
    setOrders(await getSellerOrders(supabase, store.id));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Fetch on mount once auth resolves; load() manages its own state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading) load();
  }, [authLoading, load]);

  async function advance(itemId: string, next: FulfillmentStatus) {
    setBusy(itemId);
    try {
      await setLineFulfillment(supabase, itemId, next);
      setOrders((prev) =>
        prev.map((o) => ({
          ...o,
          items: o.items.map((i) => (i.id === itemId ? { ...i, fulfillment: next } : i)),
        })),
      );
    } catch {
      alert("Could not update fulfillment. Try again.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!hasStore) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted">
        Open a store from the Products tab to start receiving orders.
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <PackageOpen className="mx-auto mb-3 h-8 w-8 text-muted" />
        <p className="text-muted">No orders yet. They&apos;ll show up here once buyers pay.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Orders</h1>
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
                  {o.shippingName ? ` · Ship to ${o.shippingName}` : ""}
                </p>
                {o.shippingAddr && (
                  <p className="text-xs text-muted">{o.shippingAddr}</p>
                )}
              </div>
              <Badge tone={orderStatusTone(o.status)}>{orderStatusLabel(o.status)}</Badge>
            </div>
            <ul className="space-y-3 border-t border-border pt-3">
              {o.items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {i.quantity}× {i.title}
                    </p>
                    <p className="text-xs text-muted">
                      {formatPrice(i.unitPrice * i.quantity, o.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={fulfillmentTone(i.fulfillment)}>
                      {fulfillmentLabel(i.fulfillment)}
                    </Badge>
                    {i.fulfillment === "unfulfilled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === i.id}
                        onClick={() => advance(i.id, "shipped")}
                      >
                        {busy === i.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Mark shipped
                      </Button>
                    )}
                    {i.fulfillment === "shipped" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === i.id}
                        onClick={() => advance(i.id, "delivered")}
                      >
                        {busy === i.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Mark delivered
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
