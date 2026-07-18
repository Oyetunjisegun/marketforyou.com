import { createAdminClient } from "./supabase/server";
import type { Currency, OrderStatus } from "./types";

/**
 * Admin data access. These run with the service-role client (bypassing RLS) and
 * MUST only be called from pages/routes already gated by requireAdmin().
 */

export interface AdminStats {
  users: number;
  sellers: number;
  products: number;
  orders: number;
  paidOrders: number;
  revenue: number; // sum of totals for paid+ orders, in USD
}

export async function getAdminStats(): Promise<AdminStats> {
  const admin = createAdminClient();
  const [users, sellers, products, orders, paid] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("sellers").select("id", { count: "exact", head: true }),
    admin.from("products").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin
      .from("orders")
      .select("total, status")
      .in("status", ["paid", "shipped", "delivered"]),
  ]);

  const paidRows = paid.data ?? [];
  const revenue = paidRows.reduce((n, r) => n + Number(r.total), 0);

  return {
    users: users.count ?? 0,
    sellers: sellers.count ?? 0,
    products: products.count ?? 0,
    orders: orders.count ?? 0,
    paidOrders: paidRows.length,
    revenue: +revenue.toFixed(2),
  };
}

export interface AdminUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
  createdAt: string;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    role: r.role,
    createdAt: r.created_at,
  }));
}

export interface AdminProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: Currency;
  stock: number;
  sellerHandle: string | null;
  createdAt: string;
}

type ProductJoinRow = {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  stock: number;
  created_at: string;
  sellers: { handle: string } | { handle: string }[] | null;
};

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("id, title, slug, price, currency, stock, created_at, sellers(handle)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as unknown as ProductJoinRow[]).map((r) => {
    const handle = Array.isArray(r.sellers) ? r.sellers[0]?.handle : r.sellers?.handle;
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      price: r.price,
      currency: r.currency as Currency,
      stock: r.stock,
      sellerHandle: handle ?? null,
      createdAt: r.created_at,
    };
  });
}

export interface AdminOrder {
  id: string;
  status: OrderStatus;
  total: number;
  currency: Currency;
  buyerEmail: string | null;
  createdAt: string;
  itemCount: number;
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("id, status, total, currency, shipping_email, created_at, order_items(id)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    status: r.status as OrderStatus,
    total: r.total,
    currency: r.currency as Currency,
    buyerEmail: r.shipping_email,
    createdAt: r.created_at,
    itemCount: Array.isArray(r.order_items) ? r.order_items.length : 0,
  }));
}
