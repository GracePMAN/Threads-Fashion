import Link from "next/link";
import { getFeaturedProducts, getCategories, getProducts } from "@/lib/queries";
import { ProductGrid } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { categoryTheme, CATEGORY_BLURBS } from "@/lib/catalog";
import { formatNairaCompact } from "@/lib/money";

export const metadata = {
  title: "THREADS NG â€” Contemporary Nigerian Fashion",
  description:
    "Shop heavyweight cotton tees, hoodies, trousers, sneakers, caps and bags. Designed in Lagos, delivered across Nigeria. Prices in Naira.",
};

export default async function HomePage() {
  const [featured, categories, allProducts] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
    getProducts(),
  ]);

  // "Drop" rail: a few different pieces from across the catalogue.
  const drop = [allProducts[9], allProducts[17], allProducts[24]].filter(Boolean);
  const totalValue = allProducts.reduce((sum, p) => sum + Number(p.price), 0);

  return (
    <>
      {/* ================================================================ *
       * Hero
       * ================================================================ */}
      <section className="relative overflow-hidden border-b border-ink-800">
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(70% 60% at 20% 10%, #1d2416 0%, transparent 60%), radial-gradient(60% 50% at 85% 80%, #1a1a22 0%, transparent 65%)",
          }}
        />

        <div className="shell relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div>
            <p className="eyebrow">New season Â· Lagos</p>
            <h1 className="mt-5 text-[clamp(2.5rem,7vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-bone-50">
              Everyday
              <br />
              streetwear,
              <br />
              <span className="text-accent-400">properly made.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-300">
              Heavyweight cotton, considered fits and pieces that survive the
              Lagos sun. {allProducts.length} styles, priced in Naira, delivered
              nationwide.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center rounded-full bg-accent-400 px-8 text-sm font-bold text-ink-950 transition-colors hover:bg-accent-300"
              >
                Shop the collection
              </Link>
              <Link
                href="/shop?category=Hoodies"
                className="inline-flex h-12 items-center rounded-full border border-ink-700 px-8 text-sm font-semibold text-bone-100 transition-colors hover:border-ink-500"
              >
                Best sellers
              </Link>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-ink-800 pt-7">
              {[
                { label: "Styles", value: String(allProducts.length) },
                { label: "Categories", value: String(categories.length) },
                { label: "Catalogue", value: formatNairaCompact(totalValue) },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-500">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 font-mono text-lg font-bold text-bone-50">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero collage: one wide frame plus two squares. */}
          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4 sm:gap-5 lg:max-w-none">
            {drop.length > 0 ? (
              <>
                <Link
                  href={`/product/${drop[0].id}`}
                  className="group relative col-span-2 aspect-[16/11] overflow-hidden rounded-2xl bg-ink-800 ring-1 ring-ink-800"
                >
                  <ProductImage
                    image={drop[0].image}
                    name={drop[0].name}
                    category={drop[0].category}
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>
                {drop.slice(1).map((product) => (
                  <Link

                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group relative aspect-square overflow-hidden rounded-2xl bg-ink-800 ring-1 ring-ink-800"
                  >
                    <ProductImage
                      image={product.image}
                      name={product.name}
                      category={product.category}
                      priority
                      sizes="(max-width: 1024px) 50vw, 22vw"
                      className="transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>
                ))}
              </>
            ) : (
              <div className="col-span-2 aspect-square rounded-2xl bg-ink-800" />
            )}
          </div>
        </div>
      </section>

      {/* ================================================================ *
       * Categories
       * ================================================================ */}
      <section className="shell py-16 lg:py-20" aria-labelledby="categories-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Browse</p>
            <h2 id="categories-heading" className="section-title mt-3">
              Shop by category
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-400 hover:underline"
          >
            All products →
          </Link>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {categories.map((category) => {
            const theme = categoryTheme(category);
            const count = allProducts.filter((p) => p.category === category).length;
            return (
              <Link
                key={category}
                href={`/shop?category=${encodeURIComponent(category)}`}
                className="group relative flex min-h-36 flex-col justify-end overflow-hidden rounded-xl p-5 ring-1 ring-inset ring-white/10 transition-all hover:ring-accent-400/50 sm:min-h-44"
                style={{
                  backgroundImage: `linear-gradient(140deg, ${theme.from} 0%, ${theme.to} 100%)`,
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.06] transition-opacity group-hover:opacity-[0.12]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 8px)",
                  }}
                />
                <p className="relative font-mono text-[0.6rem] uppercase tracking-[0.22em] text-white/60">
                  {count} {count === 1 ? "style" : "styles"}
                </p>
                <h3 className="relative mt-1.5 text-lg font-bold tracking-tight text-white sm:text-xl">
                  {category}
                </h3>
                <p className="relative mt-1 hidden text-xs leading-snug text-white/70 sm:block">
                  {CATEGORY_BLURBS[category] ?? ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================================================================ *
       * Featured products
       * ================================================================ */}
      <section
        className="border-t border-ink-800 bg-ink-900/30"
        aria-labelledby="featured-heading"
      >
        <div className="shell py-16 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Just landed</p>
              <h2 id="featured-heading" className="section-title mt-3">
                Featured pieces
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-400 hover:underline"
            >
              View all {allProducts.length} →
            </Link>
          </div>

          <div className="mt-9">
            <ProductGrid
              products={featured}
              emptyState={
                <p className="rounded-xl border border-ink-800 p-10 text-center text-sm text-ink-400">
                  No products available yet.
                </p>
              }
            />
          </div>
        </div>
      </section>

      {/* ================================================================ *
       * Brand / promo strip
       * ================================================================ */}
      <section className="shell py-16 lg:py-24" aria-labelledby="promise-heading">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="eyebrow">Why THREADS NG</p>
            <h2 id="promise-heading" className="section-title mt-3">
              Built for the long wear.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink-300">
              We keep the range tight and the materials serious. Every tee is
              heavyweight cotton, every hoodie is brushed fleece, and every
              stitch is checked before it leaves the Lagos studio.
            </p>

            <ul className="mt-8 space-y-5">
              {[
                {
                  title: "Heavyweight cotton",
                  body: "220gsm jersey that holds its shape wash after wash.",
                },
                {
                  title: "Nigerian delivery",
                  body: "Dispatched nationwide, with free delivery over ₦100,000.",
                },
                {
                  title: "Real customer reviews",
                  body: "Only verified buyers can review the pieces they bought.",
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span
                    aria-hidden
                    className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-accent-400/40 font-mono text-xs font-bold text-accent-400"
                  >
                    ✓
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-bone-50">{item.title}</h3>
                    <p className="mt-1 text-sm text-ink-400">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Promo card */}
          <div className="relative overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 p-8 sm:p-10">
            <div
              aria-hidden
              className="absolute -right-16 -top-16 size-56 rounded-full opacity-20 blur-3xl"
              style={{ backgroundColor: "#b4e63c" }}
            />
            <p className="eyebrow">Members</p>
            <h3 className="mt-4 text-2xl font-bold tracking-tight text-bone-50 sm:text-3xl">
              Sign in to track every order.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-300">
              Your order history is tied to your Google account, so you can close
              the tab, come back tomorrow, and pick up exactly where you left off.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-full bg-bone-50 px-6 text-sm font-semibold text-ink-950 transition-colors hover:bg-accent-400"
              >
                Sign in with Google
              </Link>
              <Link
                href="/orders"
                className="inline-flex h-11 items-center rounded-full border border-ink-700 px-6 text-sm font-semibold text-bone-100 transition-colors hover:border-ink-500"
              >
                View orders
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

