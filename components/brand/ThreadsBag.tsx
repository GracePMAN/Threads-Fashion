/**
 * The approved THREADS NG shopping bag visual.
 *
 * Used on the order confirmation card and the order tracking screen. This is
 * the brand asset, not a generic success icon: the handle rope, lime gusset and
 * printed TN monogram are all part of the supplied reference and are preserved.
 */

import Image from "next/image";
import { BRAND } from "@/lib/brand";

interface ThreadsBagProps {
  /** Rendered height in px. The artwork is square. */
  height?: number;
  className?: string;
  priority?: boolean;
  /**
   * Decorative by default: on the confirmation card the surrounding copy
   * already names the brand, so repeating it for screen readers is noise.
   */
  alt?: string | null;
}

export function ThreadsBag({
  height = 200,
  className = "",
  priority = false,
  alt = null,
}: ThreadsBagProps) {
  return (
    <Image
      src={BRAND.bag}
      alt={alt ?? ""}
      width={height}
      height={height}
      priority={priority}
      unoptimized
      className={className}
    />
  );
}