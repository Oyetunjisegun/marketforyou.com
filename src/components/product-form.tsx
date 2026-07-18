"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/image-uploader";
import { useAuth } from "@/components/auth-provider";
import { CATEGORIES } from "@/lib/categories";
import { generateListingCopy } from "@/lib/api";
import { createProduct, updateProduct, type ProductInput } from "@/lib/seller";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

const LISTING_TYPES = [
  { value: "fixed", label: "Fixed price", desc: "Sell at a set price" },
  { value: "auction", label: "Auction", desc: "Let buyers bid" },
  { value: "offer", label: "Accept offers", desc: "Negotiate with buyers" },
] as const;

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "for-parts", label: "For parts" },
] as const;

/**
 * Create/edit form for a seller's product. When `product` is provided it edits
 * in place; otherwise it creates. Writes go through the authenticated client so
 * RLS confirms ownership.
 */
export function ProductForm({
  sellerId,
  product,
}: {
  sellerId: string;
  product?: Product;
}) {
  const router = useRouter();
  const { supabase } = useAuth();
  const editing = Boolean(product);

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categorySlug, setCategorySlug] = useState(product?.categorySlug ?? "");
  const [condition, setCondition] =
    useState<ProductInput["condition"]>(product?.condition ?? "new");
  const [listingType, setListingType] =
    useState<ProductInput["listingType"]>(product?.listingType ?? "fixed");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [originalPrice, setOriginalPrice] = useState(
    product?.originalPrice ? String(product.originalPrice) : "",
  );
  const [stock, setStock] = useState(product ? String(product.stock) : "1");
  const [freeShipping, setFreeShipping] = useState(product?.freeShipping ?? false);
  const [location, setLocation] = useState(product?.location ?? "");
  const [images, setImages] = useState<string[]>(
    product?.images.map((i) => i.url).filter(Boolean) ?? [],
  );

  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAiAssist() {
    if (!title.trim()) return;
    setAiLoading(true);
    setDescription(await generateListingCopy(title));
    setAiLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) {
      setError("Enter a valid price.");
      return;
    }
    if (!categorySlug) {
      setError("Choose a category.");
      return;
    }

    const input: ProductInput = {
      title: title.trim(),
      description: description.trim(),
      categorySlug,
      condition,
      listingType,
      price: priceNum,
      originalPrice: originalPrice ? Number(originalPrice) : null,
      stock: Math.max(0, Math.floor(Number(stock) || 0)),
      freeShipping,
      location: location.trim(),
      images,
    };

    setSaving(true);
    try {
      if (editing && product) {
        await updateProduct(supabase, product.id, input);
      } else {
        await createProduct(supabase, sellerId, input);
      }
      router.push("/dashboard/products");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section>
        <label className="mb-2 block text-sm font-medium">Photos</label>
        <ImageUploader value={images} onChange={setImages} />
      </section>

      <section>
        <label htmlFor="title" className="mb-2 block text-sm font-medium">Title</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Apple iPhone 15 Pro 256GB — Titanium"
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="description" className="text-sm font-medium">Description</label>
          <button
            type="button"
            onClick={handleAiAssist}
            disabled={!title.trim() || aiLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            {aiLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Write with AI
          </button>
        </div>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Describe the condition, features, and anything buyers should know."
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <label htmlFor="category" className="mb-2 block text-sm font-medium">Category</label>
          <select
            id="category"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </section>

        <section>
          <label htmlFor="condition" className="mb-2 block text-sm font-medium">Condition</label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as ProductInput["condition"])}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </section>

        <section>
          <label htmlFor="price" className="mb-2 block text-sm font-medium">
            {listingType === "auction" ? "Starting bid" : "Price"} (USD)
          </label>
          <input
            id="price"
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="0.00"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </section>

        <section>
          <label htmlFor="original" className="mb-2 block text-sm font-medium">
            Compare-at price (optional)
          </label>
          <input
            id="original"
            type="number"
            min={0}
            step="0.01"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            placeholder="Show a discount"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </section>

        <section>
          <label htmlFor="stock" className="mb-2 block text-sm font-medium">Stock</label>
          <input
            id="stock"
            type="number"
            min={0}
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </section>

        <section>
          <label htmlFor="location" className="mb-2 block text-sm font-medium">
            Location (optional)
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Lagos, NG"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </section>
      </div>

      <section>
        <span className="mb-2 block text-sm font-medium">Listing type</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {LISTING_TYPES.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => setListingType(t.value)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                listingType === t.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted",
              )}
            >
              <span className="block text-sm font-medium">{t.label}</span>
              <span className="block text-xs text-muted">{t.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={freeShipping}
          onChange={(e) => setFreeShipping(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        Offer free shipping
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? "Save changes" : "Publish listing"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/dashboard/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
