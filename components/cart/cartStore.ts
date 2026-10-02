"use client";

import { MAX_QUANTITY } from "@/lib/cart-limits";
import type { CartItem } from "@/lib/types";

/**
 * Client-side cart store, backed by localStorage.
 *
 * The cart is intentionally not in Supabase: it is a pre-checkout basket.
 * What becomes durable is the order, written server-side at checkout.
 *
 * A cart line is uniquely identified by product + selected size, so choosing a
 * different size adds a separate line rather than silently changing the first.
 *
 * MAX_QUANTITY is shared with the checkout Server Action so the server enforces
 * exactly the same bound the UI applies.
 */

const STORAGE_KEY = "threads-ng.cart.v1";

/** Stable empty reference, so the server snapshot never changes identity. */
const EMPTY: CartItem[] = [];

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(value)));
}

/** Defensive parse: anything unexpected in storage is discarded. */
function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const items: CartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Partial<CartItem>;
    if (!e.productId || !e.name || !e.size) continue;
    const price = Number(e.price);
    if (!Number.isFinite(price) || price < 0) continue;
    items.push({
      productId: String(e.productId),
      name: String(e.name),
      price,
      image: e.image ? String(e.image) : null,
      category: e.category ? String(e.category) : null,
      size: String(e.size),
      quantity: clampQuantity(Number(e.quantity)),
    });
  }
  return items;
}

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : EMPTY;
  } catch {
    // Corrupt or unavailable storage: start with an empty cart.
    return EMPTY;
  }
}

let state: CartItem[] = readStorage();
const listeners = new Set<() => void>();

function emit(next: CartItem[]) {
  state = next;
  for (const listener of listeners) listener();
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the cart still works for this session.
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getSnapshot = () => state;
export const getServerSnapshot = () => EMPTY;

export function addItem(item: CartItem) {
  const incoming = { ...item, quantity: clampQuantity(item.quantity) };
  const existing = state.find(
    (i) => i.productId === incoming.productId && i.size === incoming.size,
  );

  emit(
    existing
      ? state.map((i) =>
          i === existing
            ? { ...i, quantity: clampQuantity(i.quantity + incoming.quantity) }
            : i,
        )
      : [...state, incoming],
  );
}

export function removeItem(productId: string, size: string) {
  emit(state.filter((i) => !(i.productId === productId && i.size === size)));
}

export function setItemQuantity(productId: string, size: string, quantity: number) {
  emit(
    state.map((i) =>
      i.productId === productId && i.size === size
        ? { ...i, quantity: clampQuantity(quantity) }
        : i,
    ),
  );
}

export function clearCart() {
  emit(EMPTY);
}
