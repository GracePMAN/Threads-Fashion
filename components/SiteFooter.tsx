import Link from "next/link";
import { Logo } from "@/components/SiteHeader";
import { CATEGORIES } from "@/lib/catalog";

const HELP_LINKS = [
  { href: "/orders", label: "Track your order" },
  { href: "/shop", label: "Size guide" },
  { href: "/shop", label: "Returns" },
  { href: "/shop", label: "Contact us" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-800 bg-ink-950">
      <div className="shell py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo className="text-bone-50" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
              Contemporary Nigerian fashion, built on heavyweight cotton,
              considered fits and everyday versatility. Designed in Lagos.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-ink-500">
              Lagos &middot; Abuja &middot; Port Harcourt
            </p>
          </div>

          <nav aria-labelledby="footer-shop">
            <h2 id="footer-shop" className="eyebrow">
              Shop
            </h2>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link
                    href={`/shop?category=${encodeURIComponent(c)}`}
                    className="text-sm text-ink-300 transition-colors hover:text-accent-400"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-help">
            <h2 id="footer-help" className="eyebrow">
              Help
            </h2>
            <ul className="mt-4 space-y-2.5">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-300 transition-colors hover:text-accent-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-800 pt-6 sm:flex-row">
          <p className="text-xs text-ink-500">
            &copy; {new Date().getFullYear()} THREADS NG. All rights reserved.
          </p>
          <p className="text-xs text-ink-500">
            Prices shown in Nigerian Naira (₦)
          </p>
        </div>
      </div>
    </footer>
  );
}
