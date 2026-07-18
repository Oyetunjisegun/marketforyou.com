import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

/** Accessible star rating display (read-only). */
export function Rating({
  value,
  count,
  size = 14,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`Rated ${value} out of 5${count ? ` from ${count} reviews` : ""}`}
    >
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= rounded;
          const half = !filled && i - 0.5 === rounded;
          return (
            <Star
              key={i}
              width={size}
              height={size}
              className={cn(
                filled || half ? "text-amber-400" : "text-border",
              )}
              fill={filled ? "currentColor" : half ? "url(#half)" : "none"}
              strokeWidth={1.5}
            />
          );
        })}
      </span>
      <span className="text-xs font-medium text-foreground">{value.toFixed(1)}</span>
      {typeof count === "number" && (
        <span className="text-xs text-muted">({count.toLocaleString()})</span>
      )}
    </span>
  );
}
