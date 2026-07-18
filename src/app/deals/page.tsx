import type { Metadata } from "next";
import { getDeals } from "@/lib/api";
import { ProductGrid } from "@/components/product-grid";
import { Flame } from "lucide-react";

export const metadata: Metadata = {
  title: "Today's Deals",
  description: "The biggest discounts on Marketforyou, updated daily.",
  alternates: { canonical: "/deals" },
};

export default async function DealsPage() {
  const deals = await getDeals(20);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-danger/10 text-danger">
          <Flame className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Today&apos;s deals</h1>
          <p className="text-sm text-muted">Limited-time discounts from across the marketplace.</p>
        </div>
      </div>
      <ProductGrid products={deals} />
    </div>
  );
}
