import type { Product, Review, Seller } from "./types";
import { CATEGORIES } from "./categories";

/**
 * Deterministic mock dataset used by the UI until the live API is wired in.
 * Everything here is generated at module load from fixed seeds so that server
 * and client renders match (no hydration mismatches) and pages are stable.
 *
 * Swap `getProducts`/`getProductBySlug`/etc. for real fetches in src/lib/api.ts
 * when the backend lands — the return shapes are identical.
 */

// A tiny seeded PRNG (mulberry32) for stable "randomness".
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260718);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const int = (min: number, max: number) => Math.floor(between(min, max + 1));

// Picsum provides stable seeded placeholder photos — good enough for a
// realistic gallery without shipping binary assets.
const img = (seed: string, w = 800, h = 800) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

const SELLER_NAMES = [
  "Nova Electronics", "Harbor Vintage", "Lumen Studio", "Peak Outdoors",
  "Atlas Motors", "Bloom & Co", "Pixel Forge", "Meridian Home",
  "Coastal Threads", "Ironwood Craft", "Aurora Beauty", "Summit Gear",
];
const LOCATIONS = [
  "Austin, TX", "Portland, OR", "Brooklyn, NY", "Denver, CO",
  "Seattle, WA", "Miami, FL", "Chicago, IL", "London, UK", "Lagos, NG",
];

function makeSeller(i: number): Seller {
  const name = SELLER_NAMES[i % SELLER_NAMES.length];
  const isVerified = rand() > 0.25;
  const rating = +between(4.1, 5).toFixed(1);
  return {
    id: `sel_${i + 1}`,
    handle: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    displayName: name,
    avatarUrl: img(`avatar-${name}`, 160, 160),
    bio: `${name} has been serving the Marketforyou community with curated, quality products and fast, friendly shipping.`,
    location: pick(LOCATIONS),
    rating,
    ratingCount: int(24, 4200),
    responseRate: int(88, 100),
    joinedAt: new Date(2019 + (i % 6), (i * 3) % 12, 1 + (i % 27)).toISOString(),
    isVerified,
    isFeatured: rand() > 0.7,
    badges: [
      isVerified ? { label: "Verified", kind: "verified" as const } : { label: "New Seller", kind: "new" as const },
      ...(rating >= 4.8 ? [{ label: "Top Rated", kind: "top-rated" as const }] : []),
    ],
    totalSales: int(50, 12000),
  };
}

const SELLERS: Seller[] = Array.from({ length: 12 }, (_, i) => makeSeller(i));

const CONDITIONS = ["new", "like-new", "good", "fair"] as const;
const REVIEW_BODIES = [
  "Exactly as described. Shipping was quick and packaging was solid.",
  "Great value for the price. Would buy from this seller again.",
  "Item arrived a day early and works perfectly. Highly recommend.",
  "Good quality overall, minor cosmetic wear but nothing major.",
  "Seller was responsive and answered all my questions before I bought.",
  "Better than I expected. The photos don't do it justice.",
];
const REVIEW_AUTHORS = ["Jordan M.", "Priya S.", "Diego R.", "Amara O.", "Chris L.", "Wei Z.", "Sam T."];

function makeReviews(seed: string, count: number): Review[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${seed}-rev-${i}`,
    author: pick(REVIEW_AUTHORS),
    avatarUrl: img(`revavatar-${seed}-${i}`, 80, 80),
    rating: int(3, 5),
    body: pick(REVIEW_BODIES),
    createdAt: new Date(2025, int(0, 11), int(1, 27)).toISOString(),
    verifiedPurchase: rand() > 0.2,
    helpfulCount: int(0, 40),
  }));
}

// Product title fragments per category for believable listings.
const TITLES: Record<string, string[]> = {
  electronics: ["Wireless Noise-Cancelling Headphones", "4K Action Camera Bundle", "Smart Home Hub", "Portable Bluetooth Speaker"],
  fashion: ["Merino Wool Overcoat", "Leather Chelsea Boots", "Linen Summer Dress", "Vintage Denim Jacket"],
  vehicles: ["2019 Trail Mountain Bike", "Electric Scooter Pro", "Classic Vespa Restored", "Roof Cargo Box"],
  "real-estate": ["Downtown Studio Lease", "Lakeside Cabin Plot", "Co-working Desk Membership"],
  phones: ["Flagship Smartphone 256GB", "Rugged Outdoor Phone", "Unlocked Compact Phone"],
  computers: ["14\" Ultrabook Laptop", "Mechanical Keyboard TKL", "4K Creator Monitor", "Custom Gaming Desktop"],
  furniture: ["Mid-Century Lounge Chair", "Solid Oak Dining Table", "Modular Bookshelf"],
  "home-appliances": ["Espresso Machine", "Air Purifier HEPA", "Robot Vacuum"],
  beauty: ["Vitamin C Serum Set", "Ceramic Hair Straightener", "Organic Skincare Kit"],
  health: ["Smart Fitness Band", "Adjustable Dumbbell Set", "Massage Gun Pro"],
  sports: ["Carbon Road Bike Helmet", "Insulated Camping Tent", "Yoga Mat Premium"],
  gaming: ["Next-Gen Console Bundle", "Wireless Pro Controller", "RGB Gaming Headset"],
  books: ["Signed First Edition Novel", "Complete Sci-Fi Box Set", "Rare Art History Folio"],
  pets: ["Orthopedic Dog Bed", "Automatic Pet Feeder", "Cat Activity Tower"],
  "baby-products": ["Convertible Car Seat", "Foldable Travel Stroller", "Organic Cotton Onesies"],
  services: ["Logo Design Package", "Home Deep-Clean Session", "Guitar Lessons (Online)"],
  "digital-products": ["Lightroom Preset Pack", "UI Kit for Figma", "Ambient Music Sample Library"],
  handmade: ["Hand-Thrown Ceramic Mug", "Macramé Wall Hanging", "Beeswax Candle Trio"],
  collectibles: ["Limited-Run Vinyl Figure", "1990s Trading Card Lot", "Antique Pocket Watch"],
  "luxury-goods": ["Swiss Automatic Watch", "Designer Leather Tote", "Cashmere Scarf"],
  industrial: ["Cordless Impact Driver", "Workshop Air Compressor", "Laser Level Kit"],
};

function makeProduct(index: number): Product {
  const category = CATEGORIES[index % CATEGORIES.length];
  const titles = TITLES[category.slug] ?? ["Quality Item"];
  const baseTitle = titles[index % titles.length];
  const title = `${baseTitle}`;
  const slug = `${category.slug}-${baseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${index}`;
  const seller = SELLERS[index % SELLERS.length];
  const listingRoll = rand();
  const listingType = listingRoll > 0.82 ? "auction" : listingRoll > 0.62 ? "offer" : "fixed";
  const kind = category.slug === "digital-products" || category.slug === "services" ? "digital" : "physical";
  const price = +between(12, category.slug === "vehicles" || category.slug === "luxury-goods" ? 6000 : 900).toFixed(2);
  const hasDiscount = rand() > 0.55;
  const rating = +between(3.8, 5).toFixed(1);
  const ratingCount = int(6, 900);
  const imageCount = int(3, 5);

  return {
    id: `prod_${index + 1}`,
    slug,
    title,
    description:
      `${title} in ${pick(["excellent", "great", "pristine", "well-kept"])} condition. ` +
      `Sourced and inspected by ${seller.displayName}. This listing includes everything ` +
      `shown in the photos. Ships promptly with tracking; local pickup available in ${seller.location}. ` +
      `Message the seller with any questions — offers welcome on eligible items.`,
    categorySlug: category.slug,
    kind,
    listingType,
    condition: kind === "digital" ? "new" : pick(CONDITIONS),
    currency: "USD",
    price,
    originalPrice: hasDiscount ? +(price * between(1.15, 1.6)).toFixed(2) : undefined,
    auction:
      listingType === "auction"
        ? {
            currentBid: +(price * 0.7).toFixed(2),
            bidCount: int(1, 38),
            endsAt: new Date(Date.now() + int(2, 96) * 3600000).toISOString(),
          }
        : undefined,
    images: Array.from({ length: imageCount }, (_, i) => ({
      url: img(`${slug}-${i}`),
      alt: `${title} — photo ${i + 1}`,
      spin: i < 3,
    })),
    videoUrl: rand() > 0.8 ? "https://www.w3.org/2010/05/sintel/trailer_hd.mp4" : undefined,
    specs: {
      Brand: pick(["Nova", "Atlas", "Lumen", "Meridian", "Generic", "Aurora"]),
      Condition: kind === "digital" ? "Digital" : "Used",
      Warranty: pick(["30 days", "90 days", "1 year", "None"]),
      "Ships From": seller.location,
    },
    variants:
      rand() > 0.6
        ? [
            { name: "Color", values: ["Black", "Silver", "Blue"] },
            { name: "Size", values: ["S", "M", "L"] },
          ]
        : undefined,
    stock: kind === "digital" ? 9999 : int(0, 40),
    seller,
    rating,
    ratingCount,
    reviews: makeReviews(slug, int(2, 6)),
    tags: [category.name, seller.displayName, listingType],
    isSponsored: rand() > 0.85,
    isFeatured: rand() > 0.75,
    freeShipping: rand() > 0.5,
    location: seller.location,
    createdAt: new Date(Date.now() - int(1, 90) * 86400000).toISOString(),
  };
}

export const PRODUCTS: Product[] = Array.from({ length: 84 }, (_, i) => makeProduct(i));
export { SELLERS };
