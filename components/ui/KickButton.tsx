"use client";

import { useEffect, useRef } from "react";

/**
 * THREADS NG shoe/kick click interaction — the shared site-wide primitive.
 *
 * ON PRESS:
 *   1. a premium shoe graphic kicks down and lands on the control,
 *   2. the control compresses under it and rebounds,
 *   3. both settle over 440ms (inside the 300–500ms window).
 *
 * The normal action continues immediately — the shoe is pure decoration, it is
 * never awaited and never blocks anything.
 *
 * WHY A SHARED FIXED LAYER INSTEAD OF WRAPPING EVERY CONTROL
 * --------------------------------------------------------
 * This started life as a `KickButton` wrapper that had to be manually applied to
 * each CTA. With ~19 `<button>`, ~39 `href=` and ~21 `onClick` occurrences across
 * a dozen files, that only ever covered part of the site — and it injected a
 * wrapper `<span>` into the DOM, which is exactly the kind of change that risks
 * semantics and layout shift.
 *
 * So the shoe is rendered ONCE, into a `position: fixed` overlay, and moved over
 * whichever control was pressed using `getBoundingClientRect()`. Consequences:
 *
 *   - No markup is wrapped or inserted into the page. Controls stay real
 *     `<a>` / `<button>` with their real `href`, `type`, `onClick` and Server
 *     Actions. Navigation, form submission, add-to-cart, checkout and Google
 *     sign-in are all untouched.
 *   - No `preventDefault` / `stopPropagation` anywhere, so nothing is delayed or
 *     intercepted. The shoe is `pointer-events: none`.
 *   - Because it lives in a fixed overlay it cannot affect layout — no wrapper
 *     means no layout shift.
 *
 * Guards:
 *   - Disabled and `aria-disabled` controls are ignored.
 *   - `data-no-kick` opts an element out (held-down quantity steppers and
 *     carousel arrows, where a bounce per press would be noise).
 *   - `prefers-reduced-motion: reduce` disables both animations in CSS, and the
 *     shoe is never mounted at all, so the interaction is a true no-op while the
 *     click behaviour is fully preserved.
 */

const KICK_MS = 440;

/** Transient class added to the pressed control. */
const KICK_CLASS = "threads-kick--on";

/**
 * Applied to the shoe layer ONLY while a kick is playing.
 *
 * This class carries the `threads-boot-kick` animation. It must never be on the
 * element at rest, or the animation would fire once on mount and be long over
 * before the first click. At rest the layer is hidden by the base
 * `.threads-kick-shoe` rule (see `globals.css`).
 */
const SHOE_CLASS = "threads-kick-shoe--playing";

/** Rendered shoe size in px. Kept modest so it reads as a detail, not a mascot. */
const SHOE_WIDTH = 46;

/**
 * The THREADS NG shoe — a side-profile boot.
 *
 * Lime keylines over a near-black upper, matching the approved brand mark's
 * black-and-lime language. The sole is filled bone-white with a lime flash so
 * the silhouette stays legible on the app's dark controls; the original near-
 * black sole disappeared against them.
 */
export function BootGlyph({ width = SHOE_WIDTH }: { width?: number }) {
  return (
    <svg
      viewBox="0 0 40 26"
      width={width}
      height={width * 0.65}
      fill="none"
      aria-hidden
      focusable="false"
      className="block drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)]"
    >
      {/* Sole — bone white so it reads on dark, with the lime flash along it. */}
      <path
        d="M3 18.5h30.5c2 0 3.5 1.6 3.5 3.5s-1.5 3.5-3.5 3.5H6A3 3 0 0 1 3 22.5v-4Z"
        fill="#f4f2ee"
        stroke="#b4e63c"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Upper */}
      <path
        d="M5 18.5V9.2c0-.9.8-1.6 1.7-1.5l4.6.5c.8.1 1.5.5 2 1.1l1.6 2 10.5 2.2c2.4.5 4.4 1.6 5.8 3.2l1.1 1.3"
        fill="#17171a"
        stroke="#b4e63c"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Laces */}
      <path
        d="m11 13 3.5 2m1-4.5 3.5 2m1-4 3.5 2"
        stroke="#b4e63c"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Heel flash */}
      <path d="M5.5 15.5h3.2" stroke="#b4e63c" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
/**
 * TEMPORARY DIAGNOSTIC — remove after the shoe regression is resolved.
 *
 * Enable with `?kickdebug` in any non-production build. It answers the one
 * question static analysis cannot: does a real post-sign-in `pointerdown` reach
 * the shoe handler, and if not, what is stopping it.
 */
const DEBUG =
  process.env.NODE_ENV !== "production" &&
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("kickdebug");

/** Short, readable descriptor for a node, for the console output. */
function describe(node: Element | null): string | null {
  if (!node) return null;
  const el = node as HTMLElement;
  const cls = typeof el.className === "string" ? el.className.split(" ")[0] : "";
  return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""}`;
}

/**
 * Walks up from the press target to the nearest interactive element, so a press
 * on a nested `<span>` inside a button resolves to the button itself.
 */
function interactiveAncestor(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Element)) return null;
  return node.closest<HTMLElement>(
    `a[href], button, [role="button"], [role="tab"], summary, label`,
  );
}

function isInert(el: HTMLElement): boolean {
  return (
    el.hasAttribute("disabled") ||
    el.getAttribute("aria-disabled") === "true" ||
    el.dataset.noKick !== undefined
  );
}

/**
 * Resolves the shared shoe layer at press time.
 *
 * The ref is preferred, but it is not trusted on its own. `document` can outlive
 * a single mounted element (React can discard and re-create a client tree after a
 * hydration mismatch, and StrictMode remounts effects), which leaves the ref
 * pointing at a detached node. A `document` lookup always returns whatever layer
 * is genuinely in the page right now, so a stale ref can never permanently
 * disable the shoe.
 */
function resolveShoeLayer(ref: React.RefObject<HTMLDivElement | null>): HTMLElement | null {
  const node = ref.current;
  if (node && node.isConnected) return node;
  return document.querySelector<HTMLElement>("[data-kick-shoe]");
}

export function KickProvider() {
  const shoeLayer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    /* Honour reduced motion in JS as well as CSS, so the shoe is never even
       mounted for those users. Re-evaluated if the preference changes. */
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motionQuery.matches;

    const kicked = new Set<HTMLElement>();
    const timers = new Set<number>();

    const clearOne = (el: HTMLElement) => {
      el.classList.remove(KICK_CLASS);
      kicked.delete(el);
    };

    const clearAll = () => {
      for (const el of kicked) clearOne(el);
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
    };

    /** Shows the shoe just above the right side of the pressed control. */
    const showShoe = (el: HTMLElement) => {
      const layer = resolveShoeLayer(shoeLayer);

      if (DEBUG) {
        console.log("[kick] showShoe", {
          reduced,
          layerFound: !!layer,
          display: layer ? getComputedStyle(layer).display : null,
          zIndex: layer ? getComputedStyle(layer).zIndex : null,
        });
      }

      if (!layer || reduced) return;

      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;

      const shoeHeight = SHOE_WIDTH * 0.65;

      // Sit the sole just above the control's top edge, aligned toward its
      // right — the pose the original per-button wrapper used.
      layer.style.left = `${Math.max(4, r.right - SHOE_WIDTH - 10)}px`;
      layer.style.top = `${Math.max(4, r.top - shoeHeight - 6)}px`;

      // Restart the animation cleanly on rapid repeat presses.
      layer.classList.remove(SHOE_CLASS);
      void layer.offsetWidth;
      layer.classList.add(SHOE_CLASS);
    };

    const onPointerDown = (event: Event) => {
      const el = interactiveAncestor(event.target);
      if (!el || isInert(el)) return;

      clearOne(el);
      void el.offsetWidth; // force reflow so the press animation replays
      el.classList.add(KICK_CLASS);
      kicked.add(el);

      if (DEBUG) {
        console.log("[kick] handler fired", {
          target: describe(event.target as Element),
          resolved: describe(el),
          layer: describe(resolveShoeLayer(shoeLayer)),
        });
      }

      showShoe(el);
    };

    const onPointerUp = (event: Event) => {
      const el = interactiveAncestor(event.target);
      if (!el) return;

      // Hold the shoe until the animation has read, rather than snapping it away
      // on pointer-up, which would cut the effect short on a fast tap.
      const id = window.setTimeout(() => {
        clearOne(el);
        timers.delete(id);
      }, KICK_MS);
      timers.add(id);
    };

    const onSyncMotion = () => {
      reduced = motionQuery.matches;
      if (reduced) clearAll();
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("pointercancel", clearAll, { passive: true });
    motionQuery.addEventListener("change", onSyncMotion);

    /**
     * TEMPORARY DIAGNOSTIC — remove after the regression is resolved.
     *
     * A CAPTURE-phase listener on `window` runs before anything can stop the
     * event, so it always fires even if some overlay swallows it. Comparing it
     * against the bubble-phase log above isolates the failure precisely:
     *
     *   capture logs, bubble does NOT  -> an overlay intercepted the press
     *   neither logs                  -> the document listener is not attached
     *   both log, but no shoe shows   -> the layer is hidden/covered by CSS
     */
    const probe = (event: Event) => {
      const pe = event as PointerEvent;
      const hit = document.elementFromPoint(pe.clientX, pe.clientY);
      console.log("[kick] capture pointerdown", {
        target: describe(event.target as Element),
        topmostAtPoint: describe(hit),
        splashPresent: !!document.querySelector('[aria-label^="Loading THREADS"]'),
        shoeConnected: resolveShoeLayer(shoeLayer)?.isConnected ?? false,
      });
    };

    if (DEBUG) {
      console.log("[kick] provider MOUNTED — document listener attached");
      window.addEventListener("pointerdown", probe, true);
    }

    return () => {
      if (DEBUG) {
        console.log("[kick] provider UNMOUNTED — listener removed");
        window.removeEventListener("pointerdown", probe, true);
      }
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", clearAll);
      motionQuery.removeEventListener("change", onSyncMotion);
      clearAll();
    };
  }, []);

  // Behaviour plus one fixed overlay. The overlay is `aria-hidden` and inert, so
  // it adds nothing to the accessibility tree or the tab order.
  //
  // Only the base class is applied here. The `invisible` Tailwind utility is
  // deliberately NOT used: it sets `visibility: hidden`, which nothing in the
  // kick handler ever removes, so the shoe would render but stay permanently
  // invisible. Visibility at rest is owned solely by the CSS.
  return (
    <div
      ref={shoeLayer}
      data-kick-shoe
      aria-hidden
      className="threads-kick-shoe"
    >
      <BootGlyph />
    </div>
  );
}

export default KickProvider;

