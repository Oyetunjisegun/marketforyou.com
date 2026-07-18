import { NextResponse } from "next/server";
import { finalizeOrder } from "@/lib/orders-finalize";

/**
 * POST /api/payments/flutterwave/webhook
 * Flutterwave calls this on transaction events. We authenticate the call via
 * the "verif-hash" header (which must equal the secret hash configured in the
 * Flutterwave dashboard and stored as FLW_SECRET_HASH), then re-verify the
 * transaction server-side before marking the order paid.
 */
export async function POST(req: Request) {
  const expected = process.env.FLW_SECRET_HASH;
  const signature = req.headers.get("verif-hash");

  // If a secret hash is configured, require it to match. (Without one set, we
  // reject — refusing to trust an unauthenticated webhook.)
  if (!expected || signature !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    data?: { id?: number | string; tx_ref?: string; status?: string };
    event?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const txId = payload.data?.id;
  const txRef = payload.data?.tx_ref;
  if (!txId) {
    // Nothing actionable; acknowledge so Flutterwave doesn't retry forever.
    return NextResponse.json({ received: true });
  }

  try {
    const result = await finalizeOrder(txId, txRef);
    return NextResponse.json({ received: true, status: result.status });
  } catch {
    // Return 200 so Flutterwave stops retrying a permanently-bad event, but log
    // would go here in production.
    return NextResponse.json({ received: true, status: "error" });
  }
}
