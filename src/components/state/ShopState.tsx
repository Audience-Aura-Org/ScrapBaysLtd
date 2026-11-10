"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ProductLite } from "@/lib/content";

export type CartLine = { product: ProductLite; quantity: number; unit: string };

type ShopState = {
  ready: boolean;
  cart: CartLine[];
  wishlist: ProductLite[];
  addToCart: (product: ProductLite, quantity: number, unit: string) => void;
  updateLine: (slug: string, patch: Partial<Pick<CartLine, "quantity" | "unit">>) => void;
  removeLine: (slug: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: ProductLite) => void;
  inWishlist: (slug: string) => boolean;
  toast: string | null;
};

const Ctx = createContext<ShopState | null>(null);
const CART_KEY = "sb-cart-v1";
const WISH_KEY = "sb-wishlist-v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: state still works for this tab */
  }
}

export function ShopStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<ProductLite[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setCart(read<CartLine[]>(CART_KEY, []).filter((l) => l?.product?.slug && l.quantity > 0));
    setWishlist(read<ProductLite[]>(WISH_KEY, []).filter((p) => p?.slug));
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setCart(read(CART_KEY, []));
      if (e.key === WISH_KEY) setWishlist(read(WISH_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (ready) write(CART_KEY, cart);
  }, [cart, ready]);
  useEffect(() => {
    if (ready) write(WISH_KEY, wishlist);
  }, [wishlist, ready]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const addToCart = useCallback((product: ProductLite, quantity: number, unit: string) => {
    setCart((c) => {
      const existing = c.find((l) => l.product.slug === product.slug);
      if (existing) return c.map((l) => (l.product.slug === product.slug ? { product, unit, quantity: l.unit === unit ? l.quantity + quantity : quantity } : l));
      return [...c, { product, quantity, unit }];
    });
    setToast(`Added “${product.name.split(" – ")[0]}” to your ${product.price != null ? "cart" : "quote list"}`);
  }, []);

  const value = useMemo<ShopState>(
    () => ({
      ready,
      cart,
      wishlist,
      toast,
      addToCart,
      updateLine: (slug, patch) => setCart((c) => c.map((l) => (l.product.slug === slug ? { ...l, ...patch } : l))),
      removeLine: (slug) => setCart((c) => c.filter((l) => l.product.slug !== slug)),
      clearCart: () => setCart([]),
      toggleWishlist: (product) =>
        setWishlist((w) => {
          const has = w.some((p) => p.slug === product.slug);
          setToast(has ? "Removed from wishlist" : "Saved to wishlist");
          return has ? w.filter((p) => p.slug !== product.slug) : [...w, product];
        }),
      inWishlist: (slug) => wishlist.some((p) => p.slug === slug),
    }),
    [ready, cart, wishlist, toast, addToCart],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        {toast && <div className="pointer-events-auto rounded-md bg-steel-900 px-4 py-3 text-sm font-medium text-white shadow-lg">{toast}</div>}
      </div>
    </Ctx.Provider>
  );
}

export function useShop() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShop must be used inside ShopStateProvider");
  return ctx;
}
