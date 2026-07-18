import type { Currency } from "./types";

const CURRENCY_LOCALE: Record<Currency, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  NGN: "en-NG",
};

export function formatPrice(amount: number, currency: Currency = "USD"): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
}

/** e.g. "3 days left", "5 hours left", "Ended" for an ISO end date. */
export function timeRemaining(endsAt: string, now: Date = new Date()): string {
  const end = new Date(endsAt).getTime();
  const diff = end - now.getTime();
  if (diff <= 0) return "Ended";
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""} left`;
  if (hours >= 1) return `${hours} hour${hours > 1 ? "s" : ""} left`;
  return `${mins} min${mins !== 1 ? "s" : ""} left`;
}

/** Relative "time ago" for reviews / activity. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days >= 365) return `${Math.floor(days / 365)}y ago`;
  if (days >= 30) return `${Math.floor(days / 30)}mo ago`;
  if (days >= 1) return `${days}d ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours >= 1) return `${hours}h ago`;
  return "just now";
}

export function discountPercent(price: number, original?: number): number | null {
  if (!original || original <= price) return null;
  return Math.round(((original - price) / original) * 100);
}
