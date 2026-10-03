import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { CartProvider } from "@/components/cart/CartProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SplashScreen } from "@/components/brand/SplashScreen";
import { KickProvider } from "@/components/ui/KickButton";
import { AppLoadingProvider } from "@/components/ui/AppLoadingProvider";
import { ActionLoadingOverlay } from "@/components/ui/ActionLoading";
import { SPLASH_COOKIE } from "@/lib/splash";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "THREADS NG — Contemporary Nigerian Fashion",
    template: "%s | THREADS NG",
  },
  description:
    "Shop contemporary Nigerian fashion at THREADS NG. T-shirts, hoodies, trousers, sneakers, caps and bags, priced in Naira with delivery across Nigeria.",
  keywords: [
    "Nigerian fashion",
    "online clothing store",
    "THREADS NG",
    "streetwear Nigeria",
    "buy clothes Lagos",
  ],
  openGraph: {
    title: "THREADS NG — Contemporary Nigerian Fashion",
    description:
      "Heavyweight cotton, considered fits and everyday versatility. Designed in Lagos.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

/**
 * Root shell.
 *
 * THREE SEPARATE LOADING BEHAVIORS, kept deliberately distinct:
 *
 *   A. INITIAL APPLICATION LOAD -> `SplashScreen` (full-screen, LARGE card)
 *   B. USER CLICK               -> `KickProvider`    (shoe/kick microinteraction)
 *   C. SYSTEM PROCESSING        -> `ActionLoadingOverlay` (SMALL card, in-app)
 *
 * They can occur in sequence — click, shoe kicks, small card appears, operation
 * resolves — and none of them replaces another.
 *
 * WHY THE SPLASH CANNOT FLASH THE PAGE FIRST
 * The old splash only skipped rendering on the server, so SSR emitted the
 * homepage with no splash at all: the browser painted the page and only then did
 * the splash appear on top, giving `homepage -> splash -> homepage`.
 *
 * `SplashScreen` now renders on the server as an OPAQUE, `position: fixed`
 * layer, so the page underneath is never visually exposed while it is up, while
 * the page content stays fully server-rendered for crawlers. Nothing about the
 * page is faded, so nothing can be glimpsed mid-transition.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  /**
   * The splash decision is made HERE, on the server, from a cookie.
   *
   * This is what guarantees SSR and hydration agree. Previously the decision was
   * read from `sessionStorage` inside a client render path, so the server
   * rendered the splash while the client decided not to — a hydration mismatch
   * that made React discard and re-render the tree, remounting
   * `KickProvider` and losing its document-level pointer listener. That is what
   * made the shoe-kick "break after Google OAuth".
   */
  const cookieStore = await cookies();
  const alreadySeen = cookieStore.get(SPLASH_COOKIE)?.value === "1";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink-950 text-bone-50">
        {/* Owns the initial-load gate that SplashScreen reads and opens. */}
        <AppLoadingProvider>
          {/* (C) Small in-app action loading card, for genuine async work. */}
          <ActionLoadingOverlay />

          <CartProvider>
            {/* (A) Full-screen initial splash with the LARGE loading card.
                Server-decided, so it is never mismatched. */}
            <SplashScreen alreadySeen={alreadySeen} />

            {/* (B) Site-wide shoe/kick. Behaviour only, no page markup. */}
            <KickProvider />

            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
            >
              Skip to content
            </a>
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </CartProvider>
        </AppLoadingProvider>
      </body>
    </html>
  );
}

