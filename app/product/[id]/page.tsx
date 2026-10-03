import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductById,
  getProducts,
  getReviewsForProduct,
  getUserReviewForProduct,
  hasPurchasedProduct,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { ProductImage } from "@/components/ProductImage";
import { Stars } from "@/components/Stars";
import { AddToCart } from "@/components/AddToCart";
import { Reviews } from "@/components/product/Reviews";
import { ProductGrid } from "@/components/ProductCard";
import { formatNaira, formatNairaPrecise } from "@/lib/money";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description:
      product.description ??
      `Shop ${product.name} by THREADS NG. ${formatNaira(product.price)}.`,
    openGraph: { title: product.name, description: product.description ?? undefined },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [reviews, ownReview, canReview, allProducts] = await Promise.all([
    getReviewsForProduct(product.id),
    user ? getUserReviewForProduct(user.id, product.id) : Promise.resolve(null),
    user ? hasPurchasedProduct(user.id, product.id) : Promise.resolve(false),
    getProducts(),
  ]);

  const currentUser = user
    ? {
        id: user.id,
        name:
          (user.user_metadata?.full_name as string) ??
          (user.user_metadata?.name as string) ??
          user.email?.split("@")[0] ??
          "Customer",
        email: user.email ?? "",
      }
    : null;

  // A few related pieces from the same category.
  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="shell py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
          <li>
            <Link href="/" className="hover:text-accent-400">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="hover:text-accent-400">
              Shop
            </Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/shop?category=${encodeURIComponent(product.category)}`}
                  className="hover:text-accent-400"
                >
                  {product.category}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li className="text-bone-100">{product.name}</li>
        </ol>
      </nav>

      {/* Product: image + buy box */}
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-800 ring-1 ring-ink-800">
            <ProductImage
              image={product.image}
              name={product.name}
              category={product.category}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              /* Portrait source art in a 4:5 frame: `contain` keeps the whole
                 garment visible instead of cropping its top and bottom. */
              fit="contain"
            />
          </div>
        </div>

        <div>
          {product.category && (
            <Link
              href={`/shop?category=${encodeURIComponent(product.category)}`}
              className="eyebrow inline-block hover:underline"
            >
              {product.category}
            </Link>
          )}

          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.02em] text-bone-50 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <p className="font-mono text-2xl font-bold text-accent-400">
              {formatNaira(product.price)}
            </p>
            <a href="#reviews" className="hover:opacity-80">
              <Stars value={product.rating.average} count={product.rating.count} />
            </a>
          </div>

          {product.description && (
            <p className="mt-6 text-sm leading-relaxed text-ink-300">
              {product.description}
            </p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-ink-800 py-5 text-xs">
            <div>
              <dt className="uppercase tracking-[0.16em] text-ink-500">Category</dt>
              <dd className="mt-1 font-semibold text-bone-50">
                {product.category ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.16em] text-ink-500">Exact price</dt>
              <dd className="mt-1 font-semibold text-bone-50">
                {formatNairaPrecise(product.price)}
              </dd>
            </div>
          </dl>

          <div className="mt-7">
            <AddToCart product={product} />
          </div>

          {/* Perks */}
          <ul className="mt-8 grid gap-3 border-t border-ink-800 pt-6 sm:grid-cols-3">
            {[
              { title: "Free over ₦100k", body: "Nationwide delivery" },
              { title: "7-day returns", body: "Unworn, with tags" },
              { title: "Secure checkout", body: "Google sign-in" },
            ].map((perk) => (
              <li key={perk.title}>
                <p className="text-xs font-semibold text-bone-50">{perk.title}</p>
                <p className="mt-0.5 text-xs text-ink-500">{perk.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-20 border-t border-ink-800 pt-14">
        <Reviews
          productId={product.id}
          reviews={reviews}
          average={product.rating.average}
          currentUser={currentUser}
          canReview={canReview}
          ownReview={ownReview}
        />
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section
          className="mt-20 border-t border-ink-800 pt-14"
          aria-labelledby="related-heading"
        >
          <h2 id="related-heading" className="section-title">
            More in {product.category}
          </h2>
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}

