import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Star, Package, Clock, MessageCircle } from "lucide-react";
import { getSellerByHandle, getProductsBySeller } from "@/lib/api";
import { ProductGrid } from "@/components/product-grid";
import { formatCompact } from "@/lib/format";

type Params = Promise<{ handle: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { handle } = await params;
  const seller = await getSellerByHandle(handle);
  if (!seller) return { title: "Seller not found" };
  return {
    title: `${seller.displayName} — Store`,
    description: seller.bio ?? `Shop from ${seller.displayName} on Marketforyou.`,
    alternates: { canonical: `/seller/${handle}` },
  };
}

export default async function SellerPage({ params }: { params: Params }) {
  const { handle } = await params;
  const seller = await getSellerByHandle(handle);
  if (!seller) notFound();

  const products = await getProductsBySeller(seller.handle);

  const stats = [
    { icon: Star, label: "Rating", value: `${seller.rating.toFixed(1)} (${formatCompact(seller.ratingCount)})` },
    { icon: Package, label: "Sales", value: formatCompact(seller.totalSales) },
    { icon: Clock, label: "Response rate", value: `${seller.responseRate}%` },
  ];

  return (
    <div>
      {/* banner */}
      <div className="h-40 bg-gradient-to-r from-primary to-sky-500 sm:h-52" />
      <div className="mx-auto max-w-7xl px-4">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border-4 border-surface bg-primary/10 text-3xl font-bold text-primary">
            {seller.displayName.charAt(0)}
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{seller.displayName}</h1>
              {seller.isVerified && <BadgeCheck className="h-5 w-5 text-primary" />}
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="h-4 w-4" /> {seller.location} · @{seller.handle}
            </p>
          </div>
          <button className="mb-1 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2">
            <MessageCircle className="h-4 w-4" /> Contact
          </button>
        </div>

        {seller.bio && <p className="mt-4 max-w-2xl text-sm text-muted">{seller.bio}</p>}

        <dl className="mt-5 grid grid-cols-3 gap-3 sm:max-w-lg">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-border bg-surface p-3 text-center">
                <Icon className="mx-auto h-4 w-4 text-primary" />
                <dd className="mt-1 text-sm font-bold">{s.value}</dd>
                <dt className="text-xs text-muted">{s.label}</dt>
              </div>
            );
          })}
        </dl>

        <section className="py-8">
          <h2 className="mb-4 text-xl font-bold">
            Listings <span className="text-muted">({products.length})</span>
          </h2>
          <ProductGrid products={products} />
        </section>
      </div>
    </div>
  );
}
