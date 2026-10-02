import Link from "next/link";
import { AuthNavSlot } from "@/components/AuthNavSlot";
import { CartBadge } from "@/components/CartBadge";

/** Inline wordmark. Reused in the header, footer and mobile menu. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-mono text-base font-bold uppercase tracking-[0.28em] ${className}`}
    >
      Threads<span className="text-accent-400">NG</span>
    </span>
  );
}

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=T-Shirts", label: "T-Shirts" },
  { href: "/shop?category=Hoodies", label: "Hoodies" },
  { href: "/shop?category=Sneakers", label: "Sneakers" },
];

export function SiteHeader() {
  return (
    <div className="bg-ink-950">
      {/* Announcement strip — scrolls away with the page. */}
      <div className="bg-ink-900">
        <p className="shell py-2 text-center text-[0.65rem] font-medium uppercase tracking-[0.2em] text-ink-300">
          Free delivery on orders over ₦100,000 &middot; Lagos &middot; Abuja &middot; PH
        </p>
      </div>

      {/*
        Main header — sticky so the logo, nav and icons stay visible while page
        content scrolls underneath. `bg-ink-950` is fully opaque, and the z-index
        keeps it above cards and page content.
      */}
      <header className="sticky top-0 z-50 border-b border-ink-800/80 bg-ink-950">
        <div className="shell">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" aria-label="THREADS NG home" className="shrink-0">
              <Logo className="text-bone-50" />
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs font-medium uppercase tracking-[0.16em] text-ink-200 transition-colors hover:text-accent-400"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <Link
                href="/search"
                aria-label="Search products"
                className="rounded-lg p-2 text-ink-200 transition-colors hover:text-accent-400"
              >
                <SearchIcon />
              </Link>

              {/* Auth + orders slot, filled on the client. */}
              <AuthNavSlot />

              <Link
                href="/cart"
                aria-label="Shopping cart"
                className="relative rounded-lg p-2 text-ink-200 transition-colors hover:text-accent-400"
              >
                <BagIcon />
                <CartBadge />
              </Link>
            </div>
          </div>

          {/* Mobile nav */}
          <nav
            aria-label="Primary mobile"
            className="no-scrollbar -mx-1 flex gap-5 overflow-x-auto border-t border-ink-800/70 py-3 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </div>
  );
}

export function SearchIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function BagIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function UserIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}
