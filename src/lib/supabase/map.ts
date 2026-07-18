import type { Product, Seller, Review, SellerBadge } from "../types";
import type { Database } from "./types";

type SellerRow = Database["public"]["Tables"]["sellers"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

/**
 * Mappers: turn Supabase rows (snake_case, flat) into the domain types the UI
 * expects (camelCase, nested). This is the seam that lets api.ts swap its data
 * source without any page or component changing.
 */

/** Rebuild seller badges from stored flags (they weren't persisted as a table). */
function badgesFor(row: SellerRow): SellerBadge[] {
  const badges: SellerBadge[] = [
    row.is_verified
      ? { label: "Verified", kind: "verified" }
      : { label: "New Seller", kind: "new" },
  ];
  if ((row.rating ?? 0) >= 4.8) badges.push({ label: "Top Rated", kind: "top-rated" });
  return badges;
}

export function mapSeller(row: SellerRow): Seller {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    location: row.location ?? "",
    rating: Number(row.rating ?? 0),
    ratingCount: row.rating_count ?? 0,
    responseRate: row.response_rate ?? 100,
    joinedAt: row.joined_at,
    isVerified: row.is_verified,
    isFeatured: row.is_featured,
    badges: badgesFor(row),
    totalSales: row.total_sales ?? 0,
  };
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    author: row.author_name,
    avatarUrl: row.avatar_url ?? undefined,
    rating: row.rating,
    title: row.title ?? undefined,
    body: row.body,
    createdAt: row.created_at,
    verifiedPurchase: row.verified_purchase ?? false,
    helpfulCount: row.helpful_count ?? 0,
  };
}

/** A product row joined with its seller, images, and reviews. */
export type ProductRowFull = ProductRow & {
  sellers: SellerRow | null;
  product_images: ImageRow[] | null;
  reviews: ReviewRow[] | null;
};

export function mapProduct(row: ProductRowFull): Product {
  const images = (row.product_images ?? [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((img) => ({ url: img.url, alt: img.alt ?? "", spin: img.spin ?? false }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    categorySlug: row.category_slug ?? "",
    kind: row.kind,
    listingType: row.listing_type,
    condition: row.condition,
    currency: row.currency as Product["currency"],
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    auction: row.auction ?? undefined,
    images: images.length ? images : [{ url: "", alt: row.title }],
    videoUrl: row.video_url ?? undefined,
    specs: row.specs ?? {},
    variants: row.variants ?? undefined,
    stock: row.stock,
    seller: row.sellers ? mapSeller(row.sellers) : PLACEHOLDER_SELLER,
    rating: Number(row.rating ?? 0),
    ratingCount: row.rating_count ?? 0,
    reviews: (row.reviews ?? []).map(mapReview),
    tags: row.tags ?? [],
    isSponsored: row.is_sponsored,
    isFeatured: row.is_featured,
    freeShipping: row.free_shipping,
    location: row.location ?? "",
    createdAt: row.created_at,
  };
}

/** Fallback when a product somehow has no seller row (should not happen). */
const PLACEHOLDER_SELLER: Seller = {
  id: "unknown",
  handle: "unknown",
  displayName: "Unknown Seller",
  location: "",
  rating: 0,
  ratingCount: 0,
  responseRate: 0,
  joinedAt: new Date(0).toISOString(),
  isVerified: false,
  isFeatured: false,
  badges: [],
  totalSales: 0,
};

/** The select string that pulls a product with all its relations in one query. */
export const PRODUCT_SELECT =
  "*, sellers(*), product_images(*), reviews(*)";
