import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, MessageCircle, ChevronRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/api";
import { getCategory } from "@/lib/categories";
import { ProductGallery } from "@/components/product-gallery";
import { BuyBox } from "@/components/buy-box";
import { Reviews } from "@/components/reviews";
import { ProductGrid } from "@/components/product-grid";
import { Rating } from "@/components/ui/rating";
import { formatCompact } from "@/lib/format";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.title,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.images[0]?.url ? [product.images[0].url] : [],
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, category] = await Promise.all([
    getRelatedProducts(product),
    Promise.resolve(getCategory(product.categorySlug)),
  ]);

  // Product schema for rich results (price, availability, rating).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.id,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.ratingCount,
    },
  };

  const seller = product.seller;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {category && (
          <>
            <Link href={`/category/${category.slug}`} className="hover:text-primary">
              {category.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        )}
        <span className="truncate text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />
        <BuyBox product={product} />
      </div>

      {/* seller + description + specs */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-xl font-bold">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {product.description}
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold">Specifications</h2>
            <dl className="overflow-hidden rounded-xl border border-border">
              {Object.entries(product.specs).map(([k, v], i) => (
                <div
                  key={k}
                  className={`flex gap-4 px-4 py-2.5 text-sm ${i % 2 ? "bg-surface" : "bg-surface-2"}`}
                >
                  <dt className="w-40 shrink-0 font-medium text-muted">{k}</dt>
                  <dd className="text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <Reviews reviews={product.reviews} rating={product.rating} ratingCount={product.ratingCount} />
        </div>

        {/* seller card */}
        <aside className="lg:sticky lg:top-28 h-fit space-y-4 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Sold by</span>
          </div>
          <Link href={`/seller/${seller.handle}`} className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {seller.displayName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold hover:text-primary">{seller.displayName}</span>
                {seller.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
              </div>
              <Rating value={seller.rating} count={seller.ratingCount} />
            </div>
          </Link>
          <ul className="space-y-1.5 text-sm text-muted">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {seller.location}</li>
            <li>{formatCompact(seller.totalSales)} sales · {seller.responseRate}% response rate</li>
          </ul>
          <Link
            href={`/seller/${seller.handle}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium hover:bg-surface-2"
          >
            <MessageCircle className="h-4 w-4" /> Contact seller
          </Link>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Similar products</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
