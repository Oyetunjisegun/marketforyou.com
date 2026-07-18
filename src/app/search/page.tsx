import type { Metadata } from "next";
import { BrowseLayout } from "@/components/browse-layout";
import { ProductGrid } from "@/components/product-grid";
import { getProducts } from "@/lib/api";
import { parseProductQuery } from "@/lib/query";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  return {
    title: q ? `Search: ${q}` : "Search",
    description: q ? `Search results for "${q}" on Marketforyou.` : "Search Marketforyou.",
  };
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const query = parseProductQuery(sp);
  const { items, total } = await getProducts(query);

  return (
    <BrowseLayout
      title={query.q ? `Results for “${query.q}”` : "All products"}
      total={total}
    >
      <ProductGrid products={items} />
    </BrowseLayout>
  );
}
