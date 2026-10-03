"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import Link from "next/link";
import { beginActionLoading, endActionLoading } from "@/components/ui/ActionLoading";
import type { Product } from "@/lib/types";
import { toNumber } from "@/lib/money";

const DEFAULT_SIZE = "One Size";

/** How long the small loading card stays up after a quick add. */
const ADD_CARD_MS = 900;

interface AddToCartButtonProps {
  product: Product;
}

/**
 * Quick-add control for product cards.
 *
 * Products with a single size (caps, bags, "One Size") are added straight from
 * the grid. Products with selectable sizes link to the product page instead,
 * because a size has to be chosen there before the item can be added.
 *
 * The product is only ever added when it has a real id, so an undefined
 * product can never reach the cart.
 */
export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (!product?.id) return null;

  const sizes = (product.available_sizes ?? []).filter(Boolean);
  const needsSize = sizes.length > 1;

  const base =
    "inline-flex h-9 w-full items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors";

  if (needsSize) {
    return (
      <Link
        href={`/product/${product.id}`}
        className={`${base} border border-ink-700 text-bone-100 hover:border-accent-400 hover:text-accent-400`}
      >
        Select size
      </Link>
    );
  }

  const size = sizes[0] ?? DEFAULT_SIZE;

  function handleAdd() {
    // The small in-app THREADS NG loading card. The cart write itself is
    // synchronous, but the UI still needs a beat to show the item landing in the
    // cart, so the card is held for a short, bounded window rather than being
    // switched on and off within a single frame (which would never be seen).
    const token = beginActionLoading("Adding to cart...");

    addItem({
      productId: product.id,
      name: product.name,
      price: toNumber(product.price),
      image: product.image,
      category: product.category,
      size,
      quantity: 1,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
    window.setTimeout(() => endActionLoading(token), ADD_CARD_MS);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-label={`Add ${product.name} to cart`}
      className={`${base} bg-bone-50 text-ink-950 hover:bg-accent-400`}
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
