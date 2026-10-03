import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrdersForUser } from "@/lib/queries";
import { orderReference } from "@/lib/order-ref";
import { ProductImage } from "@/components/ProductImage";
import { formatDate, formatNaira, formatStatus } from "@/lib/money";

export const metadata: Metadata = {
  title: "Your orders",
  description: "Track your THREADS NG orders.",
};

export default async function OrdersPage() {
  // Protected route. proxy.ts also guards this; this is the authoritative
  // check, and the query below is additionally scoped to this user id.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=%2Forders");

  const orders = await getOrdersForUser(user.id);

  const firstName =
    (user.user_metadata?.full_name as string)?.split(" ")[0] ??
    (user.user_metadata?.name as string)?.split(" ")[0] ??
    "";

  return (
    <div className="shell py-10 lg:py-14">
      <header>
        <p className="eyebrow">Account</p>
        <h1 className="section-title mt-3">
          {firstName ? `${firstName}'s orders` : "Your orders"}
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          {orders.length === 0
            ? "You have not placed an order yet."
            : `${orders.length} ${orders.length === 1 ? "order" : "orders"} placed with ${user.email}.`}
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-ink-700 px-6 py-20 text-center">
          <h2 className="text-lg font-bold text-bone-50">No orders yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-400">
            When you place an order it will appear here, and stay here after you
            sign out and come back.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-accent-400 px-7 text-sm font-bold text-ink-950 transition-colors hover:bg-accent-300"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-5">
          {orders.map((order) => {
            const itemCount = order.order_items.reduce((n, i) => n + i.quantity, 0);

            return (
              <li
                key={order.id}
                className="overflow-hidden rounded-xl border border-ink-800 bg-ink-900/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-800 bg-ink-900/70 px-5 py-4">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-500">
                      Order number
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-bone-50">
                      {orderReference(order.id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-500">
                      Date
                    </p>
                    <p className="mt-0.5 text-sm text-bone-50">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-500">
                      Status
                    </p>
                    <p className="mt-0.5">
                      <span className="rounded-full bg-accent-400/15 px-2.5 py-1 text-[0.7rem] font-semibold text-accent-400">
                        {formatStatus(order.status)}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-500">
                      Total
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-accent-400">
                      {formatNaira(order.total)}
                    </p>
                  </div>
                </div>

                <ul className="divide-y divide-ink-800">
                  {order.order_items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-ink-800">
                        <ProductImage
                          image={item.products?.image}
                          name={item.products?.name}
                          category={item.products?.category}
                          sizes="64px"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-bone-50">
                          {item.products?.name ?? "Product"}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-400">
                          Size {item.selected_size ?? "-"} &middot; Qty {item.quantity}
                        </p>
                      </div>

                      <p className="shrink-0 font-mono text-sm font-semibold text-bone-50">
                        {formatNaira(Number(item.price) * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-800 px-5 py-3.5">
                  <p className="text-xs text-ink-500">
                    {itemCount} {itemCount === 1 ? "item" : "items"} &middot; Payment on
                    delivery
                  </p>

                  {/* Uses this order's real id. No hard-coded reference. */}
                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      href={`/orders/${order.id}/tracking`}
                      className="inline-flex h-9 items-center rounded-full border border-ink-700 px-4 text-xs font-semibold text-bone-100 transition-colors hover:border-accent-400 hover:text-accent-400"
                    >
                      Track order
                    </Link>
                    {order.order_items[0] && (
                      <Link
                        href={`/product/${order.order_items[0].product_id}`}
                        className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-400 hover:underline"
                      >
                        Buy again &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
