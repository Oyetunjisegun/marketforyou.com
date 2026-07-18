import type { Product, Seller } from "./types";
import { supabaseAnon } from "./supabase/anon";
import { mapProduct, mapSeller, PRODUCT_SELECT, type ProductRowFull } from "./supabase/map";

/**
 * Data-access layer, backed by Supabase (PostgreSQL).
 *
 * Reads use a session-less anon client (supabase/anon.ts); the catalog is
 * world-readable via Row Level Security, so these work in both Server and
 * Client Components. Filtering, sorting, and pagination are pushed down into
 * SQL rather than done in JS, so this scales past the demo dataset.
 *
 * The function signatures are unchanged from the original mock layer, so no
 * page or component needed to change when we swapped the data source.
 */

export interface ProductQuery {
  category?: string;
  q?: string;
  sort?: "relevance" | "price-asc" | "price-desc" | "newest" | "rating";
  minPrice?: number;
  maxPrice?: number;
  condition?: string[];
  freeShipping?: boolean;
  listingType?: string;
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getProducts(query: ProductQuery = {}): Promise<Paginated<Product>> {
  const {
    category,
    q,
    sort = "relevance",
    minPrice,
    maxPrice,
    condition,
    freeShipping,
    listingType,
    page = 1,
    pageSize = 24,
  } = query;

  let builder = supabaseAnon
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" });

  if (category) builder = builder.eq("category_slug", category);
  if (q) {
    // Match against title or description. tags/seller matching would need an
    // RPC or full-text index; title+description covers the common case.
    const needle = `%${q}%`;
    builder = builder.or(`title.ilike.${needle},description.ilike.${needle}`);
  }
  if (typeof minPrice === "number") builder = builder.gte("price", minPrice);
  if (typeof maxPrice === "number") builder = builder.lte("price", maxPrice);
  if (condition?.length) {
    builder = builder.in("condition", condition as Product["condition"][]);
  }
  if (freeShipping) builder = builder.eq("free_shipping", true);
  if (listingType) {
    builder = builder.eq("listing_type", listingType as Product["listingType"]);
  }

  switch (sort) {
    case "price-asc":
      builder = builder.order("price", { ascending: true });
      break;
    case "price-desc":
      builder = builder.order("price", { ascending: false });
      break;
    case "newest":
      builder = builder.order("created_at", { ascending: false });
      break;
    case "rating":
      builder = builder.order("rating", { ascending: false });
      break;
    default:
      // relevance: sponsored + featured float up, then rating.
      builder = builder
        .order("is_sponsored", { ascending: false })
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false });
  }

  const start = (page - 1) * pageSize;
  builder = builder.range(start, start + pageSize - 1);

  const { data, count, error } = await builder;
  if (error) throw error;

  return {
    items: (data as unknown as ProductRowFull[]).map(mapProduct),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabaseAnon
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data as unknown as ProductRowFull) : null;
}

/** Look up a product by id (UUID) or, failing that, by slug. Used by the editor. */
export async function getProductBySlugOrId(idOrSlug: string): Promise<Product | null> {
  const column = UUID_RE.test(idOrSlug) ? "id" : "slug";
  const { data, error } = await supabaseAnon
    .from("products")
    .select(PRODUCT_SELECT)
    .eq(column, idOrSlug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data as unknown as ProductRowFull) : null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await supabaseAnon
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_featured", true)
    .limit(limit);
  if (error) throw error;
  return (data as unknown as ProductRowFull[]).map(mapProduct);
}

export async function getSponsoredProducts(limit = 4): Promise<Product[]> {
  const { data, error } = await supabaseAnon
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_sponsored", true)
    .limit(limit);
  if (error) throw error;
  return (data as unknown as ProductRowFull[]).map(mapProduct);
}

export async function getTrendingProducts(limit = 12): Promise<Product[]> {
  const { data, error } = await supabaseAnon
    .from("products")
    .select(PRODUCT_SELECT)
    .order("rating_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as unknown as ProductRowFull[]).map(mapProduct);
}

export async function getDeals(limit = 8): Promise<Product[]> {
  // Products with a real discount. We over-fetch rows that have an
  // original_price, then rank by discount ratio in JS (Supabase can't order by
  // a computed expression without an RPC) and take the top `limit`.
  const { data, error } = await supabaseAnon
    .from("products")
    .select(PRODUCT_SELECT)
    .not("original_price", "is", null)
    .limit(200);
  if (error) throw error;
  return (data as unknown as ProductRowFull[])
    .map(mapProduct)
    .filter((p) => p.originalPrice && p.originalPrice > p.price)
    .sort(
      (a, b) =>
        (b.originalPrice! - b.price) / b.originalPrice! -
        (a.originalPrice! - a.price) / a.originalPrice!,
    )
    .slice(0, limit);
}

/** "Similar products" — same category, excluding the current item. */
export async function getRelatedProducts(product: Product, limit = 6): Promise<Product[]> {
  const { data, error } = await supabaseAnon
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("category_slug", product.categorySlug)
    .neq("id", product.id)
    .limit(limit);
  if (error) throw error;
  return (data as unknown as ProductRowFull[]).map(mapProduct);
}

export async function getFeaturedSellers(limit = 6): Promise<Seller[]> {
  const { data, error } = await supabaseAnon
    .from("sellers")
    .select("*")
    .eq("is_featured", true)
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapSeller);
}

export async function getSellerByHandle(handle: string): Promise<Seller | null> {
  const { data, error } = await supabaseAnon
    .from("sellers")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSeller(data) : null;
}

export async function getProductsBySeller(handle: string): Promise<Product[]> {
  // Resolve the seller id first, then its products.
  const { data: seller, error: sErr } = await supabaseAnon
    .from("sellers")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (sErr) throw sErr;
  if (!seller) return [];

  const { data, error } = await supabaseAnon
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("seller_id", seller.id);
  if (error) throw error;
  return (data as unknown as ProductRowFull[]).map(mapProduct);
}

/**
 * Lightweight search-suggestion endpoint: prefix/contains match over titles.
 * (AI/Meilisearch autocomplete can replace this later.)
 */
export async function getSearchSuggestions(q: string, limit = 6): Promise<string[]> {
  if (!q.trim()) return [];
  const { data, error } = await supabaseAnon
    .from("products")
    .select("title")
    .ilike("title", `%${q}%`)
    .limit(limit);
  if (error) throw error;
  const set = new Set<string>((data ?? []).map((r) => r.title));
  return Array.from(set).slice(0, limit);
}

/** Resolve a list of product ids (used by the wishlist), preserving order. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  // Product ids are UUIDs. Drop anything that isn't (e.g. stale localStorage
  // entries from the old mock data) so the query can't error on a bad id.
  const valid = ids.filter((id) => UUID_RE.test(id));
  if (!valid.length) return [];
  const { data, error } = await supabaseAnon
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", valid);
  if (error) throw error;
  const products = (data as unknown as ProductRowFull[]).map(mapProduct);
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
}

/**
 * AI-assisted listing copy. Seam for a Claude-backed endpoint
 * (POST /api/v1/ai/listing-copy). Still a deterministic mock — no DB involved.
 */
export async function generateListingCopy(title: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 700));
  const clean = title.trim() || "this item";
  return [
    `${clean} in excellent condition, ready to ship.`,
    "",
    "Highlights:",
    "• Carefully inspected and fully functional",
    "• Ships fast with tracking and buyer protection",
    "• Backed by our 30-day returns policy",
    "",
    "Have a question? Message the seller anytime before you buy.",
  ].join("\n");
}
