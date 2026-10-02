/**
 * Order reference formatting.
 *
 * Deliberately free of server-only imports so it can be shared by Server
 * Components, Server Actions and Client Components. Keeping it out of
 * `lib/queries` is what stops `next/headers` being traced into the browser
 * bundle via the checkout Server Action.
 */
export function orderReference(orderId: string): string {
  return `TNG-${orderId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
