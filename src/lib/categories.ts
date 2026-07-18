import type { Category } from "./types";

/**
 * The full marketplace taxonomy. `icon` maps to a lucide-react icon name that
 * the UI resolves via the icon registry in components/icon.tsx.
 */
export const CATEGORIES: Category[] = [
  { slug: "electronics", name: "Electronics", icon: "Cpu", accent: "#2563eb", productCount: 1240 },
  { slug: "fashion", name: "Fashion", icon: "Shirt", accent: "#db2777", productCount: 3110 },
  { slug: "vehicles", name: "Vehicles", icon: "Car", accent: "#0891b2", productCount: 640 },
  { slug: "real-estate", name: "Real Estate", icon: "Building2", accent: "#16a34a", productCount: 210 },
  { slug: "phones", name: "Phones", icon: "Smartphone", accent: "#7c3aed", productCount: 980 },
  { slug: "computers", name: "Computers", icon: "Laptop", accent: "#2563eb", productCount: 870 },
  { slug: "furniture", name: "Furniture", icon: "Sofa", accent: "#b45309", productCount: 720 },
  { slug: "home-appliances", name: "Home Appliances", icon: "Refrigerator", accent: "#0d9488", productCount: 560 },
  { slug: "beauty", name: "Beauty", icon: "Sparkles", accent: "#e11d48", productCount: 1330 },
  { slug: "health", name: "Health", icon: "HeartPulse", accent: "#dc2626", productCount: 890 },
  { slug: "sports", name: "Sports", icon: "Dumbbell", accent: "#ea580c", productCount: 770 },
  { slug: "gaming", name: "Gaming", icon: "Gamepad2", accent: "#7c3aed", productCount: 1020 },
  { slug: "books", name: "Books", icon: "BookOpen", accent: "#0f766e", productCount: 2450 },
  { slug: "pets", name: "Pets", icon: "PawPrint", accent: "#ca8a04", productCount: 430 },
  { slug: "baby-products", name: "Baby Products", icon: "Baby", accent: "#0ea5e9", productCount: 610 },
  { slug: "services", name: "Services", icon: "Wrench", accent: "#475569", productCount: 350 },
  { slug: "digital-products", name: "Digital Products", icon: "Download", accent: "#2563eb", productCount: 1580 },
  { slug: "handmade", name: "Handmade", icon: "Palette", accent: "#c2410c", productCount: 990 },
  { slug: "collectibles", name: "Collectibles", icon: "Gem", accent: "#9333ea", productCount: 540 },
  { slug: "luxury-goods", name: "Luxury Goods", icon: "Crown", accent: "#a16207", productCount: 320 },
  { slug: "industrial", name: "Industrial Equipment", icon: "Factory", accent: "#334155", productCount: 180 },
];

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

export function getCategory(slug: string): Category | undefined {
  return CATEGORY_MAP[slug];
}
