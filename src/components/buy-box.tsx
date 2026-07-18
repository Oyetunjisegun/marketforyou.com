"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Gavel, HandCoins, ShoppingCart, Zap, ShieldCheck, Truck, RotateCcw, Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice, discountPercent, timeRemaining } from "@/lib/format";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useCart } from "./cart-provider";
import { useWishlist } from "./wishlist-provider";
import { cn } from "@/lib/cn";

export function BuyBox({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const saved = has(product.id);

  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [showOffer, setShowOffer] = useState(false);
  const [offer, setOffer] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const isAuction = product.listingType === "auction";
  const acceptsOffers = product.listingType === "offer";
  const discount = discountPercent(product.price, product.originalPrice);
  const outOfStock = product.stock <= 0;

  // All variant options must be chosen before purchase.
  const variantsChosen = useMemo(
    () => (product.variants ?? []).every((v) => selected[v.name]),
    [product.variants, selected],
  );

  function handleAddToCart(buyNow = false) {
    if (!variantsChosen) {
      setNotice("Please choose all options first.");
      return;
    }
    add(product, qty, selected);
    setNotice(null);
    if (buyNow) router.push("/checkout");
  }

  function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(offer);
    if (!amount || amount <= 0) return;
    // Seam: POST /api/v1/offers -> notifies seller, opens negotiation thread.
    setShowOffer(false);
    setNotice(`Offer of ${formatPrice(amount, product.currency)} sent to the seller.`);
    setOffer("");
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {product.isSponsored && <Badge tone="accent">Sponsored</Badge>}
          <Badge tone="neutral" className="capitalize">{product.condition.replace("-", " ")}</Badge>
          {isAuction && (
            <Badge tone="primary">
              <Gavel className="h-3 w-3" /> Live auction
            </Badge>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold leading-tight">{product.title}</h1>
      </div>

      {/* price block */}
      <div className="rounded-xl border border-border bg-surface p-4">
        {isAuction ? (
          <>
            <p className="text-sm text-muted">Current bid</p>
            <p className="text-3xl font-extrabold">
              {formatPrice(product.auction!.currentBid, product.currency)}
            </p>
            <p className="mt-1 text-sm text-muted">
              {product.auction!.bidCount} bids · {timeRemaining(product.auction!.endsAt)}
            </p>
          </>
        ) : (
          <div className="flex items-end gap-3">
            <p className="text-3xl font-extrabold">{formatPrice(product.price, product.currency)}</p>
            {product.originalPrice && (
              <p className="pb-1 text-sm text-muted line-through">
                {formatPrice(product.originalPrice, product.currency)}
              </p>
            )}
            {discount && <Badge tone="danger" className="mb-1.5">Save {discount}%</Badge>}
          </div>
        )}

        <p className={cn("mt-2 text-sm", outOfStock ? "text-danger" : "text-success")}>
          {outOfStock
            ? "Out of stock"
            : product.kind === "digital"
              ? "Instant digital delivery"
              : `${product.stock} in stock`}
        </p>
      </div>

      {/* variants */}
      {product.variants?.map((v) => (
        <div key={v.name}>
          <p className="mb-2 text-sm font-medium">{v.name}</p>
          <div className="flex flex-wrap gap-2">
            {v.values.map((val) => (
              <button
                key={val}
                onClick={() => setSelected((s) => ({ ...s, [v.name]: val }))}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  selected[v.name] === val
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-muted",
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* quantity (fixed-price physical only) */}
      {!isAuction && product.kind === "physical" && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center rounded-lg border border-border">
            <button
              className="grid h-9 w-9 place-items-center text-muted hover:text-foreground disabled:opacity-40"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-medium" aria-live="polite">{qty}</span>
            <button
              className="grid h-9 w-9 place-items-center text-muted hover:text-foreground disabled:opacity-40"
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              disabled={qty >= product.stock}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* actions */}
      <div className="space-y-2">
        {isAuction ? (
          <>
            <Button size="lg" className="w-full" onClick={() => setNotice("Bidding opens once you sign in.")}>
              <Gavel className="h-5 w-5" /> Place bid
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => setShowOffer(true)}>
              <HandCoins className="h-5 w-5" /> Buy it now
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" className="w-full" disabled={outOfStock} onClick={() => handleAddToCart(true)}>
              <Zap className="h-5 w-5" /> Buy now
            </Button>
            <Button size="lg" variant="secondary" className="w-full" disabled={outOfStock} onClick={() => handleAddToCart(false)}>
              <ShoppingCart className="h-5 w-5" /> Add to cart
            </Button>
            {acceptsOffers && (
              <Button size="lg" variant="outline" className="w-full" onClick={() => setShowOffer(true)}>
                <HandCoins className="h-5 w-5" /> Make an offer
              </Button>
            )}
          </>
        )}
        <button
          onClick={() => toggle(product.id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-muted hover:text-foreground"
          aria-pressed={saved}
        >
          <Heart className={cn("h-4 w-4", saved && "fill-danger text-danger")} />
          {saved ? "Saved to wishlist" : "Save to wishlist"}
        </button>
      </div>

      {notice && (
        <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary" role="status">
          {notice}
        </p>
      )}

      {/* trust row */}
      <ul className="grid grid-cols-1 gap-2 border-t border-border pt-4 text-sm text-muted sm:grid-cols-3">
        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Buyer protection</li>
        <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> {product.freeShipping ? "Free shipping" : "Fast shipping"}</li>
        <li className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-accent" /> 30-day returns</li>
      </ul>

      {/* offer modal */}
      {showOffer && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOffer(false)} />
          <form
            onSubmit={submitOffer}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold">Make an offer</h2>
            <p className="mt-1 text-sm text-muted">
              Listed at {formatPrice(product.price, product.currency)}. Enter your best price.
            </p>
            <div className="mt-4 flex items-center rounded-lg border border-border px-3">
              <span className="text-muted">{product.currency}</span>
              <input
                type="number"
                min={1}
                autoFocus
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent px-2 py-2.5 outline-none"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowOffer(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Send offer</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
