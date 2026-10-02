"use client";

import { useCart } from "@/components/cart/CartProvider";

/** Item-count pill on the cart icon. */
export function CartBadge() {
  const { count, hydrated } = useCart();

  // Render nothing until localStorage has been read, so the server and client
  // markup match on first paint.
  if (!hydrated || count === 0) return null;

  return (
    <span className="absolute -right-0.5 -top-0.5 flex size-[1.15rem] items-center justify-center rounded-full bg-accent-400 text-[0.6rem] font-bold text-ink-950">
      {count > 99 ? "99+" : count}
    </span>
  );
}
