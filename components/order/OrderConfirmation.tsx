"use client";

import { ThreadsBag } from "@/components/brand/ThreadsBag";
import Link from "next/link";
import { orderReference } from "@/lib/order-ref";
import { formatDate, formatNaira } from "@/lib/money";
import { BRAND } from "@/lib/brand";

interface OrderConfirmationProps {
  /** The real order id returned by the checkout Server Action. */
  orderId: string;
  /** Total charged, used only as a reassuring summary line. */
  total?: number | string | null;
  /** Real `created_at` from the order row. */
  createdAt?: string | null;
  /** False when the Mailgun confirmation email failed to send. */
  emailSent?: boolean;
  /** First name, for the thank-you line. */
  firstName?: string;
}

/**
 * Order confirmation card.
 *
 * The approved THREADS NG shopping bag is the primary visual — not a generic
 * success tick, emoji or illustration. The order number shown is derived from
 * the real id the checkout flow returned; nothing is hard-coded.
 */
export function OrderConfirmation({
  orderId,
  total,
  createdAt,
  emailSent,
  firstName,
}: OrderConfirmationProps) {
  const reference = orderReference(orderId);

  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-accent-400/30 bg-ink-900/70">
      {/* Bag visual. Fixed, restrained size so it does not dominate the screen. */}
      <div className="relative flex justify-center overflow-hidden border-b border-ink-800 bg-ink-950 px-6 pt-7">
        {/* Soft brand glow behind the bag. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 size-64 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ backgroundColor: "#b4e63c" }}
        />
        <ThreadsBag height={196} priority className="relative h-auto w-auto" />
      </div>

      <div className="p-7 text-center sm:p-9">
        <p className="eyebrow">{BRAND.name}</p>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-bone-50">
          Order confirmed
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">
          {firstName ? `Thank you, ${firstName}. ` : "Thank you. "}
          Your order has been received successfully.
        </p>

        {/* Real order number, derived from the real order id. */}
        <div className="mt-6 rounded-xl border border-ink-800 bg-ink-950/60 px-5 py-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-500">
            Order number
          </p>
          <p className="mt-1.5 font-mono text-xl font-bold tracking-tight text-accent-400">
            {reference}
          </p>
          {createdAt && (
            <p className="mt-1.5 text-xs text-ink-500">Placed {formatDate(createdAt)}</p>
          )}
          {total != null && (
            <p className="mt-2 text-sm font-semibold text-bone-50">
              {formatNaira(total)} &middot; payment on delivery
            </p>
          )}
        </div>

        {emailSent === false && (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            We could not send the confirmation email just now. Your order is saved
            and you can view it any time in your order history.
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/orders/${orderId}/tracking`}
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent-400 px-6 text-sm font-bold text-ink-950 transition-colors hover:bg-accent-300"
          >
            Track your order
          </Link>

          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-full border border-ink-700 px-6 text-sm font-semibold text-bone-100 transition-colors hover:border-ink-500"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}