"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the user's `prefers-reduced-motion` setting.
 *
 * Starts as `false` so the server and the first client render always agree,
 * then syncs to the real value after mount. Components that must *animate*
 * (rather than purely decorate with CSS) use this to scale their motion back.
 *
 * The CSS-level opt-out in `globals.css` still applies on top of this, so a
 * reduced-motion visitor sees a static UI even before this hook resolves.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => setReduced(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}