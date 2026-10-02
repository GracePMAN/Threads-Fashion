"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { UserIcon } from "@/components/SiteHeader";
import { signOut } from "@/app/(auth)/actions";

/**
 * Client-side account slot in the header.
 *
 * The session lives in a cookie managed by @supabase/ssr, so it is read here
 * with the browser client. Server Components independently read the same
 * cookie, which keeps the two in agreement.
 */
export function AuthNavSlot() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setUser(data.user);
      setLoading(false);
    }

    load();

    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    // Reserve the space to stop the header shifting once the session resolves.
    return <span className="block h-10 w-10" aria-hidden />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        aria-label="Sign in"
        className="rounded-lg p-2 text-ink-200 transition-colors hover:text-accent-400"
      >
        <UserIcon />
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link
        href="/orders"
        aria-label="Your orders"
        className="flex items-center gap-2 rounded-lg p-2 text-ink-200 transition-colors hover:text-accent-400"
      >
        <UserIcon />
      </Link>

      {/* Hover/tap menu */}
      <div className="invisible absolute right-0 z-50 w-56 translate-y-1 rounded-xl border border-ink-800 bg-ink-900 p-2 opacity-0 shadow-2xl transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="border-b border-ink-800 px-3 py-2">
          <p className="truncate text-xs font-semibold text-bone-50">
            {user.user_metadata?.full_name ?? user.user_metadata?.name ?? "Customer"}
          </p>
          <p className="truncate text-[0.7rem] text-ink-400">{user.email}</p>
        </div>
        <Link
          href="/orders"
          className="block rounded-lg px-3 py-2 text-xs text-bone-100 transition-colors hover:bg-ink-800"
        >
          Order history
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-xs text-bone-100 transition-colors hover:bg-ink-800"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
