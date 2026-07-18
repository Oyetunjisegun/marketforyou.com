/**
 * Canonical site origin, resolved for whatever environment we're in.
 *
 * Precedence:
 *   1. NEXT_PUBLIC_SITE_URL — set this to the production domain on Vercel.
 *   2. VERCEL_URL — auto-injected on Vercel preview/production deploys.
 *   3. localhost fallback for local dev.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_URL = getSiteUrl();
