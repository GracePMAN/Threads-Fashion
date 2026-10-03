"use client";

import { useEffect, useState } from "react";
import { LoadingCard } from "@/components/ui/LoadingCard";

/**
 * The ACTION loading card — the smaller sibling of the initial splash card.
 *
 * Shown whenever the system genuinely needs to process something before an
 * action can complete: adding to cart, placing an order, authenticating,
 * loading an order. It is the same design language as the splash card, at a
 * smaller scale, and it never takes over the screen unless the operation is
 * genuinely blocking.
 *
 * WHY AN EVENT BRIDGE INSTEAD OF WRAPPING COMPONENTS
 * -------------------------------------------------
 * Wrapping every async call site in a provider or a `<Suspense>`-style boundary
 * would mean touching the checkout form, the auth form and the cart — exactly
 * the Server Action and form code that must not be disturbed.
 *
 * Instead, `beginActionLoading()` / `endActionLoading()` publish a tiny DOM
 * event, and this single overlay listens for it. The call sites change by one
 * line each and keep their markup, handlers and semantics completely intact.
 *
 * `endActionLoading()` is safe to call even if nothing was started, and the
 * overlay always clears itself, so a card can never be left stranded on screen.
 */

/** Longest the card will stay up regardless of the caller, as a safety net. */
const SAFETY_MS = 12_000;

const EVENT = "threads-ng:action-loading";

interface ActionLoadingDetail {
  message: string;
  /** Optional token so a newer action supersedes an older one. */
  token?: number;
}

let activeToken = 0;

/**
 * Shows the small loading card. Returns the token needed to stop it, so a
 * caller that starts twice cannot be stopped by the first completion.
 */
export function beginActionLoading(message: string): number {
  activeToken += 1;
  const token = activeToken;

  window.dispatchEvent(
    new CustomEvent<ActionLoadingDetail>(EVENT, {
      detail: { message, token },
    }),
  );

  return token;
}

/** Hides the card if `token` is still the active one. */
export function endActionLoading(token?: number): void {
  if (token !== undefined && token !== activeToken) return;

  window.dispatchEvent(
    new CustomEvent<ActionLoadingDetail>(EVENT, {
      detail: { message: "", token: activeToken },
    }),
  );
}

export function ActionLoadingOverlay() {
  const [detail, setDetail] = useState<ActionLoadingDetail | null>(null);

  useEffect(() => {
    let safety = 0;

    const onShow = (event: Event) => {
      const next = (event as CustomEvent<ActionLoadingDetail>).detail;
      if (!next?.message) return;

      setDetail(next);

      // Hard backstop: the card always clears, even if a caller forgets.
      window.clearTimeout(safety);
      safety = window.setTimeout(
        () => setDetail(null),
        SAFETY_MS,
      );
    };

    const onHide = () => {
      window.clearTimeout(safety);
      setDetail(null);
    };

    window.addEventListener(EVENT, onShow as EventListener);
    window.addEventListener(EVENT, onHide as EventListener);

    return () => {
      window.clearTimeout(safety);
      window.removeEventListener(EVENT, onShow as EventListener);
      window.removeEventListener(EVENT, onHide as EventListener);
    };
  }, []);

  if (!detail?.message) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      /* Centred and compact: it must not feel like a full-screen takeover. */
      className="pointer-events-none fixed inset-0 z-[180] flex items-center justify-center px-6"
    >
      <div
        className="motion-safe:animate-[threads-card-in_220ms_cubic-bezier(0.22,1,0.36,1)]"
      >
        <LoadingCard variant="action" message={detail.message} announce />
      </div>
    </div>
  );
}

export default ActionLoadingOverlay;
