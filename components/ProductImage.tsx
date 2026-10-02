import Image from "next/image";
import { categoryTheme, productImageUrl, productSlug } from "@/lib/catalog";

interface ProductImageProps {
  image: string | null | undefined;
  name: string | null | undefined;
  category: string | null | undefined;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Renders a product photo from the public "product-images" Supabase Storage
 * bucket, falling back to a branded, category-tinted panel when the product has
 * no image on record. Uploads to the bucket will appear here automatically.
 */
export function ProductImage({
  image,
  name,
  category,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  className = "",
}: ProductImageProps) {
  const src = productImageUrl(image);
  const alt = name ? `${name} by THREADS NG` : "THREADS NG product";
  const theme = categoryTheme(category);

  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }

  // Branded placeholder: initial monogram over a category gradient.
  const monogram = (name ?? "T")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex h-full w-full items-center justify-center ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
      }}
    >
      <div className="flex flex-col items-center gap-2 px-4 text-center">
        <span
          className="font-mono text-3xl font-bold tracking-tight opacity-80 sm:text-4xl"
          style={{ color: theme.ink }}
          aria-hidden
        >
          {monogram || "T"}
        </span>
        <span
          className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] opacity-70 sm:text-[0.65rem]"
          style={{ color: theme.ink }}
        >
          {category ?? "Threads NG"}
        </span>
      </div>
      {/* Decorative texture so the grid does not look flat while empty. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 7px)",
        }}
      />
    </div>
  );
}

/** Builds a stable alt text for a product name. */
export function productAlt(name: string | null | undefined): string {
  return name ? `${name} (${productSlug(name)})` : "THREADS NG product";
}
