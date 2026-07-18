import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrowseLayout } from "@/components/browse-layout";
import { ProductGrid } from "@/components/product-grid";
import { getProducts } from "@/lib/api";
import { parseProductQuery } from "@/lib/query";
import { getCategory, CATEGORIES } from "@/lib/categories";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Params = Promise<{ slug: string }>;

// Pre-render every category page at build time.
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: `Shop ${category.name} on Marketforyou — ${category.productCount?.toLocaleString()} listings from verified sellers.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const sp = await searchParams;
  const query = { ...parseProductQuery(sp), category: slug };
  const { items, total } = await getProducts(query);

  return (
    <BrowseLayout title={category.name} total={total}>
      <ProductGrid products={items} />
    </BrowseLayout>
  );
}
