import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review the items in your THREADS NG cart before checking out.",
};

export default function CartPage() {
  return <CartView />;
}
