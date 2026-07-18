import Link from "next/link";
import { ShieldCheck, Sparkles, Gavel, HandCoins } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-sky-500 text-white">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Millions of items from verified sellers
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Buy, sell &amp; negotiate <span className="text-sky-200">anything</span>.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">
            The marketplace built for everyone — from individual sellers to large
            retailers. Secure escrow payments, real-time chat, and worldwide shipping.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="inline-flex h-12 items-center rounded-lg bg-white px-6 text-sm font-semibold text-primary shadow-sm hover:bg-white/90"
            >
              Start shopping
            </Link>
            <Link
              href="/sell"
              className="inline-flex h-12 items-center rounded-lg border border-white/40 px-6 text-sm font-semibold text-white hover:bg-white/10"
            >
              Sell your first item
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
            <li className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Buyer protection</li>
            <li className="inline-flex items-center gap-1.5"><Gavel className="h-4 w-4" /> Live auctions</li>
            <li className="inline-flex items-center gap-1.5"><HandCoins className="h-4 w-4" /> Make an offer</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
