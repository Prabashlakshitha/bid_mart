import { readDb, closeExpiredAuctions } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  const user = getCurrentUser();
  if (!user) redirect("/login");

  closeExpiredAuctions();
  const db = readDb();

  // Admins see every order; regular users only see their own.
  const orders = db.orders
    .filter((o) => user.role === "admin" || o.user_id === user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((o) => {
      const product = db.products.find((p) => p.id === o.product_id);
      const buyer = db.users.find((u) => u.id === o.user_id);
      return { ...o, product, buyer };
    });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl mb-1">{user.role === "admin" ? "All orders" : "Your orders"}</h1>
      <p className="text-slate mb-8">Won auctions awaiting payment. Checkout will be enabled once a payment gateway is connected.</p>

      {orders.length === 0 ? (
        <p className="text-slate">No orders yet.</p>
      ) : (
        <div className="border border-ink-800/10 rounded-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-paper">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide">Lot</th>
                {user.role === "admin" && (
                  <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide">Buyer</th>
                )}
                <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide">Final price</th>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-ink-800/10">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">{o.product?.title || "—"}</td>
                  {user.role === "admin" && <td className="px-4 py-3">{o.buyer?.name || "—"}</td>}
                  <td className="px-4 py-3 font-mono">Rs. {o.final_price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="bg-signal-warn/10 text-signal-warn text-xs font-medium px-2.5 py-1 rounded-full">
                      {o.payment_status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled
                      title="Payment gateway not connected yet"
                      className="text-xs border border-ink-800/15 px-3 py-1.5 rounded-card text-slate cursor-not-allowed"
                    >
                      Pay now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
