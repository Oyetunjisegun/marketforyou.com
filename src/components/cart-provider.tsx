"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartLine, Product } from "@/lib/types";
import { useAuth } from "./auth-provider";
import {
  addCartItem,
  clearCart,
  fetchCart,
  mergeGuestCart,
  removeCartItem,
  setCartQuantity,
} from "@/lib/cart";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, quantity?: number, variant?: Record<string, string>) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "mfy.cart.v1";

/**
 * Cart state. Guests get a localStorage-backed cart. On sign-in, any guest
 * lines are merged into the user's persistent cart_items rows and the DB
 * becomes the source of truth (synced across devices). Local state is updated
 * optimistically; DB writes happen in the background.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, supabase } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  // Which auth state the current `lines` reflect: null = guest/localStorage.
  const syncedUserId = useRef<string | null>(null);

  // Load persisted guest cart once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  // Persist guest cart on change (only while logged out).
  useEffect(() => {
    if (!hydrated || user) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, [lines, hydrated, user]);

  // React to auth changes: on login, merge guest lines then load the DB cart;
  // on logout, fall back to whatever is in localStorage.
  useEffect(() => {
    if (!hydrated) return;
    const uid = user?.id ?? null;
    if (uid === syncedUserId.current) return;

    if (!uid) {
      // Logged out: fall back to the guest cart in localStorage.
      syncedUserId.current = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLines(raw ? JSON.parse(raw) : []);
      } catch {
        setLines([]);
      }
      return;
    }

    // Logged in: merge any guest lines, then read the authoritative DB cart.
    (async () => {
      try {
        let guest: CartLine[] = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          guest = raw ? (JSON.parse(raw) as CartLine[]) : [];
        } catch {
          guest = [];
        }
        if (guest.length) {
          await mergeGuestCart(supabase, uid, guest);
          localStorage.removeItem(STORAGE_KEY);
        }
        const dbLines = await fetchCart(supabase, uid);
        setLines(dbLines);
        syncedUserId.current = uid;
      } catch {
        // Leave local state as-is on failure; user can retry actions.
        syncedUserId.current = uid;
      }
    })();
  }, [user, hydrated, supabase]);

  const add = useCallback<CartContextValue["add"]>(
    (product, quantity = 1, variant) => {
      // Optimistic local update (matches the previous behavior).
      setLines((prev) => {
        const existing = prev.find((l) => l.productId === product.id);
        if (existing) {
          return prev.map((l) =>
            l.productId === product.id ? { ...l, quantity: l.quantity + quantity } : l,
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            title: product.title,
            imageUrl: product.images[0]?.url ?? "",
            unitPrice: product.price,
            currency: product.currency,
            quantity,
            sellerHandle: product.seller.handle,
            variant,
          },
        ];
      });
      if (user) {
        addCartItem(supabase, user.id, product.id, quantity, variant).catch(() => {});
      }
    },
    [user, supabase],
  );

  const remove = useCallback(
    (productId: string) => {
      setLines((prev) => prev.filter((l) => l.productId !== productId));
      if (user) removeCartItem(supabase, user.id, productId).catch(() => {});
    },
    [user, supabase],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      setLines((prev) =>
        quantity <= 0
          ? prev.filter((l) => l.productId !== productId)
          : prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
      );
      if (user) setCartQuantity(supabase, user.id, productId, quantity).catch(() => {});
    },
    [user, supabase],
  );

  const clear = useCallback(() => {
    setLines([]);
    if (user) clearCart(supabase, user.id).catch(() => {});
  }, [user, supabase]);

  const { count, subtotal } = useMemo(
    () => ({
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0),
    }),
    [lines],
  );

  const value = useMemo(
    () => ({ lines, count, subtotal, add, remove, setQuantity, clear }),
    [lines, count, subtotal, add, remove, setQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
