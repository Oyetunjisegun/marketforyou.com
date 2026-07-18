import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import type { Seller } from "@/lib/types";
import { Rating } from "./ui/rating";
import { formatCompact } from "@/lib/format";

export function SellerCard({ seller }: { seller: Seller }) {
  return (
    <Link
      href={`/seller/${seller.handle}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface-2">
        {seller.avatarUrl && (
          <Image src={seller.avatarUrl} alt={seller.displayName} fill sizes="56px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate font-semibold text-foreground">{seller.displayName}</span>
          {seller.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
        </div>
        <Rating value={seller.rating} count={seller.ratingCount} />
        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {seller.location}
          </span>
          <span>·</span>
          <span>{formatCompact(seller.totalSales)} sales</span>
        </div>
      </div>
    </Link>
  );
}
