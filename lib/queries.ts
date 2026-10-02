import { createClient } from "@/lib/supabase/server";
import type {
  OrderWithItems,
  Product,
  ProductReview,
  ProductWithRating,
  RatingSummary,
} from "@/lib/types";
import { toNumber } from "@/lib/money";
import { sortCategories } from "@/lib/catalog";

/**
 * Server-side data access.
 *
 * Everything here runs with the caller's Supabase session, so the existing
 * Row Level Security policies decide what is visible. No service-role key is
 * used anywhere in this project.
 */

export const EMPTY_RATING: RatingSummary = { average: 0, count: 0 };

/* ------------------------------------------------------------------ *
 * Products
 * ------------------------------------------------------------------ */

const PRODUCT_COLUMNS =
  "id,name,description,price,image,category,available_sizes,created_at";

/** All products, newest first, each with its aggregated rating attached. */
export async function getProducts(): Promise<ProductWithRating[]> {
  const supabase = await createClient();
  const [{ data: products, error }, ratings] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("created_at", { ascending: false }),
    getAllRatings(),
  ]);

  if (error) {
    console.error("[threads-ng] failed to load products:", error.message);
    return [];
  }

  return (products ?? []).map((p) => ({
    ...(p as Product),
    rating: ratings[p.id] ?? EMPTY_RATING,
  }));
}

export async function getProductById(id: string): Promise<ProductWithRating | null> {
  const supabase = await createClient();
  const [{ data: product, error }, ratings] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("id", id)
      .maybeSingle(),
    getAllRatings(),
  ]);

  if (error) {
    console.error("[threads-ng] failed to load product:", error.message);
    return null;
  }
  if (!product) return null;

  return { ...(product as Product), rating: ratings[product.id] ?? EMPTY_RATING };
}

/** A handful of products for the homepage featured rail. */
export async function getFeaturedProducts(limit = 8): Promise<ProductWithRating[]> {
  const products = await getProducts();
  return products.slice(0, limit);
}

export async function getCategories(): Promise<string[]> {
  const products = await getProducts();
  return sortCategories([
    ...new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c))),
  ]);
}

/* ------------------------------------------------------------------ *
 * Ratings & reviews
 * ------------------------------------------------------------------ */

const REVIEW_COLUMNS = "id,product_id,user_id,rating,review_text,created_at,updated_at";

/** Ratings for every product, as a lookup keyed by product id. */
export async function getAllRatings(): Promise<Record<string, RatingSummary>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("product_id,rating")
    .limit(2000);

  if (error) {
    console.error("[threads-ng] failed to load ratings:", error.message);
    return {};
  }

  const totals: Record<string, { sum: number; count: number }> = {};
  for (const row of data ?? []) {
    const entry = totals[row.product_id] ?? { sum: 0, count: 0 };
    entry.sum += toNumber(row.rating);
    entry.count += 1;
    totals[row.product_id] = entry;
  }

  return Object.fromEntries(
    Object.entries(totals).map(([id, { sum, count }]) => [
      id,
      { average: count ? sum / count : 0, count },
    ]),
  );
}

export async function getReviewsForProduct(
  productId: string,
): Promise<ProductReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select(REVIEW_COLUMNS)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[threads-ng] failed to load reviews:", error.message);
    return [];
  }
  return (data ?? []) as ProductReview[];
}

/** The current user's own review for a product, if one exists. */
export async function getUserReviewForProduct(
  userId: string,
  productId: string,
): Promise<ProductReview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select(REVIEW_COLUMNS)
    .eq("product_id", productId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[threads-ng] failed to load user review:", error.message);
    return null;
  }
  return (data as ProductReview) ?? null;
}

/**
 * True when the user has actually bought the product, i.e. there is an
 * order_items row for it belonging to one of their own orders.
 * This is the review-eligibility rule.
 */
export async function hasPurchasedProduct(
  userId: string,
  productId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("id, orders!inner(user_id)")
    .eq("product_id", productId)
    .eq("orders.user_id", userId)
    .limit(1);

  if (error) {
    console.error("[threads-ng] review eligibility check failed:", error.message);
    return false;
  }
  return (data ?? []).length > 0;
}

/** Ids of every product the signed-in user has purchased. */
export async function getPurchasedProductIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("product_id, orders!inner(user_id)")
    .eq("orders.user_id", userId);

  if (error) {
    console.error("[threads-ng] failed to load purchased products:", error.message);
    return [];
  }
  return [...new Set((data ?? []).map((r) => r.product_id))];
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

const ORDER_COLUMNS =
  "id,user_id,total,status,created_at,order_items(id,order_id,product_id,quantity,price,selected_size,products(id,name,image,category))";

/**
 * Orders belonging to the signed-in user, newest first, with items embedded.
 * RLS guarantees the user_id filter cannot be bypassed from the client.
 */
export async function getOrdersForUser(userId: string): Promise<OrderWithItems[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[threads-ng] failed to load orders:", error.message);
    return [];
  }
  return (data ?? []) as unknown as OrderWithItems[];
}

export async function getOrderForUser(
  userId: string,
  orderId: string,
): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[threads-ng] failed to load order:", error.message);
    return null;
  }
  return (data as unknown as OrderWithItems) ?? null;
}
