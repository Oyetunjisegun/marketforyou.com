/**
 * Core domain types for Marketforyou.
 *
 * These mirror the intended REST/GraphQL API contracts so the UI can be built
 * against realistic shapes today and swapped onto the live backend later with
 * minimal churn. Keep these in sync with the NestJS DTOs / Prisma models when
 * that layer lands.
 */

export type ListingType = "fixed" | "auction" | "offer";
export type ProductCondition = "new" | "like-new" | "good" | "fair" | "for-parts";
export type ProductKind = "physical" | "digital";
export type Currency = "USD" | "EUR" | "GBP" | "NGN";

export interface Category {
  slug: string;
  name: string;
  /** Lucide icon name, resolved in the UI. */
  icon: string;
  /** Optional highlight colour token for category chips. */
  accent?: string;
  productCount?: number;
}

export interface SellerBadge {
  label: string;
  kind: "verified" | "top-rated" | "power-seller" | "new";
}

export interface Seller {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  location: string;
  rating: number; // 0-5
  ratingCount: number;
  responseRate: number; // 0-100
  joinedAt: string; // ISO date
  isVerified: boolean; // KYC-verified
  isFeatured: boolean;
  badges: SellerBadge[];
  totalSales: number;
}

export interface ProductImage {
  url: string;
  alt: string;
  /** Marks images that belong to a 360° spin set. */
  spin?: boolean;
}

export interface ProductVariantOption {
  name: string; // e.g. "Color"
  values: string[]; // e.g. ["Black", "Silver"]
}

export interface Review {
  id: string;
  author: string;
  avatarUrl?: string;
  rating: number; // 0-5
  title?: string;
  body: string;
  createdAt: string; // ISO date
  verifiedPurchase: boolean;
  helpfulCount: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  categorySlug: string;
  kind: ProductKind;
  listingType: ListingType;
  condition: ProductCondition;
  currency: Currency;
  price: number; // current / buy-now price, minor-unit safe as float for mock
  originalPrice?: number; // for discount display
  /** Auction-only fields */
  auction?: {
    currentBid: number;
    bidCount: number;
    endsAt: string; // ISO date
  };
  images: ProductImage[];
  videoUrl?: string;
  specs: Record<string, string>;
  variants?: ProductVariantOption[];
  stock: number;
  seller: Seller;
  rating: number; // 0-5
  ratingCount: number;
  reviews: Review[];
  tags: string[];
  isSponsored: boolean;
  isFeatured: boolean;
  freeShipping: boolean;
  location: string;
  createdAt: string; // ISO date
}

export interface CartLine {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string;
  unitPrice: number;
  currency: Currency;
  quantity: number;
  sellerHandle: string;
  variant?: Record<string, string>;
}

/** Lifecycle of a whole order, mirroring the order_status enum in the DB. */
export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

/** Per-line fulfillment a seller controls, mirroring fulfillment_status in the DB. */
export type FulfillmentStatus = "unfulfilled" | "shipped" | "delivered";
