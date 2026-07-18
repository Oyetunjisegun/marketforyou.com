import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/components/cart-provider";
import { WishlistProvider } from "@/components/wishlist-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-var",
  display: "swap",
});

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Marketforyou — Buy, Sell & Negotiate Anything",
    template: "%s · Marketforyou",
  },
  description:
    "Marketforyou is a secure multi-vendor marketplace where anyone can buy, sell, negotiate, and grow a business. Verified sellers, escrow payments, and worldwide shipping.",
  keywords: [
    "marketplace", "buy", "sell", "auction", "make offer", "online shopping",
    "multi-vendor", "escrow", "secondhand", "electronics", "fashion",
  ],
  applicationName: "Marketforyou",
  openGraph: {
    type: "website",
    siteName: "Marketforyou",
    title: "Marketforyou — Buy, Sell & Negotiate Anything",
    description:
      "A secure multi-vendor marketplace with verified sellers, escrow payments, and worldwide shipping.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketforyou",
    description: "Buy, sell, and negotiate anything — securely.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <WishlistProvider>
            <CartProvider>
              {/* Skip link for keyboard / screen-reader users */}
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
              >
                Skip to content
              </a>
              <Header />
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer />
            </CartProvider>
          </WishlistProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
