import type { Currency } from "./types";

/**
 * Currency handling for checkout.
 *
 * The catalog is priced and displayed in USD, but our payment gateway
 * (Flutterwave) charges Nigerian buyers in NGN. We convert USD → NGN at
 * payment time using a configurable rate. This is a fixed/env-driven rate for
 * now; swap in a live FX feed later without touching callers.
 *
 * Set NEXT_PUBLIC_USD_NGN_RATE in the environment to override the default.
 */
const DEFAULT_USD_NGN = 1600;

export function usdToNgnRate(): number {
  const raw = process.env.NEXT_PUBLIC_USD_NGN_RATE;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_USD_NGN;
}

/** Convert a USD amount to NGN, rounded to whole naira (gateways dislike kobo fractions). */
export function usdToNgn(amountUsd: number): number {
  return Math.round(amountUsd * usdToNgnRate());
}

/** The currency we actually charge in. Centralised so it's easy to change. */
export const CHARGE_CURRENCY: Currency = "NGN";
