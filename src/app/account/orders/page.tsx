import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BuyerOrders } from "@/components/buyer-orders";

export const metadata = { title: "Your orders" };

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/orders");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your orders</h1>
      <BuyerOrders />
    </div>
  );
}
