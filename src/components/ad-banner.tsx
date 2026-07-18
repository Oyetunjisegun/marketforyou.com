import Link from "next/link";
import { Megaphone } from "lucide-react";

/**
 * Homepage advertisement slot (part of the revenue model). In production this
 * is served by the ad-management system in the admin dashboard; here it renders
 * a labelled house ad so the placement and "Sponsored" disclosure are visible.
 */
export function AdBanner() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <Link
        href="/sell"
        className="relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-sky-500/10 to-primary/10 p-6 sm:flex-row sm:items-center"
      >
        <span className="absolute right-3 top-3 rounded-full bg-surface/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          Sponsored
        </span>
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Megaphone className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-bold text-foreground">
              Promote your store to millions of buyers
            </p>
            <p className="text-sm text-muted">
              Featured listings and homepage ads that put your products first.
            </p>
          </div>
        </div>
        <span className="inline-flex h-10 shrink-0 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">
          Learn more
        </span>
      </Link>
    </div>
  );
}
