"use client";

import { useMemo, useState } from "react";
import type { ProductWithRating } from "@/lib/types";
import { ProductGrid } from "@/components/ProductCard";
import { SearchIcon } from "@/components/SiteHeader";

interface ShopBrowserProps {
  products: ProductWithRating[];
  categories: string[];
  /** Category supplied in the URL on first render. */
  initialCategory: string;
  /** Search term supplied in the URL on first render. */
  initialQuery: string;
}

const ALL = "All";

/**
 * Client-side search + category filtering over the already-loaded catalogue.
 *
 * Filtering happens in the browser because the whole 30-item catalogue is
 * rendered on the server, so there is no need for a round trip per keystroke.
 */
export function ShopBrowser({
  products,
  categories,
  initialCategory,
  initialQuery,
}: ShopBrowserProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(
    categories.includes(initialCategory) ? initialCategory : ALL,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((p) => {
      if (category !== ALL && p.category !== category) return false;
      if (!q) return true;

      // Search across the product's relevant text: name, category, description.
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, category]);

  const hasFilters = query.trim() !== "" || category !== ALL;

  function reset() {
    setQuery("");
    setCategory(ALL);
  }

  return (
    <div>
      {/* ---------------------------------------------------------- *
       * Search + category controls
       * ---------------------------------------------------------- */}
      <div className="mb-8 space-y-5">
        <div className="relative">
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-400" />
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for hoodies, tees, sneakers…"
            autoComplete="off"
            className="h-12 w-full rounded-full border border-ink-700 bg-ink-900 pl-12 pr-4 text-sm text-bone-50 placeholder:text-ink-500 transition-colors focus:border-accent-400 focus:outline-none"
          />
        </div>

        {/* Horizontally scrollable on mobile, wrapped on larger screens. */}
        <div
          role="group"
          aria-label="Filter by category"
          className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {[ALL, ...categories].map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "border-accent-400 bg-accent-400 text-ink-950"
                    : "border-ink-700 text-bone-100 hover:border-ink-500"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-ink-400" aria-live="polite">
          Showing <span className="font-semibold text-bone-100">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "product" : "products"}
          {category !== ALL && (
            <>
              {" "}in <span className="font-semibold text-bone-100">{category}</span>
            </>
          )}
          {query.trim() && (
            <>
              {" "}matching{" "}
              <span className="font-semibold text-bone-100">“{query.trim()}”</span>
            </>
          )}
        </p>
      </div>

      {/* ---------------------------------------------------------- *
       * Results
       * ---------------------------------------------------------- */}
      <ProductGrid products={filtered} emptyState={<EmptyState hasFilters={hasFilters} onReset={reset} />} />
    </div>
  );
}

function EmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-700 px-6 py-20 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-ink-800">
        <SearchIcon className="size-5 text-ink-400" />
      </div>
      <h2 className="mt-5 text-lg font-bold text-bone-50">
        {hasFilters ? "No products match your search" : "No products yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-400">
        {hasFilters
          ? "Try a different keyword, or clear the filters to browse the full collection."
          : "The collection is being restocked. Please check back shortly."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex h-10 items-center rounded-full border border-ink-700 px-6 text-xs font-semibold text-bone-100 transition-colors hover:border-accent-400 hover:text-accent-400"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
