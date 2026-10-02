import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] items-center justify-center py-20">
      <div className="max-w-md text-center">
        <p className="font-mono text-6xl font-bold text-accent-400">404</p>
        <h1 className="mt-5 text-2xl font-bold text-bone-50">Page not found</h1>
        <p className="mt-2 text-sm text-ink-400">
          That page has been moved, or the link is out of date.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex h-11 items-center rounded-full bg-accent-400 px-7 text-sm font-bold text-ink-950 transition-colors hover:bg-accent-300"
          >
            Shop the collection
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-ink-700 px-7 text-sm font-semibold text-bone-100 transition-colors hover:border-ink-500"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
