import Image from "next/image";
import { CheckCircle2, ThumbsUp } from "lucide-react";
import type { Review } from "@/lib/types";
import { Rating } from "./ui/rating";
import { timeAgo } from "@/lib/format";

export function Reviews({ reviews, rating, ratingCount }: {
  reviews: Review[];
  rating: number;
  ratingCount: number;
}) {
  // Build a 5→1 star distribution from the sample reviews.
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: reviews.length
      ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

  return (
    <section aria-labelledby="reviews-heading" className="space-y-6">
      <h2 id="reviews-heading" className="text-xl font-bold">
        Ratings &amp; reviews
      </h2>

      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="text-center">
          <p className="text-5xl font-extrabold">{rating.toFixed(1)}</p>
          <Rating value={rating} size={16} className="mt-1 justify-center" />
          <p className="mt-1 text-sm text-muted">{ratingCount.toLocaleString()} ratings</p>
        </div>
        <div className="space-y-1">
          {dist.map((d) => (
            <div key={d.star} className="flex items-center gap-2 text-sm">
              <span className="w-3 text-muted">{d.star}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="w-9 text-right text-xs text-muted">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-full bg-surface-2">
                {r.avatarUrl && <Image src={r.avatarUrl} alt="" fill sizes="36px" className="object-cover" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{r.author}</span>
                  {r.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified purchase
                    </span>
                  )}
                </div>
                <Rating value={r.rating} size={12} />
              </div>
              <span className="ml-auto text-xs text-muted">{timeAgo(r.createdAt)}</span>
            </div>
            <p className="mt-3 text-sm text-foreground">{r.body}</p>
            <button className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary">
              <ThumbsUp className="h-3.5 w-3.5" /> Helpful ({r.helpfulCount})
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
