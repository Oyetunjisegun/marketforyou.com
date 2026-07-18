"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { FilterSidebar } from "./filter-sidebar";
import { SortSelect } from "./sort-select";
import { Button } from "./ui/button";

/**
 * Two-column browse shell shared by /search and /category/[slug].
 * Filters render inline on desktop and in a slide-over drawer on mobile.
 */
export function BrowseLayout({
  title,
  total,
  children,
}: {
  title: ReactNode;
  total: number;
  children: ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted">{total.toLocaleString()} results</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setDrawer(true)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
          <SortSelect />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="hidden lg:block">
          <FilterSidebar />
        </div>
        <div>{children}</div>
      </div>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-surface p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">Filters</span>
              <button onClick={() => setDrawer(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterSidebar />
          </div>
        </div>
      )}
    </div>
  );
}
