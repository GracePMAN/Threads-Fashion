import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrderForUser } from "@/lib/queries";
import { orderReference } from "@/lib/order-ref";
import { formatDate, formatNaira } from "@/lib/money";
import { ThreadsLogo } from "@/components/brand/ThreadsLogo";
import { ThreadsBag } from "@/components/brand/ThreadsBag";
import {
  OrderTrackingTimeline,
  type TrackingStage,
} from "@/components/order/OrderTrackingTimeline";
import { BRAND } from "@/lib/brand";

interface TrackingPageProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: TrackingPageProps): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Track order ${orderReference(orderId)}`,
    description: `Track the progress of your ${BRAND.name} order.`,
  };
}

/**
 * Order tracking.
 *
 * Scope, deliberately: this page shows the state of an order inside the store.
 * It is NOT live courier tracking. There is no GPS, no courier name, no ETA and
 * no tracking number, because none of that data exists in the schema and none of
 * it is invented here. The first stage is complete because the order row really
 * does exist; the rest stay pending until the store updates them.
 *
 * Access control: authentication is required, and the lookup is additionally
 * scoped to `user_id`, so one customer can never read another's order. The
 * existing Row Level Security policies back this up at the database level.
 */
export default async function OrderTrackingPage({ params }: TrackingPageProps) {
  const { orderId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/orders/${orderId}/tracking`)}`);
  }

  const order = await getOrderForUser(user.id, orderId);

  // Unknown id, or an order belonging to somebody else: both look the same.
  if (!order) notFound();

  const reference = orderReference(order.id);
  const itemCount = order.order_items.reduce((n, i) => n + i.quantity, 0);

  // Only the first stage reflects something real. Everything downstream is
  // pending and deliberately carries no timestamp.
  const stages: TrackingStage[] = [
    {
      label: "Order received successfully",
      done: true,
      at: order.created_at,
      note: "We have your order and sent a confirmation to your email.",
    },
    {
      label: "Waiting for order to be packaged",
      done: false,
      note: "Your pieces are being gathered in the Lagos studio.",
    },
    {
      label: "Order packaged",
      done: false,
      note: "We will note the time once your order is wrapped and checked.",
    },
    {
      label: "Order shipped",
      done: false,
      note: "This updates when your order leaves us.",
    },
    {
      label: "Out for delivery",
      done: false,
      note: "This updates on the day your order is out for delivery.",
    },
    {
      label: "Delivered successfully",
      done: false,
      note: "We will mark this as complete once your order arrives.",
    },
  ];

return (
    <div className="shell py-10 lg:py-14">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400 transition-colors hover:text-accent-400"
      >
        <span aria-hidden>&larr;</span> All orders
      </Link>

      {/* Brand header + order identity */}
      <header className="mt-7 flex flex-col items-center text-center">
        <ThreadsLogo variant="compact" height={30} priority onDark />

        <ThreadsBag height={128} priority className="mt-6 h-auto w-auto" />

        <p className="eyebrow mt-6">Order tracking</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-bone-50 sm:text-3xl">
          {reference}
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          Placed {formatDate(order.created_at)} &middot; {itemCount}{" "}
          {itemCount === 1 ? "item" : "items"} &middot;{" "}
          <span className="font-semibold text-accent-400">{formatNaira(order.total)}</span>
        </p>
      </header>

      <div className="mx-auto mt-10 grid w-full max-w-4xl gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Timeline */}
        <section
          aria-labelledby="timeline-heading"
          className="rounded-2xl border border-ink-800 bg-ink-900/50 p-6 sm:p-8"
        >
          <h2
            id="timeline-heading"
            className="text-sm font-bold uppercase tracking-[0.16em] text-bone-50"
          >
            Progress
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-500">
            Stages update here as your order moves through the studio. This page
            shows your order&apos;s status with us, not live courier tracking.
          </p>

          <div className="mt-7">
            <OrderTrackingTimeline stages={stages} />
          </div>
        </section>

        {/* Items summary */}
        <section
          aria-labelledby="items-heading"
          className="rounded-2xl border border-ink-800 bg-ink-900/50 p-6 sm:p-8"
        >
          <h2
            id="items-heading"
            className="text-sm font-bold uppercase tracking-[0.16em] text-bone-50"
          >
            In this order
          </h2>

          <ul className="mt-5 space-y-4">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4">
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

          <dl className="mt-6 space-y-2.5 border-t border-ink-800 pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-400">Order total</dt>
              <dd className="font-mono font-bold text-accent-400">
                {formatNaira(order.total)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">Payment</dt>
              <dd className="font-semibold text-bone-50">On delivery</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link
          href="/orders"
          className="inline-flex h-11 items-center justify-center rounded-full bg-accent-400 px-6 text-sm font-bold text-ink-950 transition-colors hover:bg-accent-300"
        >
          All orders
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-11 items-center justify-center rounded-full border border-ink-700 px-6 text-sm font-semibold text-bone-100 transition-colors hover:border-ink-500"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
