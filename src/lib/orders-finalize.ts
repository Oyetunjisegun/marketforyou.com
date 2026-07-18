import { createAdminClient } from "./supabase/server";
import { verifyTransaction } from "./flutterwave";
import { usdToNgn } from "./money";

/**
 * Finalize an order after a Flutterwave transaction. Verifies the transaction
 * with Flutterwave (server-to-server, so a spoofed callback can't mark an order
 * paid), checks the amount matches, then marks the order paid and commits stock
 * exactly once. Idempotent — safe to call from both the webhook and the
 * buyer-facing callback.
 *
 * Uses the service-role client because this runs without a user session
 * (webhook) and needs to write across the order regardless of RLS.
 */
export interface FinalizeResult {
  ok: boolean;
  status: "paid" | "already-paid" | "failed" | "mismatch" | "not-found";
}

export async function finalizeOrder(
  transactionId: string | number,
  expectedTxRef?: string,
): Promise<FinalizeResult> {
  const admin = createAdminClient();

  const tx = await verifyTransaction(transactionId);
  if (expectedTxRef && tx.txRef !== expectedTxRef) {
    return { ok: false, status: "mismatch" };
  }

  const orderId = tx.txRef; // we set tx_ref = order.id at init
  const { data: order, error } = await admin
    .from("orders")
    .select("id, status, total")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) return { ok: false, status: "not-found" };

  if (order.status === "paid" || order.status === "shipped" || order.status === "delivered") {
    return { ok: true, status: "already-paid" };
  }

  if (tx.status !== "successful") {
    return { ok: false, status: "failed" };
  }

  // Guard against a short-payment: the charged NGN must cover the order total.
  const expectedNgn = usdToNgn(Number(order.total));
  if (tx.amount + 1 < expectedNgn) {
    // (+1 naira tolerance for rounding)
    return { ok: false, status: "mismatch" };
  }

  const { error: updErr } = await admin
    .from("orders")
    .update({ status: "paid", payment_ref: String(tx.id) })
    .eq("id", orderId);
  if (updErr) return { ok: false, status: "failed" };

  // Decrement stock once (idempotent via orders.stock_committed).
  await admin.rpc("commit_order_stock", { p_order_id: orderId });

  // Clear the buyer's cart now that the order is paid.
  if (order.id) {
    const { data: full } = await admin
      .from("orders")
      .select("buyer_id")
      .eq("id", orderId)
      .maybeSingle();
    if (full?.buyer_id) {
      await admin.from("cart_items").delete().eq("user_id", full.buyer_id);
    }
  }

  return { ok: true, status: "paid" };
}
