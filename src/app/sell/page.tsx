"use client";

import { useState } from "react";
import { UploadCloud, Sparkles, Loader2, CheckCircle2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import { generateListingCopy } from "@/lib/api";
import { cn } from "@/lib/cn";

const LISTING_TYPES = [
  { value: "fixed", label: "Fixed price", desc: "Sell at a set price" },
  { value: "auction", label: "Auction", desc: "Let buyers bid" },
  { value: "offer", label: "Accept offers", desc: "Negotiate with buyers" },
];

export default function SellPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listingType, setListingType] = useState("fixed");
  const [aiLoading, setAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleAiAssist() {
    if (!title.trim()) return;
    setAiLoading(true);
    // Seam: POST /api/v1/ai/listing-copy -> Claude generates SEO description.
    const copy = await generateListingCopy(title);
    setDescription(copy);
    setAiLoading(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Seam: POST /api/v1/listings (multipart with images).
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto grid max-w-md place-items-center px-4 py-24 text-center">
        <CheckCircle2 className="h-16 w-16 text-success" />
        <h1 className="mt-4 text-2xl font-bold">Listing submitted</h1>
        <p className="mt-1 text-muted">
          Your item is in review and will go live shortly. This is a demo build, so
          nothing was actually published.
        </p>
        <Button size="lg" className="mt-6" onClick={() => setSubmitted(false)}>
          List another item
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">List an item for sale</h1>
      <p className="mt-1 text-muted">Reach millions of buyers. No fees to get started.</p>

      <form onSubmit={submit} className="mt-8 space-y-8">
        {/* photos */}
        <section>
          <label className="mb-2 block text-sm font-medium">Photos</label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            <button
              type="button"
              className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-border text-muted hover:border-primary hover:text-primary"
            >
              <span className="text-center text-xs">
                <ImagePlus className="mx-auto mb-1 h-6 w-6" />
                Add photo
              </span>
            </button>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
            <UploadCloud className="h-3.5 w-3.5" /> Up to 10 images. First photo is the cover.
          </p>
        </section>

        {/* title */}
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

        {/* description + AI */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <button
              type="button"
              onClick={handleAiAssist}
              disabled={!title.trim() || aiLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
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
          {/* category */}
          <section>
            <label htmlFor="category" className="mb-2 block text-sm font-medium">Category</label>
            <select
              id="category"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </section>

          {/* price */}
          <section>
            <label htmlFor="price" className="mb-2 block text-sm font-medium">
              {listingType === "auction" ? "Starting bid" : "Price"} (USD)
            </label>
            <input
              id="price"
              type="number"
              min={0}
              step="0.01"
              required
              placeholder="0.00"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </section>
        </div>

        {/* listing type */}
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
                  listingType === t.value ? "border-primary bg-primary/5" : "border-border hover:border-muted",
                )}
              >
                <span className="block text-sm font-medium">{t.label}</span>
                <span className="block text-xs text-muted">{t.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Publish listing
        </Button>
      </form>
    </div>
  );
}
