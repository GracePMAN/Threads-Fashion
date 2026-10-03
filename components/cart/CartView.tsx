"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { MAX_QUANTITY } from "@/lib/cart-limits";
import { ProductImage } from "@/components/ProductImage";
import { formatNaira } from "@/lib/money";

/**
 * Cart page.
 *
 * Reads from the localStorage-backed cart provider, so quantities are always
 * clamped to 1..MAX_QUANTITY and totals are derived, never trusted from input.
 */
export function CartView() {
  const { items, hydrated, subtotal, setQuantity, removeItem } = useCart();

  // Wait for localStorage so server and client agree on first paint.
  if (!hydrated) {
    return (
      <div className="shell py-16">
        <div className="h-8 w-32 animate-pulse rounded bg-ink-800" />
        <div className="mt-8 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-ink-800/60" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return <EmptyCart />;

  return (
    <div className="shell py-10 lg:py-14">
      <h1 className="section-title">Your cart</h1>
      <p className="mt-2 text-sm text-ink-400">
        {items.length} {items.length === 1 ? "item" : "items"}
      </p>

      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
        {/* ---------------------------------------------------- *
         * Line items
         * ---------------------------------------------------- */}
        <ul className="space-y-4">
          {items.map((item) => {
            const lineTotal = item.price * item.quantity;
            return (
              <li
                key={`${item.productId}-${item.size}`}
                className="flex gap-4 rounded-xl border border-ink-800 bg-ink-900/40 p-4"
              >
                <Link
                  href={`/product/${item.productId}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-ink-800 sm:size-28"
                >
                  <ProductImage
                    image={item.image}
                    name={item.name}
                    category={item.category}
                    sizes="112px"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${item.productId}`}
                        className="text-sm font-semibold text-bone-50 hover:text-accent-400"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-ink-400">
                        Size: <span className="text-ink-200">{item.size}</span>
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-bold text-accent-400">
                      {formatNaira(lineTotal)}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="inline-flex items-center rounded-lg border border-ink-700">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        /* Held-down and repeated; a bounce per press is noise. */
                        data-no-kick
                        onClick={() =>
                          setQuantity(item.productId, item.size, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="px-3 py-1.5 text-base leading-none text-bone-100 transition-colors hover:text-accent-400 disabled:opacity-30"
                      >
                        &minus;
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        data-no-kick
                        onClick={() =>
                          setQuantity(item.productId, item.size, item.quantity + 1)
                        }
                        disabled={item.quantity >= MAX_QUANTITY}
                        className="px-3 py-1.5 text-base leading-none text-bone-100 transition-colors hover:text-accent-400 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.size)}
                      className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-400 transition-colors hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>


        {/* ---------------------------------------------------- *
         * Summary
         * ---------------------------------------------------- */}
        <aside className="lg:sticky lg:top-24 rounded-xl border border-ink-800 bg-ink-900/60 p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-bone-50">
            Order summary
          </h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-400">Subtotal</dt>
              <dd className="font-semibold text-bone-50">{formatNaira(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">Delivery</dt>
              <dd className="font-semibold text-accent-400">Free</dd>
            </div>
            <div className="flex justify-between border-t border-ink-800 pt-3">
              <dt className="font-bold text-bone-50">Total</dt>
              <dd className="font-mono text-lg font-bold text-accent-400">
                {formatNaira(subtotal)}
              </dd>
            </div>
          </dl>

          <p className="mt-2 text-[0.7rem] text-ink-500">
            Payment is collected on delivery. You will be asked to sign in before
            placing the order.
          </p>

          <Link
            href="/checkout"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-accent-400 text-sm font-bold text-ink-950 transition-colors hover:bg-accent-300"
          >
            Proceed to checkout
          </Link>

          <Link
            href="/shop"
            className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-ink-700 text-xs font-semibold text-bone-100 transition-colors hover:border-ink-500"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="shell py-16 lg:py-24">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-ink-800">
          <svg
            className="size-6 text-ink-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path d="M6 8h12l-1 12H7L6 8Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-bone-50">Your cart is empty</h1>
        <p className="mt-2 text-sm text-ink-400">
          Browse the collection and add a few pieces to get started.
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-flex h-12 items-center rounded-full bg-accent-400 px-8 text-sm font-bold text-ink-950 transition-colors hover:bg-accent-300"
        >
          Start shopping
        </Link>
      </div>
    </div>
  );
}
