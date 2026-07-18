import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { fetchCart } from "@/lib/cart";
import { initPayment, flutterwaveConfigured } from "@/lib/flutterwave";
import { usdToNgn, CHARGE_CURRENCY } from "@/lib/money";
import { SITE_URL } from "@/lib/site";

/**
 * POST /api/checkout
 * Creates a pending order from the signed-in user's DB cart, then initializes a
 * Flutterwave transaction and returns the hosted payment link.
 *
 * Totals are computed server-side from live product prices — the client body
 * only supplies the shipping details, never amounts.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to check out." }, { status: 401 });
  }

  if (!flutterwaveConfigured()) {
    return NextResponse.json(
      { error: "Payments aren't configured. Set FLW_SECRET_KEY to enable checkout." },
      { status: 503 },
    );
  }

  let body: {
    shipping?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      zip?: string;
    };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const shipping = body.shipping ?? {};
  const email = shipping.email?.trim() || user.email || "";
  if (!email) {
    return NextResponse.json({ error: "An email is required for payment." }, { status: 400 });
  }

  // Authoritative cart, joined with live product data.
  const lines = await fetchCart(supabase, user.id);
  if (!lines.length) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Totals in USD (the catalog/display currency). Same formula as the UI.
  const subtotal = +lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0).toFixed(2);
  const shippingFee = subtotal > 0 && subtotal < 50 ? 4.99 : 0;
  const fees = +(subtotal * 0.03).toFixed(2);
  const total = +(subtotal + shippingFee + fees).toFixed(2);

  // Resolve seller_id for each line so seller dashboards can see their orders.
  const productIds = lines.map((l) => l.productId);
  const { data: prodRows, error: prodErr } = await supabase
    .from("products")
    .select("id, seller_id")
    .in("id", productIds);
  if (prodErr) {
    return NextResponse.json({ error: "Could not read cart products." }, { status: 500 });
  }
  const sellerByProduct = new Map((prodRows ?? []).map((r) => [r.id, r.seller_id]));

  // Create the order (pending) + items.
  const addressParts = [shipping.address, shipping.city, shipping.zip].filter(Boolean);
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      status: "pending",
      currency: "USD",
      subtotal,
      total,
      shipping_name: shipping.name ?? null,
      shipping_email: email,
      shipping_phone: shipping.phone ?? null,
      shipping_addr: addressParts.join(", ") || null,
    })
    .select("id")
    .single();
  if (orderErr || !order) {
    return NextResponse.json({ error: "Could not create your order." }, { status: 500 });
  }

  const itemRows = lines.map((l) => ({
    order_id: order.id,
    product_id: l.productId,
    seller_id: sellerByProduct.get(l.productId) ?? null,
    title: l.title,
    unit_price: l.unitPrice,
    quantity: l.quantity,
    variant: l.variant ?? null,
  }));
  const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
  if (itemsErr) {
    // Roll back the empty order so we don't leave orphans. Use admin client
    // since the buyer has no delete policy on orders.
    await createAdminClient().from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "Could not create your order items." }, { status: 500 });
  }

  // Initialize payment in NGN (converted from the USD total).
  try {
    const { paymentLink } = await initPayment({
      txRef: order.id,
      amount: usdToNgn(total),
      currency: CHARGE_CURRENCY,
      redirectUrl: `${SITE_URL}/checkout/callback`,
      customer: {
        email,
        name: shipping.name || undefined,
        phonenumber: shipping.phone || undefined,
      },
      meta: { order_id: order.id, buyer_id: user.id },
    });
    return NextResponse.json({ paymentLink, orderId: order.id });
  } catch (e) {
    await createAdminClient()
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Payment init failed." },
      { status: 502 },
    );
  }
}
