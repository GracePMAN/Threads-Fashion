"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { ProductImage } from "@/components/ProductImage";
import { placeOrder, type PlaceOrderState } from "@/app/checkout/actions";
import { OrderConfirmation } from "@/components/order/OrderConfirmation";
import { beginActionLoading, endActionLoading } from "@/components/ui/ActionLoading";
import { formatNaira } from "@/lib/money";

interface CheckoutFormProps {
  customerName: string;
  customerEmail: string;
}

const EMPTY = { fullName: "", phone: "", address: "", city: "", state: "" };

/**
 * Checkout form.
 *
 * Sends only product ids, sizes and quantities to the server; the order total
 * is recalculated there from database prices.
 */
export function CheckoutForm({ customerName, customerEmail }: CheckoutFormProps) {
  const { items, hydrated, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({ ...EMPTY, fullName: customerName });
  const [state, setState] = useState<PlaceOrderState>({ status: "idle", message: "" });

  function update(field: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Only ids, sizes and quantities leave the browser. Prices and totals are
    // recomputed server-side from the database.
    const lines = items.map((i) => ({
      productId: i.productId,
      size: i.size,
      quantity: i.quantity,
    }));

    startTransition(async () => {
      // The small in-app THREADS NG loading card, shown only while the order is
      // genuinely being processed. The submit button, its `disabled` state and
      // the Server Action itself are all left exactly as they were.
      const token = beginActionLoading("Processing order...");

      try {
        const result = await placeOrder(lines, form);

        if (result.status === "success") {
          // Empty the basket only once the order is safely persisted.
          clearCart();
          setState(result);
          router.refresh();
          return;
        }

        setState(result);
      } finally {
        endActionLoading(token);
      }
    });
  }

  if (!hydrated) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="h-96 animate-pulse rounded-xl bg-ink-800/50" />
        <div className="h-64 animate-pulse rounded-xl bg-ink-800/50" />
      </div>
    );
  }

  if (items.length === 0 && state.status !== "success") {
    return (
      <div className="rounded-xl border border-dashed border-ink-700 px-6 py-20 text-center">
        <h2 className="text-lg font-bold text-bone-50">Your cart is empty</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-400">
          Add something to your cart before checking out.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-accent-400 px-7 text-sm font-bold text-ink-950 transition-colors hover:bg-accent-300"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  // ------------------------------------------------------------ *
  // Success state
  // ------------------------------------------------------------ */
  if (state.status === "success" && state.orderId) {
    return (
      <OrderConfirmation
        orderId={state.orderId}
        total={subtotal}
        createdAt={state.createdAt}
        emailSent={state.emailSent}
        firstName={form.fullName ? form.fullName.split(" ")[0] : undefined}
      />
    );
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start"
    >
      {/* Customer details */}
      <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-6 sm:p-7">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-bone-50">
          Delivery details
        </h2>

        {state.status === "error" && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {state.message}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <Field id="fullName" label="Full name" value={form.fullName}
            onChange={(v) => update("fullName", v)} autoComplete="name" required />
          <Field id="phone" label="Phone number" value={form.phone}
            onChange={(v) => update("phone", v)} autoComplete="tel" type="tel"
            placeholder="0803 000 0000" required />
          <Field id="address" label="Delivery address" value={form.address}
            onChange={(v) => update("address", v)} autoComplete="street-address"
            placeholder="Street, area, landmark" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="city" label="City" value={form.city}
              onChange={(v) => update("city", v)} autoComplete="address-level2" required />
            <Field id="state" label="State" value={form.state}
              onChange={(v) => update("state", v)} autoComplete="address-level1"
              placeholder="Lagos" required />
          </div>
        </div>

        <p className="mt-5 text-xs text-ink-500">
          Confirmation will be emailed to{" "}
          <span className="text-ink-300">{customerEmail}</span>
        </p>
      </div>

      {/* Order summary */}
      <aside className="lg:sticky lg:top-24 rounded-xl border border-ink-800 bg-ink-900/60 p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-bone-50">
          Your order
        </h2>

        <ul className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={`${item.productId}-${item.size}`} className="flex gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-ink-800">
                <ProductImage image={item.image} name={item.name}
                  category={item.category} sizes="56px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-bone-50">{item.name}</p>
                <p className="mt-0.5 text-[0.7rem] text-ink-400">
                  {item.size} &middot; Qty {item.quantity}
                </p>
              </div>
              <p className="shrink-0 font-mono text-xs font-bold text-bone-50">
                {formatNaira(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2.5 border-t border-ink-800 pt-4 text-sm">
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

        <button
          type="submit"
          disabled={pending}
          className="mt-6 h-12 w-full items-center justify-center rounded-full bg-accent-400 text-sm font-bold text-ink-950 transition-colors hover:bg-accent-300 disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Placing order..." : "Place order"}
        </button>

        <p className="mt-3 text-center text-[0.7rem] text-ink-500">
          Payment is collected on delivery.
        </p>
      </aside>
    </form>
  );
}

function Field({ id, label, value, onChange, required, type = "text",
  autoComplete, placeholder }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; autoComplete?: string; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-300">
        {label}
      </label>
      <input id={id} name={id} type={type} value={value} required={required}
        autoComplete={autoComplete} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 text-sm text-bone-50 placeholder:text-ink-500 transition-colors focus:border-accent-400 focus:outline-none" />
    </div>
  );
}
