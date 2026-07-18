import Link from "next/link";
import { getAdminProducts } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Products</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Seller</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Listed</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link href={`/product/${p.slug}`} className="hover:text-primary">
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">
                  {p.sellerHandle ? `@${p.sellerHandle}` : "—"}
                </td>
                <td className="px-4 py-3">{formatPrice(p.price, p.currency)}</td>
                <td className="px-4 py-3 text-muted">{p.stock}</td>
                <td className="px-4 py-3 text-muted">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
