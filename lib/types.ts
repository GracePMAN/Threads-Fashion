/**
 * Typed models for the existing Supabase schema.
 * These mirror the tables that already exist in the project:
 *   products, orders, order_items, product_reviews
 * No schema is created or migrated by this app.
 */

export interface Product {
  id: string;
  name: string;
  description: string | null;
  /** numeric(12,2) in Postgres -> returned as a string by PostgREST */
  price: number | string;
  image: string | null;
  category: string | null;
  available_sizes: string[] | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total: number | string;
  status: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number | string;
  selected_size: string | null;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface OrderItemWithProduct extends OrderItem {
  products: Pick<Product, "id" | "name" | "image" | "category"> | null;
}

export interface OrderWithItems extends Order {
  order_items: OrderItemWithProduct[];
}

/** Aggregate rating summary attached to a product for display. */
export interface RatingSummary {
  average: number;
  count: number;
}

export type ProductWithRating = Product & { rating: RatingSummary };

/** A line item in the client-side cart, before it becomes an order_item. */
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
  size: string;
  quantity: number;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}
