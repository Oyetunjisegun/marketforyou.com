import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CATEGORIES } from "@/lib/categories";
import { getProducts, getAllSellers } from "@/lib/api";

/**
 * The sitemap is generated at build/request time. It pulls products and sellers
 * from Supabase through the data layer. Each DB read is wrapped so a transient
 * failure (or missing env at build) degrades to a partial sitemap instead of
 * failing the whole build ("Failed to collect page data for /sitemap.xml").
 */

// Re-generate at most once an hour rather than trying to prerender at build,
// so the sitemap never blocks a deploy on a slow/unavailable database.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/deals`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/sell`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE_URL}/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // Sellers from the database (the mock-data list no longer matches real rows).
  let sellerRoutes: MetadataRoute.Sitemap = [];
  try {
    const sellers = await getAllSellers();
    sellerRoutes = sellers.map((s) => ({
      url: `${SITE_URL}/seller/${s.handle}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    // Leave sellers out of this build's sitemap rather than failing the build.
  }

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const { items } = await getProducts({ pageSize: 10_000 });
    productRoutes = items.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.createdAt ? new Date(p.createdAt) : now,
      changeFrequency: "weekly",
      priority: 0.9,
    }));
  } catch {
    // Same: a DB hiccup shouldn't break the deploy.
  }

  return [...staticRoutes, ...categoryRoutes, ...sellerRoutes, ...productRoutes];
}
