import Link from "next/link";
import { Hero } from "@/components/hero";
import { CategoryRail } from "@/components/category-rail";
import { Section } from "@/components/section";
import { ProductGrid } from "@/components/product-grid";
import { SellerCard } from "@/components/seller-card";
import { AdBanner } from "@/components/ad-banner";
import {
  getDeals,
  getFeaturedProducts,
  getFeaturedSellers,
  getTrendingProducts,
} from "@/lib/api";
import { SITE_URL } from "@/lib/site";

export default async function HomePage() {
  const [featured, trending, deals, sellers] = await Promise.all([
    getFeaturedProducts(10),
    getTrendingProducts(10),
    getDeals(5),
    getFeaturedSellers(6),
  ]);

  // Organization + WebSite schema for rich search results.
  const siteUrl = SITE_URL;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Marketforyou",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={query}`,
      },
      "query-input": "required name=query",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="mb-4 text-lg font-bold">Browse categories</h2>
        <CategoryRail />
      </div>

      <Section title="Featured listings" subtitle="Hand-picked by our team" href="/search?featured=1">
        <ProductGrid products={featured} />
      </Section>

      <AdBanner />

      <Section title="Today's deals" subtitle="Biggest discounts, ending soon" href="/deals">
        <ProductGrid products={deals} />
      </Section>

      <Section title="Trending now" subtitle="What buyers are loving this week" href="/search?sort=rating">
        <ProductGrid products={trending} />
      </Section>

      <Section title="Featured stores" subtitle="Top-rated, verified sellers" href="/sellers">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((s) => (
            <SellerCard key={s.id} seller={s} />
          ))}
        </div>
      </Section>

      {/* Sell CTA */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-border bg-surface p-8 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-2xl font-bold">Ready to start selling?</h2>
            <p className="mt-1 text-muted">
              List your first product in minutes. No listing fees to get started.
            </p>
          </div>
          <Link
            href="/sell"
            className="inline-flex h-12 shrink-0 items-center rounded-lg bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Open your store
          </Link>
        </div>
      </section>
    </>
  );
}
