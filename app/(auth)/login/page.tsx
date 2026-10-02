import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInWithGoogle } from "@/app/(auth)/actions";
import { Logo } from "@/components/SiteHeader";
import { GoogleIcon } from "@/components/GoogleIcon";

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}

export const metadata = {
  title: "Sign in | THREADS NG",
  description: "Sign in with Google to check out and track your THREADS NG orders.",
};

const ERRORS: Record<string, string> = {
  sign_in_failed: "We could not start Google sign-in. Please try again.",
  callback_failed: "That sign-in link is no longer valid. Please try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/orders");
  }

  return (
    <div className="shell flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-8 text-center sm:p-10">
          <div className="flex justify-center">
            <Logo className="text-2xl text-bone-50" />
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-bone-50">
            Sign in to THREADS NG
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-400">
            One Google account lets you check out, keep your order history and
            review the pieces you bought.
          </p>

          {error && ERRORS[error] && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {ERRORS[error]}
            </p>
          )}

          <form action={signInWithGoogle} className="mt-7">
            <input type="hidden" name="redirectTo" value={redirectTo ?? "/orders"} />
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-bone-50 px-6 text-sm font-semibold text-ink-950 transition-colors hover:bg-accent-400"
            >
              <GoogleIcon className="size-5" />
              Continue with Google
            </button>
          </form>

          <ul className="mt-8 space-y-2 border-t border-ink-800 pt-6 text-left">
            {[
              "Your cart stays on this device",
              "Orders are saved to your account",
              "Only you can see your orders and reviews",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-xs text-ink-400">
                <svg
                  className="mt-0.5 size-3.5 shrink-0 text-accent-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                    clipRule="evenodd"
                  />
                </svg>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          You can browse and add to cart without signing in.
        </p>
      </div>
    </div>
  );
}
