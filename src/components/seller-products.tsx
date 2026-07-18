"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import {
  deleteProduct,
  getMyProducts,
  getMyStore,
  type SellerStore,
} from "@/lib/seller";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { BecomeSeller } from "./become-seller";

/**
 * Seller's product manager: lists their listings with edit/delete. If the user
 * hasn't opened a store yet, shows the onboarding form instead.
 */
export function SellerProducts() {
  const { supabase, loading: authLoading } = useAuth();
  const [store, setStore] = useState<SellerStore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const s = await getMyStore(supabase);
    setStore(s);
    setProducts(s ? await getMyProducts(supabase, s.id) : []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Kick off the data load once auth resolves. load() sets state internally;
    // that's the intended "fetch on mount" pattern, not a render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading) load();
  }, [authLoading, load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this listing? This can't be undone.")) return;
    setDeleting(id);
    try {
      await deleteProduct(supabase, id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Could not delete the listing. Try again.");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!store) {
    return <BecomeSeller onDone={load} />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your products</h1>
          <p className="text-sm text-muted">
            {products.length} listing{products.length === 1 ? "" : "s"} ·{" "}
            <Link href={`/seller/${store.handle}`} className="text-primary hover:underline">
              View your store
            </Link>
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <Plus className="h-4 w-4" /> New listing
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted">No listings yet.</p>
          <Link href="/dashboard/products/new" className="mt-3 inline-block">
            <Button variant="outline">Create your first listing</Button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-4 p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2">
                {p.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${p.slug}`}
                  className="block truncate font-medium hover:text-primary"
                >
                  {p.title}
                </Link>
                <p className="text-sm text-muted">
                  {formatPrice(p.price, p.currency)} · {p.stock} in stock
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Link href={`/dashboard/products/${p.id}/edit`}>
                  <Button variant="ghost" size="icon" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  disabled={deleting === p.id}
                  onClick={() => handleDelete(p.id)}
                >
                  {deleting === p.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-danger" />
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
