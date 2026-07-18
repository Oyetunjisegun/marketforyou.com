import type { Product, Seller } from "./types";
import { PRODUCTS, SELLERS } from "./mock-data";

/**
 * Data-access layer. Today it reads from the in-memory mock dataset; when the
 * NestJS backend is live, replace each function body with a `fetch()` to the
 * corresponding REST endpoint (see docs/ARCHITECTURE.md). The signatures are
 * intentionally async so callers don't change.
 *
 * e.g. getProductBySlug -> GET /api/v1/products/:slug
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

  let items = PRODUCTS.slice();

  if (category) items = items.filter((p) => p.categorySlug === category);
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle) ||
        p.tags.some((t) => t.toLowerCase().includes(needle)) ||
        p.seller.displayName.toLowerCase().includes(needle),
    );
  }
  if (typeof minPrice === "number") items = items.filter((p) => p.price >= minPrice);
  if (typeof maxPrice === "number") items = items.filter((p) => p.price <= maxPrice);
  if (condition?.length) items = items.filter((p) => condition.includes(p.condition));
  if (freeShipping) items = items.filter((p) => p.freeShipping);
  if (listingType) items = items.filter((p) => p.listingType === listingType);

  switch (sort) {
    case "price-asc":
      items.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      items.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      break;
    case "rating":
      items.sort((a, b) => b.rating - a.rating);
      break;
    default:
      // relevance: sponsored + featured float up
      items.sort(
        (a, b) =>
          Number(b.isSponsored) - Number(a.isSponsored) ||
          Number(b.isFeatured) - Number(a.isFeatured) ||
          b.rating - a.rating,
      );
  }

  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.isFeatured).slice(0, limit);
}

export async function getSponsoredProducts(limit = 4): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.isSponsored).slice(0, limit);
}

export async function getTrendingProducts(limit = 12): Promise<Product[]> {
  return PRODUCTS.slice()
    .sort((a, b) => b.ratingCount - a.ratingCount)
    .slice(0, limit);
}

export async function getDeals(limit = 8): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.originalPrice && p.originalPrice > p.price)
    .sort(
      (a, b) =>
        (b.originalPrice! - b.price) / b.originalPrice! -
        (a.originalPrice! - a.price) / a.originalPrice!,
    )
    .slice(0, limit);
}

/** "Similar products" — same category, excluding the current item. */
export async function getRelatedProducts(product: Product, limit = 6): Promise<Product[]> {
  return PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id,
  ).slice(0, limit);
}

export async function getFeaturedSellers(limit = 6): Promise<Seller[]> {
  return SELLERS.filter((s) => s.isFeatured).slice(0, limit);
}

export async function getSellerByHandle(handle: string): Promise<Seller | null> {
  return SELLERS.find((s) => s.handle === handle) ?? null;
}

export async function getProductsBySeller(handle: string): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.seller.handle === handle);
}

/**
 * Lightweight search-suggestion endpoint. In production this is where the
 * AI-powered / Meilisearch autocomplete lands (see docs). For now it does a
 * prefix/contains match over titles, categories, and sellers.
 */
export async function getSearchSuggestions(q: string, limit = 6): Promise<string[]> {
  if (!q.trim()) return [];
  const needle = q.toLowerCase();
  const set = new Set<string>();
  for (const p of PRODUCTS) {
    if (p.title.toLowerCase().includes(needle)) set.add(p.title);
    if (set.size >= limit) break;
  }
  return Array.from(set).slice(0, limit);
}

/** Resolve a list of product ids (used by the wishlist), preserving order. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
}

/**
 * AI-assisted listing copy. Seam for a Claude-backed endpoint
 * (POST /api/v1/ai/listing-copy) that turns a title into an SEO description.
 * The mock returns deterministic, templated copy so the UX is demonstrable.
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
