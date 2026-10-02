import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side Supabase client.
 *
 * Reads and writes the auth cookies for the current request, and forwards any
 * cookie the Supabase library refreshes so the session stays in sync.
 *
 * Must only be imported from Server Components, Server Actions and Route
 * Handlers. It reads `next/headers`, which throws if pulled into a Client
 * Component, so the server/client boundary fails loudly if this is misused.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The `proxy.ts` refresh keeps the session fresh in that case.
          }
        },
      },
    },
  );
}
