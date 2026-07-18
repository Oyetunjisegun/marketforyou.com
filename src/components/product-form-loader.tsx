"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProductForm } from "@/components/product-form";
import { useAuth } from "@/components/auth-provider";
import { getMyStore, type SellerStore } from "@/lib/seller";
import { getProductBySlugOrId } from "@/lib/api";
import type { Product } from "@/lib/types";

/**
 * Resolves the caller's store (redirecting to onboarding if they have none) and
 * — for the edit route — loads the product, then renders the shared form.
 */
export function ProductFormLoader({ productId }: { productId?: string }) {
  const router = useRouter();
  const { supabase, loading: authLoading } = useAuth();
  const [store, setStore] = useState<SellerStore | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      const s = await getMyStore(supabase);
      if (!s) {
        router.replace("/dashboard/products");
        return;
      }
      setStore(s);
      if (productId) {
        const p = await getProductBySlugOrId(productId);
        if (!p || p.seller.id !== s.id) {
          setNotFound(true);
        } else {
          setProduct(p);
        }
      }
      setLoading(false);
    })();
  }, [authLoading, supabase, productId, router]);

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="py-16 text-center text-muted">
        <p>That listing wasn&apos;t found in your store.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">
        {product ? "Edit listing" : "New listing"}
      </h1>
      <ProductForm sellerId={store.id} product={product ?? undefined} />
    </div>
  );
}
