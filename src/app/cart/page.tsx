"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ShieldCheck, ArrowRight } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { lines, subtotal, setQuantity, remove, count } = useCart();

  const shipping = subtotal > 0 && subtotal < 50 ? 4.99 : 0;
  const fees = +(subtotal * 0.03).toFixed(2); // buyer service fee (revenue seam)
  const total = +(subtotal + shipping + fees).toFixed(2);

  if (lines.length === 0) {
    return (
      <div className="mx-auto grid max-w-md place-items-center px-4 py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-muted" />
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-1 text-muted">Browse the marketplace and add something you love.</p>
        <Link href="/search" className="mt-6">
          <Button size="lg">Start shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Shopping cart ({count})</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {lines.map((l) => (
            <li key={l.productId} className="flex gap-4 rounded-xl border border-border bg-surface p-3">
              <Link
                href={`/product/${l.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-2"
              >
                {l.imageUrl && <Image src={l.imageUrl} alt={l.title} fill sizes="96px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/product/${l.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary">
                  {l.title}
                </Link>
                {l.variant && (
                  <p className="mt-0.5 text-xs text-muted">
                    {Object.entries(l.variant).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-muted">Sold by @{l.sellerHandle}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      className="grid h-8 w-8 place-items-center text-muted hover:text-foreground"
                      onClick={() => setQuantity(l.productId, l.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{l.quantity}</span>
                    <button
                      className="grid h-8 w-8 place-items-center text-muted hover:text-foreground"
                      onClick={() => setQuantity(l.productId, l.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-semibold">{formatPrice(l.unitPrice * l.quantity, l.currency)}</span>
                  <button
                    onClick={() => remove(l.productId)}
                    className="grid h-8 w-8 place-items-center text-muted hover:text-danger"
                    aria-label={`Remove ${l.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* summary */}
        <aside className="h-fit space-y-4 rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-28">
          <h2 className="font-semibold">Order summary</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotal, "USD")} />
            <Row label="Shipping" value={shipping === 0 ? "Free" : formatPrice(shipping, "USD")} />
            <Row label="Service fee" value={formatPrice(fees, "USD")} />
            <div className="border-t border-border pt-2">
              <Row label="Total" value={formatPrice(total, "USD")} bold />
            </div>
          </dl>
          <Link href="/checkout">
            <Button size="lg" className="w-full">
              Checkout <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-success" /> Protected by escrow payments
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : "text-muted"}`}>
      <dt>{label}</dt>
      <dd className={bold ? "text-foreground" : "text-foreground"}>{value}</dd>
    </div>
  );
}
