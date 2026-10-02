import Link from "next/link";
import type { ProductWithRating } from "@/lib/types";
import { formatNaira } from "@/lib/money";
import { ProductImage } from "@/components/ProductImage";
import { Stars } from "@/components/Stars";

interface ProductCardProps {
  product: ProductWithRating;
  priority?: boolean;
}

/** Product tile used on the homepage and the shop grid. */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  return (
    <article className="group relative">
      <Link
        href={`/product/${product.id}`}
        className="block focus-visible:outline-2 focus-visible:outline-accent-400"
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-ink-800 ring-1 ring-ink-800 transition-all duration-300 group-hover:ring-accent-400/40">
          <ProductImage
            image={product.image}
            name={product.name}
            category={product.category}
            priority={priority}
            className="transition-transform duration-500 group-hover:scale-105"
          />

          {product.category && (
            <span className="absolute left-3 top-3 rounded-full bg-ink-950/70 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-bone-100 backdrop-blur-sm">
              {product.category}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold leading-snug text-bone-50 transition-colors group-hover:text-accent-400">
            {product.name}
          </h3>
          <p className="shrink-0 text-sm font-bold text-accent-400">
            {formatNaira(product.price)}
          </p>
        </div>

        <div className="mt-1.5">
          <Stars value={product.rating.average} count={product.rating.count} size="sm" />
        </div>
      </Link>
    </article>
  );
}

/** Responsive product grid: 2 cols mobile, 3 tablet, 4 desktop. */
export function ProductGrid({
  products,
  emptyState,
}: {
  products: ProductWithRating[];
  emptyState?: React.ReactNode;
}) {
  if (products.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < 4} />
      ))}
    </div>
  );
}
