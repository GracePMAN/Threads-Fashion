/**
 * Category constants + product image resolution.
 *
 * A product's `image` column may hold any of three shapes, all resolved by
 * `productImageUrl` below:
 *
 *   - a fully-qualified URL ("https://…"),
 *   - a root-relative path to a static asset in `public/` (the 30 catalogue
 *     photos in `public/products/` use this form), or
 *   - a bare object path inside the public Supabase Storage bucket
 *     "product-images" ("classic-black-tee.png").
 *
 * The Storage bucket remains supported so any future upload still works without
 * a code change.
 */

import type { Product } from "@/lib/types";

export const PRODUCT_IMAGE_BUCKET = "product-images";

/** Display order for the category rail. Matches the existing product data. */
export const CATEGORY_ORDER = [
  "T-Shirts",
  "Hoodies",
  "Trousers",
  "Sneakers",
  "Caps",
  "Bags",
] as const;

export const CATEGORIES: string[] = [...CATEGORY_ORDER];

export const CATEGORY_BLURBS: Record<string, string> = {
  "T-Shirts": "Everyday staples cut from soft, breathable cotton.",
  Hoodies: "Heavyweight fleece built for cool Harmattan evenings.",
  Trousers: "Relaxed fits, clean washes, all-day comfort.",
  Sneakers: "Court classics and runners that go the distance.",
  Caps: "Structured crowns finished with THREADS embroidery.",
  Bags: "Totes, backpacks and crossbodies for the daily carry.",
};

/** Neutral palette used for the image fallback, keyed by category. */
const CATEGORY_THEMES: Record<string, { from: string; to: string; ink: string }> = {
  "T-Shirts": { from: "#1f2937", to: "#4b5563", ink: "#f9fafb" },
  Hoodies: { from: "#3f2a2a", to: "#7c4a3f", ink: "#fff7ed" },
  Trousers: { from: "#1e2b24", to: "#3f5a45", ink: "#ecfdf5" },
  Sneakers: { from: "#111827", to: "#374151", ink: "#f3f4f6" },
  Caps: { from: "#2b2b3a", to: "#57576e", ink: "#eef2ff" },
  Bags: { from: "#332a20", to: "#6b563a", ink: "#fef3c7" },
};

const DEFAULT_THEME = { from: "#171717", to: "#3f3f46", ink: "#fafafa" };

export function categoryTheme(category: string | null | undefined) {
  return (category && CATEGORY_THEMES[category]) || DEFAULT_THEME;
}

/**
 * Turns a product's `image` value into a browser-usable URL.
 * Returns null when the product has no image on record, so callers can render
 * the branded fallback instead of a broken <img>.
 *
 * Three value shapes are supported, checked in this order:
 *
 *   1. Absolute URL (`https://…`)        -> returned unchanged.
 *   2. Inline data URI (`data:…`)        -> returned unchanged.
 *   3. Root-relative public path (`/…`)  -> returned unchanged.
 *      The 30 catalogue photos ship as static assets in `public/products/`, so a
 *      value like `/products/01-essential-black-tee.webp` is served by Next.js
 *      from the filesystem. Without this branch such a value would fall through
 *      to the Storage builder below and 404 against the Supabase bucket.
 *   4. Anything else                      -> treated as a bare object path inside
 *      the "product-images" Storage bucket and expanded against the Supabase URL.
 */
export function productImageUrl(image: string | null | undefined): string | null {
  if (!image) return null;
  const value = String(image).trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("data:")) return value;

  // Static asset served from `public/` — already a usable, browser-ready URL.
  if (value.startsWith("/")) return value;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const path = value.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`;
}

/** Stable slug used for placeholder gradients and alt text fallbacks. */
export function productSlug(name: string | null | undefined): string {
  return (name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Sort order for categories, so the UI stays stable as data changes. */
export function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a as (typeof CATEGORY_ORDER)[number]);
    const bi = CATEGORY_ORDER.indexOf(b as (typeof CATEGORY_ORDER)[number]);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function productsForCategory(products: Product[], category: string | null): Product[] {
  if (!category || category === "All") return products;
  return products.filter((p) => p.category === category);
}
