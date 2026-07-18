import { ProductFormLoader } from "@/components/product-form-loader";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductFormLoader productId={id} />;
}
