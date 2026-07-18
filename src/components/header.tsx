"use client";

import Link from "next/link";
import { Heart, ShoppingCart, User, Menu, X, Store, ChevronDown } from "lucide-react";
import { useState } from "react";
import { SearchBar } from "./search-bar";
import { ThemeToggle } from "./theme-toggle";
import { useCart } from "./cart-provider";
import { useWishlist } from "./wishlist-provider";
import { useAuth } from "./auth-provider";
import { CATEGORIES } from "@/lib/categories";
import { CategoryIcon } from "./icon";
import { useRouter } from "next/navigation";

export function Header() {
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);

  async function handleSignOut() {
    setAcctOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4">
        {/* mobile menu button */}
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg hover:bg-surface-2 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:block">
            Market<span className="text-primary">foryou</span>
          </span>
        </Link>

        {/* search — grows to fill */}
        <SearchBar className="flex-1" />

        {/* actions */}
        <nav className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/wishlist"
            className="relative grid h-10 w-10 place-items-center rounded-lg hover:bg-surface-2"
            aria-label={`Wishlist, ${wishCount} items`}
          >
            <Heart className="h-5 w-5" />
            {wishCount > 0 && <Count>{wishCount}</Count>}
          </Link>
          <Link
            href="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-lg hover:bg-surface-2"
            aria-label={`Cart, ${count} items`}
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && <Count>{count}</Count>}
          </Link>
          {user ? (
            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setAcctOpen(true)}
              onMouseLeave={() => setAcctOpen(false)}
            >
              <Link
                href="/account"
                className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-surface-2"
              >
                <User className="h-5 w-5" />
                <span className="max-w-[10ch] truncate">
                  {user.user_metadata?.full_name || user.email?.split("@")[0] || "Account"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Link>
              {acctOpen && (
                <div className="absolute right-0 top-full z-40 w-48 rounded-xl border border-border bg-surface p-1 shadow-xl">
                  <Link
                    href="/account"
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2"
                  >
                    Your account
                  </Link>
                  <Link
                    href="/account/orders"
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2"
                  >
                    Your orders
                  </Link>
                  <Link
                    href="/dashboard/products"
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2"
                  >
                    Seller dashboard
                  </Link>
                  <Link
                    href="/wishlist"
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2"
                  >
                    Wishlist
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-surface-2"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-surface-2 sm:flex"
            >
              <User className="h-5 w-5" /> Sign in
            </Link>
          )}
          <Link
            href="/sell"
            className="hidden h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover md:flex"
          >
            Sell
          </Link>
        </nav>
      </div>

      {/* desktop category strip */}
      <div className="hidden border-t border-border lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          <div
            className="relative"
            onMouseEnter={() => setCatsOpen(true)}
            onMouseLeave={() => setCatsOpen(false)}
          >
            <button className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-foreground hover:text-primary">
              <Menu className="h-4 w-4" /> All Categories
              <ChevronDown className="h-4 w-4" />
            </button>
            {catsOpen && (
              <div className="absolute left-0 top-full z-40 grid w-[640px] grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-3 shadow-xl">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2"
                  >
                    <CategoryIcon name={c.icon} className="h-4 w-4 text-primary" />
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {CATEGORIES.slice(0, 8).map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="px-3 py-2.5 text-sm text-muted hover:text-primary"
            >
              {c.name}
            </Link>
          ))}
          <Link href="/deals" className="px-3 py-2.5 text-sm font-medium text-danger">
            Deals
          </Link>
        </div>
      </div>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-border bg-surface lg:hidden">
          <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
            <div className="mb-3 flex gap-2">
              {user ? (
                <Link
                  href="/account"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="h-4 w-4" /> Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="h-4 w-4" /> Sign in
                </Link>
              )}
              <Link
                href="/sell"
                className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
                onClick={() => setMobileOpen(false)}
              >
                Start selling
              </Link>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleSignOut();
                }}
                className="mb-3 w-full rounded-lg border border-border py-2 text-sm font-medium text-danger"
              >
                Sign out
              </button>
            )}
            <p className="px-1 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Categories
            </p>
            <div className="grid grid-cols-2 gap-1">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-surface-2"
                >
                  <CategoryIcon name={c.icon} className="h-4 w-4 text-primary" />
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
      {children}
    </span>
  );
}
