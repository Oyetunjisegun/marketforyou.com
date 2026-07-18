import Link from "next/link";
import { Store, Send, AtSign, Share2, Rss, ShieldCheck, Globe } from "lucide-react";

const SECTIONS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Buy",
    links: [
      { label: "How to shop", href: "/help/buying" },
      { label: "Buyer Protection", href: "/legal/buyer-protection" },
      { label: "Track your order", href: "/orders" },
      { label: "Returns & refunds", href: "/legal/refund" },
    ],
  },
  {
    title: "Sell",
    links: [
      { label: "Start selling", href: "/sell" },
      { label: "Seller dashboard", href: "/seller" },
      { label: "Seller Agreement", href: "/legal/seller-agreement" },
      { label: "Fees & pricing", href: "/help/fees" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Newsroom", href: "/news" },
      { label: "Contact support", href: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Cookie Policy", href: "/legal/cookies" },
      { label: "Community Guidelines", href: "/legal/community" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Store className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold">
                Market<span className="text-primary">foryou</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted">
              The marketplace where anyone can buy, sell, negotiate, and grow a
              business. Safe payments, verified sellers, worldwide shipping.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-success">
              <ShieldCheck className="h-4 w-4" /> Secure escrow payments
            </div>
            <div className="mt-4 flex gap-2">
              {[Send, AtSign, Share2, Rss].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary"
                  aria-label="Social media"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
              <ul className="mt-3 space-y-2">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Marketforyou. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> English (US) · USD
            </span>
            <span>Stripe · PayPal · Paystack · Flutterwave</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
