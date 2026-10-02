"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/types";
import {
  addItem as storeAdd,
  clearCart as storeClear,
  getServerSnapshot,
  getSnapshot,
  removeItem as storeRemove,
  setItemQuantity,
  subscribe,
} from "@/components/cart/cartStore";

/**
 * React binding for the cart store.
 *
 * The state itself lives in `cartStore` and is read through
 * `useSyncExternalStore`, which gives a stable `[]` on the server and the real
 * cart in the browser. That keeps SSR and hydration in agreement without a
 * mount effect, and keeps persistence out of the render path.
 */

export interface CartApi {
  items: CartItem[];
  /** False during SSR; true once rendering the real, stored cart. */
  hydrated: boolean;
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string) => void;
  setQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // A second subscription whose server snapshot is `false` and client snapshot
  // is `true`: the standard way to detect that we are in the browser.
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const addItem = useCallback((item: CartItem) => storeAdd(item), []);
  const removeItem = useCallback(
    (productId: string, size: string) => storeRemove(productId, size),
    [],
  );
  const setQuantity = useCallback(
    (productId: string, size: string, quantity: number) =>
      setItemQuantity(productId, size, quantity),
    [],
  );
  const clearCart = useCallback(() => storeClear(), []);

  const value = useMemo<CartApi>(() => {
    let count = 0;
    let subtotal = 0;
    for (const item of items) {
      count += item.quantity;
      subtotal += item.price * item.quantity;
    }
    return {
      items,
      hydrated,
      count,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    };
  }, [items, hydrated, addItem, removeItem, setQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
