import Image from "next/image";
import { categoryTheme, productImageUrl, productSlug } from "@/lib/catalog";

interface ProductImageProps {
  image: string | null | undefined;
  name: string | null | undefined;
  category: string | null | undefined;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /**
   * How the photo fills its frame.
   *
   * - `"cover"` (default, unchanged behaviour) fills the frame and crops the
   *   overflow. Right for small square thumbnails and the wide hero collage,
   *   where a letterboxed product would look wrong.
   *
   * - `"contain"` shows the WHOLE product inside the frame with no crop. Used
   *   for the product card grid and the product detail hero, where the source
   *   art is roughly 0.58 (portrait) and the frames are wider (0.75–0.8), so
   *   `cover` was cutting ~20% off the top and bottom of every garment.
   */
  fit?: "cover" | "contain";
}

/**
 * Renders a product photo from `public/products/` or the public "product-images"
 * Supabase Storage bucket, falling back to a branded, category-tinted panel when
 * the product has no image on record.
 *
 * Every frame that hosts this component supplies `overflow-hidden`, and the
 * image is absolutely positioned to fill it, so an image can never visually
 * escape its own card.
 */
export function ProductImage({
  image,
  name,
  category,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
  className = "",
  fit = "cover",
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
        className={`${fit === "contain" ? "object-contain" : "object-cover"} ${className}`}
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
