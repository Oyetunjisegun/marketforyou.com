import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";
import type { Product } from "./types";
import { mapProduct, PRODUCT_SELECT, type ProductRowFull } from "./supabase/map";

/**
 * Seller-side data access. Every call here goes through an authenticated
 * Supabase client (browser or server), so Row Level Security enforces that a
 * seller can only touch their own store and products. Nothing here trusts the
 * caller — the database policies are the real guard.
 */

type Client = SupabaseClient<Database>;

export interface SellerStore {
  id: string;
  handle: string;
  displayName: string;
}

/** The seller row owned by the current user, or null if they haven't opened a store. */
export async function getMyStore(supabase: Client): Promise<SellerStore | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("sellers")
    .select("id, handle, display_name")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data
    ? { id: data.id, handle: data.handle, displayName: data.display_name }
    : null;
}

/** Open a store + promote the user to 'seller' via the become_seller() RPC. */
export async function becomeSeller(
  supabase: Client,
  input: { handle: string; displayName: string; bio?: string; location?: string },
): Promise<SellerStore> {
  const { data, error } = await supabase.rpc("become_seller", {
    p_handle: input.handle,
    p_display_name: input.displayName,
    p_bio: input.bio ?? null,
    p_location: input.location ?? null,
  });
  if (error) throw error;
  return { id: data.id, handle: data.handle, displayName: data.display_name };
}

/** All products owned by the current seller (newest first). */
export async function getMyProducts(supabase: Client, sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as ProductRowFull[]).map(mapProduct);
}

export interface ProductInput {
  title: string;
  description: string;
  categorySlug: string;
  condition: Database["public"]["Tables"]["products"]["Row"]["condition"];
  listingType: Database["public"]["Tables"]["products"]["Row"]["listing_type"];
  price: number;
  originalPrice?: number | null;
  stock: number;
  freeShipping: boolean;
  location?: string;
  /** Storage public URLs, in display order. */
  images: string[];
}

/** URL-safe slug with a short random suffix to avoid collisions. */
function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "item"}-${suffix}`;
}

/** Create a product owned by `sellerId`, plus its image rows. Returns the id. */
export async function createProduct(
  supabase: Client,
  sellerId: string,
  input: ProductInput,
): Promise<string> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      slug: slugify(input.title),
      title: input.title,
      description: input.description,
      category_slug: input.categorySlug,
      kind: "physical",
      listing_type: input.listingType,
      condition: input.condition,
      currency: "USD",
      price: input.price,
      original_price: input.originalPrice ?? null,
      stock: input.stock,
      seller_id: sellerId,
      free_shipping: input.freeShipping,
      location: input.location ?? null,
      tags: [],
      specs: {},
    })
    .select("id")
    .single();
  if (error) throw error;

  await replaceProductImages(supabase, data.id, input.images);
  return data.id;
}

/** Update an existing product (RLS ensures it's the caller's) and its images. */
export async function updateProduct(
  supabase: Client,
  productId: string,
  input: ProductInput,
): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({
      title: input.title,
      description: input.description,
      category_slug: input.categorySlug,
      listing_type: input.listingType,
      condition: input.condition,
      price: input.price,
      original_price: input.originalPrice ?? null,
      stock: input.stock,
      free_shipping: input.freeShipping,
      location: input.location ?? null,
    })
    .eq("id", productId);
  if (error) throw error;

  await replaceProductImages(supabase, productId, input.images);
}

/** Delete a product (cascades to its images/cart rows via FK). */
export async function deleteProduct(supabase: Client, productId: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;
}

/** Replace the image set for a product: wipe existing rows, insert the new order. */
async function replaceProductImages(
  supabase: Client,
  productId: string,
  urls: string[],
): Promise<void> {
  const { error: delErr } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);
  if (delErr) throw delErr;

  if (!urls.length) return;
  const rows = urls.map((url, i) => ({
    product_id: productId,
    url,
    alt: null,
    spin: false,
    position: i,
  }));
  const { error: insErr } = await supabase.from("product_images").insert(rows);
  if (insErr) throw insErr;
}
