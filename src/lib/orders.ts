import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";
import type { Currency, FulfillmentStatus, OrderStatus } from "./types";

/**
 * Order reads for buyers and sellers. RLS decides visibility:
 *   - buyers see their own orders (orders_select_own)
 *   - sellers see orders containing their line items (orders_select_seller)
 * so the same queries serve both roles without extra guards here.
 */

type Client = SupabaseClient<Database>;

export interface OrderItemView {
  id: string;
  productId: string | null;
  title: string;
  unitPrice: number;
  quantity: number;
  variant: Record<string, string> | null;
  fulfillment: FulfillmentStatus;
  sellerId: string | null;
}

export interface OrderView {
  id: string;
  status: OrderStatus;
  currency: Currency;
  subtotal: number;
  total: number;
  createdAt: string;
  shippingName: string | null;
  shippingAddr: string | null;
  items: OrderItemView[];
}

type OrderRow = {
  id: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  total: number;
  created_at: string;
  shipping_name: string | null;
  shipping_addr: string | null;
  order_items: {
    id: string;
    product_id: string | null;
    title: string;
    unit_price: number;
    quantity: number;
    variant: Record<string, string> | null;
    fulfillment: FulfillmentStatus;
    seller_id: string | null;
  }[];
};

const ORDER_SELECT = `
  id, status, currency, subtotal, total, created_at, shipping_name, shipping_addr,
  order_items ( id, product_id, title, unit_price, quantity, variant, fulfillment, seller_id )
`;

function mapOrder(row: OrderRow): OrderView {
  return {
    id: row.id,
    status: row.status,
    currency: row.currency as Currency,
    subtotal: row.subtotal,
    total: row.total,
    createdAt: row.created_at,
    shippingName: row.shipping_name,
    shippingAddr: row.shipping_addr,
    items: (row.order_items ?? []).map((i) => ({
      id: i.id,
      productId: i.product_id,
      title: i.title,
      unitPrice: i.unit_price,
      quantity: i.quantity,
      variant: i.variant,
      fulfillment: i.fulfillment,
      sellerId: i.seller_id,
    })),
  };
}

/** The signed-in buyer's orders, newest first. */
export async function getMyOrders(supabase: Client, userId: string): Promise<OrderView[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as OrderRow[]).map(mapOrder);
}

/**
 * Orders that contain at least one of this seller's line items. We only surface
 * paid+ orders (a seller shouldn't act on unpaid/pending carts). Each returned
 * order's items are filtered to just the seller's own lines.
 */
export async function getSellerOrders(
  supabase: Client,
  sellerId: string,
): Promise<OrderView[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .neq("status", "pending")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as OrderRow[])
    .map(mapOrder)
    .map((o) => ({ ...o, items: o.items.filter((i) => i.sellerId === sellerId) }))
    .filter((o) => o.items.length > 0);
}

/** Seller marks one of their line items shipped/delivered. RLS pins ownership. */
export async function setLineFulfillment(
  supabase: Client,
  orderItemId: string,
  fulfillment: FulfillmentStatus,
): Promise<void> {
  const { error } = await supabase
    .from("order_items")
    .update({ fulfillment })
    .eq("id", orderItemId);
  if (error) throw error;
}
