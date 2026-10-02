import type { Metadata } from "next";
import { getProducts, getCategories } from "@/lib/queries";
import { ShopBrowser } from "@/components/shop/ShopBrowser";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the THREADS NG collection by name, category or description.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <div className="shell py-10 lg:py-14">
      <header className="mb-9">
        <p className="eyebrow">Find a piece</p>
        <h1 className="section-title mt-3">Search</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-400">
          Search by product name, category or description across all{" "}
          {products.length} styles.
        </p>
      </header>

      <ShopBrowser
        products={products}
        categories={categories}
        initialCategory="All"
        initialQuery={q ?? ""}
      />
    </div>
  );
}
