"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Wallet, Landmark, Lock, CheckCircle2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

const PROVIDERS = [
  { id: "stripe", label: "Card", desc: "Visa, Mastercard, Amex via Stripe", icon: CreditCard },
  { id: "paypal", label: "PayPal", desc: "Pay with your PayPal balance", icon: Wallet },
  { id: "paystack", label: "Paystack", desc: "Cards & bank transfer (Africa)", icon: Landmark },
  { id: "flutterwave", label: "Flutterwave", desc: "Mobile money & more", icon: Wallet },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, clear } = useCart();
  const [provider, setProvider] = useState("stripe");
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);

  const shipping = subtotal > 0 && subtotal < 50 ? 4.99 : 0;
  const fees = +(subtotal * 0.03).toFixed(2);
  const total = +(subtotal + shipping + fees).toFixed(2);

  function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setPlacing(true);
    // Seam: POST /api/v1/orders then redirect to the chosen provider's hosted
    // checkout (Stripe Session / PayPal order / Paystack init). Mocked here.
    setTimeout(() => {
      clear();
      setPlacing(false);
      setDone(true);
    }, 1200);
  }

  if (done) {
    return (
      <div className="mx-auto grid max-w-md place-items-center px-4 py-24 text-center">
        <CheckCircle2 className="h-16 w-16 text-success" />
        <h1 className="mt-4 text-2xl font-bold">Order confirmed</h1>
        <p className="mt-1 text-muted">
          Thanks for your purchase. A confirmation has been sent to your email, and
          your funds are held in escrow until delivery is confirmed.
        </p>
        <Button size="lg" className="mt-6" onClick={() => router.push("/")}>
          Continue shopping
        </Button>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <Button size="lg" className="mt-6" onClick={() => router.push("/search")}>
          Browse products
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={placeOrder} className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {/* shipping address */}
          <section className="space-y-3">
            <h2 className="font-semibold">Shipping address</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" name="name" autoComplete="name" required />
              <Field label="Phone" name="phone" type="tel" autoComplete="tel" required />
              <Field label="Address" name="address" autoComplete="street-address" className="sm:col-span-2" required />
              <Field label="City" name="city" autoComplete="address-level2" required />
              <Field label="Postal code" name="zip" autoComplete="postal-code" required />
            </div>
          </section>

          {/* payment */}
          <section className="space-y-3">
            <h2 className="font-semibold">Payment method</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROVIDERS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      provider === p.id ? "border-primary bg-primary/5" : "border-border hover:border-muted",
                    )}
                  >
                    <Icon className="mt-0.5 h-5 w-5 text-primary" />
                    <span>
                      <span className="block text-sm font-medium">{p.label}</span>
                      <span className="block text-xs text-muted">{p.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted">
              You&apos;ll be redirected to {PROVIDERS.find((p) => p.id === provider)?.label} to
              complete payment securely. We never store your card details.
            </p>
          </section>
        </div>

        {/* summary */}
        <aside className="h-fit space-y-4 rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-28">
          <h2 className="font-semibold">Order summary</h2>
          <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
            {lines.map((l) => (
              <li key={l.productId} className="flex justify-between gap-2 text-muted">
                <span className="truncate">{l.quantity}× {l.title}</span>
                <span className="shrink-0 text-foreground">{formatPrice(l.unitPrice * l.quantity, l.currency)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd className="text-foreground">{formatPrice(subtotal, "USD")}</dd></div>
            <div className="flex justify-between text-muted"><dt>Shipping</dt><dd className="text-foreground">{shipping === 0 ? "Free" : formatPrice(shipping, "USD")}</dd></div>
            <div className="flex justify-between text-muted"><dt>Service fee</dt><dd className="text-foreground">{formatPrice(fees, "USD")}</dd></div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>Total</dt><dd>{formatPrice(total, "USD")}</dd></div>
          </dl>
          <Button type="submit" size="lg" className="w-full" disabled={placing}>
            <Lock className="h-4 w-4" /> {placing ? "Processing…" : `Pay ${formatPrice(total, "USD")}`}
          </Button>
        </aside>
      </div>
    </form>
  );
}

function Field({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
