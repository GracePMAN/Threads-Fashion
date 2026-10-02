"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendOrderConfirmation } from "@/lib/mailgun";
import { orderReference } from "@/lib/order-ref";
import { toNumber } from "@/lib/money";
import { MAX_QUANTITY } from "@/lib/cart-limits";

/**
 * Checkout Server Action.
 *
 * This is the only place an order is created, and it is deliberately
 * server-side so that:
 *   - the caller must be authenticated;
 *   - prices are read from the database, never from the browser payload;
 *   - the Mailgun credentials stay on the server.
 */

export interface CheckoutLine {
  productId: string;
  size: string;
  quantity: number;
}

export interface PlaceOrderState {
  status: "idle" | "success" | "error";
  message: string;
  orderId?: string;
  emailSent?: boolean;
}

const PHONE_PATTERN = /^[0-9+\s-]{7,20}$/;

/** A cart line that has been checked against the products table. */
interface VerifiedLine {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
}

/**
 * Maps a Postgres/PostgREST failure onto a message that is safe to show a
 * customer while still naming the real cause.
 *
 * The detailed error (code, message, details, hint) is always written to the
 * server log first; this only decides what the shopper is told.
 */
function describeOrderError(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case "42501":
      // Row Level Security refused the write. This is a permissions problem on
      // the database side, not something the customer can fix.
      return "Your account is not permitted to place orders. Please contact support.";

    case "23502":
      return "We could not save your order because a required field was missing. Please contact support.";

    case "23503":
      return "We could not save your order because one of the items is no longer in our catalogue. Please contact support.";

    case "23505":
      return "We could not save your order because it duplicated an existing one. Please contact support.";

    case "22P02":
      return "We could not save your order because of an invalid value. Please contact support.";

    case "PGRST116":
      return "We could not save your order. Please contact support.";

    default:
      return "We could not save your order. Please try again.";
  }
}

function validateCustomer(input: {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}): string | null {
  if (input.fullName.trim().length < 2) return "Please enter your full name.";
  if (!PHONE_PATTERN.test(input.phone.trim())) {
    return "Please enter a valid phone number.";
  }
  if (input.address.trim().length < 5) return "Please enter your delivery address.";
  if (input.city.trim().length < 2) return "Please enter your city.";
  if (input.state.trim().length < 2) return "Please enter your state.";
  return null;
}

export async function placeOrder(
  lines: CheckoutLine[],
  customer: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
  },
): Promise<PlaceOrderState> {
  // 1. Authentication is required before an order can be placed.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Please sign in with Google before placing your order.",
    };
  }

  // 2. Validate the customer details.
  const customerError = validateCustomer(customer);
  if (customerError) return { status: "error", message: customerError };

  // 3. Validate the cart.
  if (!Array.isArray(lines) || lines.length === 0) {
    return { status: "error", message: "Your cart is empty." };
  }
  if (lines.length > 50) {
    return { status: "error", message: "Too many items in one order." };
  }

  // 4. Validate quantities and normalise sizes.
  const requested = lines.map((line) => ({
    productId: String(line.productId ?? ""),
    size: String(line.size ?? "").trim(),
    quantity: Math.floor(Number(line.quantity)),
  }));

  for (const line of requested) {
    if (!line.productId) {
      return { status: "error", message: "A cart item is missing its product." };
    }
    if (!line.size) {
      return { status: "error", message: "Please choose a size for every item." };
    }
    if (!Number.isFinite(line.quantity) || line.quantity < 1) {
      return {
        status: "error",
        message: "Invalid quantity. Quantities must be at least 1.",
      };
    }
    if (line.quantity > MAX_QUANTITY) {
      return {
        status: "error",
        message: `You can order at most ${MAX_QUANTITY} of a single item.`,
      };
    }
  }

  // 5. Resolve real prices and valid sizes from the database.
  //    The client's numbers are never trusted.
  const productIds = [...new Set(requested.map((l) => l.productId))];
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,name,price,available_sizes")
    .in("id", productIds);

  if (productError) {
    console.error("[threads-ng] checkout product lookup failed:", productError.message);
    return { status: "error", message: "We could not verify your cart. Please try again." };
  }

  const catalog = new Map((products ?? []).map((p) => [p.id, p]));
  if (catalog.size !== productIds.length) {
    return {
      status: "error",
      message: "One of the items in your cart is no longer available.",
    };
  }

  // Resolve each requested line against the catalogue. Anything invalid is
  // collected and reported before a single row is written.
  const resolved: VerifiedLine[] = [];
  for (const line of requested) {
    const product = catalog.get(line.productId);
    if (!product) {
      return { status: "error", message: "One of the items in your cart is no longer available." };
    }
    const available = product.available_sizes ?? [];
    if (available.length > 0 && !available.includes(line.size)) {
      return {
        status: "error",
        message: `${product.name} is not available in size ${line.size}.`,
      };
    }
    resolved.push({
      productId: product.id,
      name: String(product.name),
      price: toNumber(product.price),
      size: line.size,
      quantity: line.quantity,
    });
  }

  // 6. Calculate the total from verified database prices.
  const total = resolved.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // 7. Create the order, associated with the authenticated user.
  //
  // `created_at` is supplied explicitly. Most schemas default it, but supplying
  // it makes the order timestamp deterministic (it is what the confirmation
  // email reports) and keeps the insert working if the column has no default.
  const insertedAt = new Date().toISOString();
  const { error: orderError } = await supabase.from("orders").insert({
    user_id: user.id,
    total,
    status: "pending",
    created_at: insertedAt,
  });

  if (orderError) {
    console.error(
      `[threads-ng] order insert failed: code=${orderError.code} message=${orderError.message} details=${orderError.details ?? "-"} hint=${orderError.hint ?? "-"}`,
    );
    return { status: "error", message: describeOrderError(orderError) };
  }

  // Read the order back in its own query.
  //
  // This is deliberately separate from the insert above. A chained
  // `.insert().select().single()` conflates "the insert failed" with "the row
  // came back filtered", which reported a successful insert as
  // "We could not save your order" and could leave an orphaned order behind.
  const { data: order, error: orderReadError } = await supabase
    .from("orders")
    .select("id,created_at,total")
    .eq("user_id", user.id)
    .eq("created_at", insertedAt)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderReadError || !order) {
    console.error(
      `[threads-ng] order read-back failed: code=${orderReadError?.code ?? "no row"} message=${orderReadError?.message ?? "-"} details=${orderReadError?.details ?? "-"} user=${user.id} insertedAt=${insertedAt}`,
    );
    return {
      status: "error",
      message:
        "Your order was saved but we could not confirm it. Please contact support before trying again.",
    };
  }

  // 8. Create the associated order items.
  const { error: itemsError } = await supabase.from("order_items").insert(
    resolved.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      quantity: i.quantity,
      price: i.price,
      selected_size: i.size,
    })),
  );

  if (itemsError) {
    console.error(
      `[threads-ng] order_items insert failed: code=${itemsError.code} message=${itemsError.message} details=${itemsError.details ?? "-"} hint=${itemsError.hint ?? "-"}`,
    );

    // Roll the order back so a failed checkout never leaves an order with no
    // items behind. The delete is scoped to this user's own row.
    const { error: rollbackError } = await supabase
      .from("orders")
      .delete()
      .eq("id", order.id)
      .eq("user_id", user.id);

    if (rollbackError) {
      console.error(
        `[threads-ng] rollback of order ${order.id} failed: ${rollbackError.message}`,
      );
    } else {
      console.error(`[threads-ng] rolled back orphaned order ${order.id}`);
    }

    return {
      status: "error",
      message: rollbackError
        ? "We could not save the items on your order. Please contact support with your order reference."
        : "We could not save the items on your order, so the order was cancelled. Nothing was charged. Please try again.",
    };
  }

  revalidatePath("/orders");

  // 9. Trigger the Mailgun confirmation email, to the authenticated address.
  const reference = orderReference(order.id);
  const emailResult = await sendOrderConfirmation({
    to: user.email ?? "",
    customerName: customer.fullName.trim(),
    orderReference: reference,
    total,
    createdAt: order.created_at,
    items: resolved.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      size: i.size,
    })),
  });

  if (!emailResult.sent) {
    console.error(
      `[threads-ng] order ${reference} saved but confirmation email failed:`,
      emailResult.error,
    );
  }

  // 10. Hand back the order id so the UI can show the success state.
  return {
    status: "success",
    message: "Your order has been placed.",
    orderId: order.id,
    emailSent: emailResult.sent,
  };
}
