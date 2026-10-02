/**
 * Naira (₦) money helpers.
 *
 * Postgres `numeric` columns arrive from PostgREST as strings, so every value
 * is coerced through `toNumber` before it is used in arithmetic or formatting.
 */

export const CURRENCY = "NGN";

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const nairaPreciseFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** e.g. 18000 -> "₦18,000" */
export function formatNaira(value: number | string | null | undefined): string {
  return nairaFormatter.format(Math.round(toNumber(value)));
}

/** e.g. 18000.5 -> "₦18,000.50" */
export function formatNairaPrecise(value: number | string | null | undefined): string {
  return nairaPreciseFormatter.format(toNumber(value));
}

/** e.g. 1250000 -> "₦1.25M" for tight spaces such as stat tiles. */
export function formatNairaCompact(value: number | string | null | undefined): string {
  return `₦${new Intl.NumberFormat("en-NG", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNumber(value))}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(d);
}

/** Short human label for an order status value. */
export function formatStatus(status: string | null | undefined): string {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}
