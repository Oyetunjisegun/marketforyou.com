"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Wallet } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { usdToNgn } from "@/lib/money";
import { cn } from "@/lib/cn";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = subtotal > 0 && subtotal < 50 ? 4.99 : 0;
  const fees = +(subtotal * 0.03).toFixed(2);
  const total = +(subtotal + shipping + fees).toFixed(2);
  const totalNgn = usdToNgn(total);

  async function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!user) {
      router.push("/login?next=/checkout");
      return;
    }

    const form = new FormData(e.currentTarget);
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping: {
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone"),
            address: form.get("address"),
            city: form.get("city"),
            zip: form.get("zip"),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      // Hand off to Flutterwave's hosted checkout.
      window.location.href = data.paymentLink;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setPlacing(false);
    }
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
              <Field
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={user?.email ?? ""}
                required
              />
              <Field label="Phone" name="phone" type="tel" autoComplete="tel" required />
              <Field label="Address" name="address" autoComplete="street-address" className="sm:col-span-2" required />
              <Field label="City" name="city" autoComplete="address-level2" required />
              <Field label="Postal code" name="zip" autoComplete="postal-code" required />
            </div>
          </section>

          {/* payment */}
          <section className="space-y-3">
            <h2 className="font-semibold">Payment method</h2>
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border border-primary bg-primary/5 p-3",
              )}
            >
              <Wallet className="mt-0.5 h-5 w-5 text-primary" />
              <span>
                <span className="block text-sm font-medium">Flutterwave</span>
                <span className="block text-xs text-muted">
                  Cards, bank transfer, USSD & mobile money
                </span>
              </span>
            </div>
            <p className="text-xs text-muted">
              You&apos;ll be redirected to Flutterwave to complete payment securely. We never
              store your card details.
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
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
            You&apos;ll be charged {formatPrice(totalNgn, "NGN")} at today&apos;s rate.
          </p>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={placing || authLoading}>
            <Lock className="h-4 w-4" />{" "}
            {placing ? "Redirecting…" : user ? `Pay ${formatPrice(total, "USD")}` : "Sign in to pay"}
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
