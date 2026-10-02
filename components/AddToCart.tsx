"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { MAX_QUANTITY } from "@/lib/cart-limits";
import type { Product } from "@/lib/types";
import { formatNaira, toNumber } from "@/lib/money";

interface AddToCartProps {
  product: Product;
  /** Compact variant used on product cards in grids. */
  compact?: boolean;
}

const DEFAULT_SIZE = "One Size";

/**
 * Size picker, quantity stepper and add-to-cart control.
 *
 * A size must be chosen before adding. Quantities are always clamped to
 * 1..MAX_QUANTITY so an invalid quantity can never reach the cart.
 */
export function AddToCart({ product, compact = false }: AddToCartProps) {
  const { addItem } = useCart();
  const sizes = product.available_sizes?.length ? product.available_sizes : [DEFAULT_SIZE];
  const needsSize = sizes.length > 1;

  const [size, setSize] = useState<string>(needsSize ? "" : sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const price = toNumber(product.price);

  function handleAdd() {
    const chosen = size || sizes[0];
    addItem({
      productId: product.id,
      name: product.name,
      price,
      image: product.image,
      category: product.category,
      size: chosen,
      quantity,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  if (compact) {
    // Card variant: link through to the product page to pick a size.
    return (
      <a
        href={`/product/${product.id}`}
        className="inline-flex items-center justify-center rounded-full bg-bone-50 px-4 py-2 text-xs font-semibold text-ink-950 transition-colors hover:bg-accent-400"
      >
        View details
      </a>
    );
  }

  return (
    <div className="space-y-5">
      {needsSize && (
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-300">
            Select size
          </legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={`min-w-14 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  size === s
                    ? "border-accent-400 bg-accent-400 text-ink-950"
                    : "border-ink-700 text-bone-100 hover:border-ink-500"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {!size && (
            <p className="mt-2 text-xs text-ink-400">Please choose a size to continue.</p>
          )}
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-300">
            Quantity
          </span>
          <div className="inline-flex items-center rounded-lg border border-ink-700">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="px-3.5 py-2 text-lg leading-none text-bone-100 transition-colors hover:text-accent-400 disabled:opacity-30"
            >
              &minus;
            </button>
            <span
              aria-live="polite"
              className="min-w-9 text-center text-sm font-semibold tabular-nums"
            >
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
              disabled={quantity >= MAX_QUANTITY}
              className="px-3.5 py-2 text-lg leading-none text-bone-100 transition-colors hover:text-accent-400 disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={handleAdd}
          disabled={needsSize && !size}
          className="h-12 w-full rounded-full bg-accent-400 px-8 text-sm font-bold text-ink-950 transition-colors hover:bg-accent-300 disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-ink-500 sm:w-auto"
        >
          {added ? "Added to cart ✓" : "Add to cart"}
        </button>
      </div>

      <p className="text-xs text-ink-400">
        {formatNaira(price)} each &middot; Subtotal {formatNaira(price * quantity)}
      </p>
    </div>
  );
}
