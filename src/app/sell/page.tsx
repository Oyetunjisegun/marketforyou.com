import { redirect } from "next/navigation";

/**
 * The standalone /sell mock has been replaced by the real seller dashboard.
 * Listing creation now lives at /dashboard/products/new (which handles seller
 * onboarding if the user hasn't opened a store yet).
 */
export default function SellPage() {
  redirect("/dashboard/products/new");
}
