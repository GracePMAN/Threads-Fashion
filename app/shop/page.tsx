import { getProducts, getCategories } from "@/lib/queries";
import { ShopBrowser } from "@/components/shop/ShopBrowser";

export const metadata = {
  title: "Shop all",
  description:
    "Browse the full THREADS NG collection. T-shirts, hoodies, trousers, sneakers, caps and bags priced in Naira.",
};

interface ShopPageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category, q } = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <div className="shell py-10 lg:py-14">
      <header className="mb-9">
        <p className="eyebrow">Collection</p>
        <h1 className="section-title mt-3">Shop all</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-400">
          {products.length} styles in heavyweight cotton, brushed fleece and
          full-grain leather. Every price is in Nigerian Naira.
        </p>
      </header>

      <ShopBrowser
        products={products}
        categories={categories}
        initialCategory={category ?? "All"}
        initialQuery={q ?? ""}
      />
    </div>
  );
}
