/**
 * Seed the Supabase database with the existing demo dataset so the live site
 * isn't empty. Idempotent-ish: upserts categories/sellers/products by their
 * natural keys (slug / handle), then replaces each product's images.
 *
 * Run with:  npm run seed
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Uses the service_role key, so it BYPASSES RLS (server-side, trusted only).
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { CATEGORIES } from "../src/lib/categories";
import { PRODUCTS, SELLERS } from "../src/lib/mock-data";
import type { Database } from "../src/lib/supabase/types";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Categories -----------------------------------------------------------
  console.log(`Seeding ${CATEGORIES.length} categories...`);
  const { error: catErr } = await db.from("categories").upsert(
    CATEGORIES.map((c) => ({
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      accent: c.accent ?? null,
      product_count: c.productCount ?? 0,
    })),
    { onConflict: "slug" },
  );
  if (catErr) throw catErr;

  // 2. Sellers --------------------------------------------------------------
  console.log(`Seeding ${SELLERS.length} sellers...`);
  const { data: sellerRows, error: selErr } = await db
    .from("sellers")
    .upsert(
      SELLERS.map((s) => ({
        handle: s.handle,
        display_name: s.displayName,
        avatar_url: s.avatarUrl ?? null,
        bio: s.bio ?? null,
        location: s.location,
        rating: s.rating,
        rating_count: s.ratingCount,
        response_rate: s.responseRate,
        joined_at: s.joinedAt,
        is_verified: s.isVerified,
        is_featured: s.isFeatured,
        total_sales: s.totalSales,
      })),
      { onConflict: "handle" },
    )
    .select("id, handle");
  if (selErr) throw selErr;

  // Map mock seller handle -> real UUID.
  const sellerIdByHandle = new Map(sellerRows!.map((r) => [r.handle, r.id]));

  // 3. Products -------------------------------------------------------------
  console.log(`Seeding ${PRODUCTS.length} products...`);
  const { data: productRows, error: prodErr } = await db
    .from("products")
    .upsert(
      PRODUCTS.map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
        category_slug: p.categorySlug,
        kind: p.kind,
        listing_type: p.listingType,
        condition: p.condition,
        currency: p.currency,
        price: p.price,
        original_price: p.originalPrice ?? null,
        auction: p.auction ?? null,
        video_url: p.videoUrl ?? null,
        specs: p.specs,
        variants: p.variants ?? null,
        stock: p.stock,
        seller_id: sellerIdByHandle.get(p.seller.handle) ?? null,
        rating: p.rating,
        rating_count: p.ratingCount,
        tags: p.tags,
        is_sponsored: p.isSponsored,
        is_featured: p.isFeatured,
        free_shipping: p.freeShipping,
        location: p.location,
        created_at: p.createdAt,
      })),
      { onConflict: "slug" },
    )
    .select("id, slug");
  if (prodErr) throw prodErr;

  const productIdBySlug = new Map(productRows!.map((r) => [r.slug, r.id]));

  // 4. Product images (replace per product) --------------------------------
  console.log("Seeding product images...");
  const productIds = Array.from(productIdBySlug.values());
  // Clear existing images for these products so re-seeding doesn't duplicate.
  await db.from("product_images").delete().in("product_id", productIds);

  const images = PRODUCTS.flatMap((p) => {
    const pid = productIdBySlug.get(p.slug);
    if (!pid) return [];
    return p.images.map((img, i) => ({
      product_id: pid,
      url: img.url,
      alt: img.alt,
      spin: img.spin ?? false,
      position: i,
    }));
  });
  const { error: imgErr } = await db.from("product_images").insert(images);
  if (imgErr) throw imgErr;

  // 5. Reviews (replace per product) ---------------------------------------
  console.log("Seeding reviews...");
  await db.from("reviews").delete().in("product_id", productIds);
  const reviews = PRODUCTS.flatMap((p) => {
    const pid = productIdBySlug.get(p.slug);
    if (!pid) return [];
    return p.reviews.map((r) => ({
      product_id: pid,
      author_id: null,
      author_name: r.author,
      avatar_url: r.avatarUrl ?? null,
      rating: r.rating,
      title: r.title ?? null,
      body: r.body,
      verified_purchase: r.verifiedPurchase,
      helpful_count: r.helpfulCount,
      created_at: r.createdAt,
    }));
  });
  const { error: revErr } = await db.from("reviews").insert(reviews);
  if (revErr) throw revErr;

  console.log("\n✅ Seed complete.");
  console.log(`   ${CATEGORIES.length} categories, ${SELLERS.length} sellers, ` +
    `${PRODUCTS.length} products, ${images.length} images, ${reviews.length} reviews.`);
}

main().catch((e) => {
  console.error("\n❌ Seed failed:", e.message ?? e);
  process.exit(1);
});
