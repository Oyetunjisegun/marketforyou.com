import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CATEGORIES } from "@/lib/categories";
import { getProducts } from "@/lib/api";
import { SELLERS } from "@/lib/mock-data";

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

  const sellerRoutes: MetadataRoute.Sitemap = SELLERS.map((s) => ({
    url: `${SITE_URL}/seller/${s.handle}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Pull all products through the data layer so this stays correct once the
  // mock layer is swapped for the real API.
  const { items } = await getProducts({ pageSize: 10_000 });
  const productRoutes: MetadataRoute.Sitemap = items.map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: p.createdAt ? new Date(p.createdAt) : now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes, ...sellerRoutes, ...productRoutes];
}
