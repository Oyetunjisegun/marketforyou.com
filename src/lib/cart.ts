import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";
import type { CartLine } from "./types";
import { PRODUCT_SELECT, mapProduct, type ProductRowFull } from "./supabase/map";

/**
 * Database-backed cart. Rows live in cart_items (owner-scoped by RLS). We map
 * them into the same CartLine shape the UI already uses, joining the product so
 * we always show the current price/title/image rather than a stale snapshot.
 */

type Client = SupabaseClient<Database>;

/** Stable key for a variant selection, so the same product in two variants
 *  is two cart lines. Order-independent (keys sorted). */
export function variantKey(variant?: Record<string, string>): string {
  if (!variant) return "";
  const keys = Object.keys(variant).sort();
  if (!keys.length) return "";
  return keys.map((k) => `${k}:${variant[k]}`).join("|");
}

type CartRow = {
  product_id: string;
  quantity: number;
  variant: Record<string, string> | null;
  products: ProductRowFull | null;
};

function toLine(row: CartRow): CartLine | null {
  if (!row.products) return null;
  const product = mapProduct(row.products);
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    imageUrl: product.images[0]?.url ?? "",
    unitPrice: product.price,
    currency: product.currency,
    quantity: row.quantity,
    sellerHandle: product.seller.handle,
    variant: row.variant ?? undefined,
  };
}

/** Load the user's cart, joined with live product data. */
export async function fetchCart(supabase: Client, userId: string): Promise<CartLine[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select(`product_id, quantity, variant, products(${PRODUCT_SELECT})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as CartRow[])
    .map(toLine)
    .filter((l): l is CartLine => l !== null);
}

/** Add (or increment) a line. */
export async function addCartItem(
  supabase: Client,
  userId: string,
  productId: string,
  quantity: number,
  variant?: Record<string, string>,
): Promise<void> {
  const key = variantKey(variant);
  // Read current qty (if any), then upsert the sum. Two round-trips, but keeps
  // the unique(user, product, variant_key) constraint authoritative.
  const { data: existing } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("variant_key", key)
    .maybeSingle();

  const nextQty = (existing?.quantity ?? 0) + quantity;
  const { error } = await supabase.from("cart_items").upsert(
    {
      user_id: userId,
      product_id: productId,
      quantity: nextQty,
      variant: variant ?? null,
      variant_key: key,
    },
    { onConflict: "user_id,product_id,variant_key" },
  );
  if (error) throw error;
}

/** Set an absolute quantity for a product line (any variant of that product). */
export async function setCartQuantity(
  supabase: Client,
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  if (quantity <= 0) {
    await removeCartItem(supabase, userId, productId);
    return;
  }
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("user_id", userId)
    .eq("product_id", productId);
  if (error) throw error;
}

/** Remove all lines for a product. */
export async function removeCartItem(
  supabase: Client,
  userId: string,
  productId: string,
): Promise<void> {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
  if (error) throw error;
}

/** Empty the cart. */
export async function clearCart(supabase: Client, userId: string): Promise<void> {
  const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
  if (error) throw error;
}

/** Merge guest (localStorage) lines into the DB cart on login. */
export async function mergeGuestCart(
  supabase: Client,
  userId: string,
  guestLines: CartLine[],
): Promise<void> {
  for (const line of guestLines) {
    await addCartItem(supabase, userId, line.productId, line.quantity, line.variant);
  }
}
