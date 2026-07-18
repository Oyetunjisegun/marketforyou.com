"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Gavel, Tag, Truck } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice, discountPercent, timeRemaining } from "@/lib/format";
import { Rating } from "./ui/rating";
import { Badge } from "./ui/badge";
import { useWishlist } from "./wishlist-provider";
import { useCart } from "./cart-provider";
import { cn } from "@/lib/cn";

export function ProductCard({ product }: { product: Product }) {
  const { has, toggle } = useWishlist();
  const { add } = useCart();
  const saved = has(product.id);
  const discount = discountPercent(product.price, product.originalPrice);
  const isAuction = product.listingType === "auction";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-lg hover:shadow-black/5">
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        <Link href={`/product/${product.slug}`} aria-label={product.title}>
          <Image
            src={product.images[0]?.url ?? ""}
            alt={product.images[0]?.alt ?? product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* top-left badge stack */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isSponsored && <Badge tone="accent">Sponsored</Badge>}
          {discount && <Badge tone="danger">-{discount}%</Badge>}
          {isAuction && (
            <Badge tone="primary">
              <Gavel className="h-3 w-3" /> Auction
            </Badge>
          )}
        </div>

        {/* wishlist toggle */}
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={saved}
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-surface"
        >
          <Heart
            className={cn("h-4.5 w-4.5", saved && "fill-danger text-danger")}
            style={{ width: 18, height: 18 }}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:text-primary"
        >
          {product.title}
        </Link>

        <Rating value={product.rating} count={product.ratingCount} />

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground">
                {formatPrice(isAuction ? product.auction!.currentBid : product.price, product.currency)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-muted line-through">
                  {formatPrice(product.originalPrice, product.currency)}
                </span>
              )}
            </div>
            {isAuction ? (
              <span className="text-xs text-muted">
                {product.auction!.bidCount} bids · {timeRemaining(product.auction!.endsAt)}
              </span>
            ) : product.freeShipping ? (
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <Truck className="h-3 w-3" /> Free shipping
              </span>
            ) : (
              <span className="text-xs text-muted">{product.location}</span>
            )}
          </div>

          {!isAuction && (
            <button
              type="button"
              onClick={() => add(product)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
              aria-label={`Add ${product.title} to cart`}
            >
              <Tag className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
