import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your THREADS NG order.",
};

export default async function CheckoutPage() {
  // Checkout is protected: proxy.ts also guards this, and this is the
  // authoritative check before any order UI is rendered.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=%2Fcheckout");

  const customerName =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    "";

  return (
    <div className="shell py-10 lg:py-14">
      <h1 className="section-title">Checkout</h1>
      <p className="mt-2 text-sm text-ink-400">
        Signed in as {user.email}. Your order will be saved to this account.
      </p>

      <div className="mt-9">
        <CheckoutForm
          customerName={customerName}
          customerEmail={user.email ?? ""}
        />
      </div>
    </div>
  );
}
