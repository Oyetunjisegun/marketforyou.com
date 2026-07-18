import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { finalizeOrder } from "@/lib/orders-finalize";
import { Button } from "@/components/ui/button";

/**
 * Flutterwave redirects the buyer here after payment with ?status, ?tx_ref and
 * ?transaction_id. We finalize server-side (verifying with Flutterwave) so the
 * confirmation reflects the real transaction state, not the URL the browser
 * arrived with. The webhook is the source of truth; this is the friendly
 * confirmation and a fallback in case the webhook is delayed.
 */
export default async function CheckoutCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const txRef = typeof params.tx_ref === "string" ? params.tx_ref : undefined;
  const txId =
    typeof params.transaction_id === "string" ? params.transaction_id : undefined;

  let outcome: "paid" | "pending" | "failed" = "failed";

  if (status === "cancelled") {
    outcome = "failed";
  } else if (txId) {
    try {
      const result = await finalizeOrder(txId, txRef);
      outcome =
        result.status === "paid" || result.status === "already-paid"
          ? "paid"
          : result.status === "failed" || result.status === "mismatch"
            ? "failed"
            : "pending";
    } catch {
      outcome = "pending";
    }
  }

  const view = {
    paid: {
      icon: <CheckCircle2 className="h-12 w-12 text-success" />,
      title: "Payment successful",
      body: "Thanks for your order. We've emailed your receipt and notified the seller.",
    },
    pending: {
      icon: <Clock className="h-12 w-12 text-warning" />,
      title: "Payment processing",
      body: "Your payment is being confirmed. We'll update your order as soon as it clears.",
    },
    failed: {
      icon: <XCircle className="h-12 w-12 text-danger" />,
      title: "Payment not completed",
      body: "Your payment didn't go through. Your cart is still saved — you can try again.",
    },
  }[outcome];

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      {view.icon}
      <h1 className="mt-4 text-2xl font-bold">{view.title}</h1>
      <p className="mt-2 text-muted">{view.body}</p>
      <div className="mt-8 flex gap-3">
        {outcome === "paid" ? (
          <Link href="/account/orders">
            <Button size="lg">View your orders</Button>
          </Link>
        ) : (
          <Link href="/cart">
            <Button size="lg">Back to cart</Button>
          </Link>
        )}
        <Link href="/">
          <Button variant="outline" size="lg">Continue shopping</Button>
        </Link>
      </div>
    </div>
  );
}
