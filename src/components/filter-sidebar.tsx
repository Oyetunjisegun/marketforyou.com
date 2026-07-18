"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];
const LISTING_TYPES = [
  { value: "fixed", label: "Buy now" },
  { value: "auction", label: "Auction" },
  { value: "offer", label: "Accepts offers" },
];

/**
 * URL-driven filters: all state lives in the query string so results are
 * shareable, SSR-friendly, and back-button correct.
 */
export function FilterSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const conditions = params.getAll("condition");

  return (
    <aside className="w-full space-y-6">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </div>

      {/* price */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Price range</legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            defaultValue={params.get("minPrice") ?? ""}
            placeholder="Min"
            aria-label="Minimum price"
            onBlur={(e) =>
              update((p) => (e.target.value ? p.set("minPrice", e.target.value) : p.delete("minPrice")))
            }
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            min={0}
            defaultValue={params.get("maxPrice") ?? ""}
            placeholder="Max"
            aria-label="Maximum price"
            onBlur={(e) =>
              update((p) => (e.target.value ? p.set("maxPrice", e.target.value) : p.delete("maxPrice")))
            }
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </fieldset>

      {/* condition */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Condition</legend>
        {CONDITIONS.map((c) => (
          <label key={c.value} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={conditions.includes(c.value)}
              onChange={(e) =>
                update((p) => {
                  const current = p.getAll("condition").filter((v) => v !== c.value);
                  p.delete("condition");
                  if (e.target.checked) current.push(c.value);
                  current.forEach((v) => p.append("condition", v));
                })
              }
              className="h-4 w-4 rounded border-border accent-[var(--color-primary)]"
            />
            {c.label}
          </label>
        ))}
      </fieldset>

      {/* listing type */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Listing type</legend>
        {LISTING_TYPES.map((t) => (
          <label key={t.value} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="listingType"
              checked={params.get("listingType") === t.value}
              onChange={() => update((p) => p.set("listingType", t.value))}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            {t.label}
          </label>
        ))}
      </fieldset>

      {/* free shipping */}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={params.get("freeShipping") === "1"}
          onChange={(e) =>
            update((p) => (e.target.checked ? p.set("freeShipping", "1") : p.delete("freeShipping")))
          }
          className="h-4 w-4 rounded border-border accent-[var(--color-primary)]"
        />
        Free shipping only
      </label>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => router.push(pathname)}
      >
        Clear all filters
      </Button>
    </aside>
  );
}
