"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/components/wishlist-provider";
import { ProductGrid } from "@/components/product-grid";
import { Button } from "@/components/ui/button";
import { getProductsByIds } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getProductsByIds([...ids]).then((p) => {
      if (alive) {
        setProducts(p);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [ids]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Heart className="h-6 w-6 text-danger" /> Your wishlist
      </h1>

      {!loading && products.length === 0 ? (
        <div className="grid place-items-center py-20 text-center">
          <p className="text-muted">You haven&apos;t saved anything yet.</p>
          <Link href="/search" className="mt-4">
            <Button>Discover products</Button>
          </Link>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
