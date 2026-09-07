import { closeExpiredAuctions } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CountdownBadge from "@/components/CountdownBadge";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const db = closeExpiredAuctions();
  const products = [...db.products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const newRequests = db.requests.filter((r) => r.status === "new").length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl">Admin dashboard</h1>
          <p className="text-slate mt-1">Manage lots, pricing, and auction timing.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/requests"
            className="border border-ink-800/15 px-4 py-2.5 rounded-card hover:bg-ink-800/5 transition-colors focus-ring flex items-center gap-2"
          >
            Requests
            {newRequests > 0 && (
              <span className="bg-gold text-ink-800 text-xs font-medium rounded-full px-2 py-0.5">
                {newRequests}
              </span>
            )}
          </Link>
          <Link
            href="/admin/users"
            className="border border-ink-800/15 px-4 py-2.5 rounded-card hover:bg-ink-800/5 transition-colors focus-ring"
          >
            Users
          </Link>
          <Link
            href="/admin/orders"
            className="border border-ink-800/15 px-4 py-2.5 rounded-card hover:bg-ink-800/5 transition-colors focus-ring"
          >
            Orders
          </Link>
          <Link
            href="/admin/new"
            className="bg-gold hover:bg-gold-dark text-ink-800 font-medium px-4 py-2.5 rounded-card transition-colors focus-ring"
          >
            + Add lot
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Active lots" value={products.filter((p) => p.status === "active").length} />
        <StatCard label="Sold" value={products.filter((p) => p.status === "ended_sold").length} />
        <StatCard label="Unsold" value={products.filter((p) => p.status === "ended_unsold").length} />
        <StatCard label="Registered users" value={db.users.length} />
      </div>

      <div className="border border-ink-800/10 rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-paper">
            <tr>
              <Th>Lot</Th>
              <Th>Cost</Th>
              <Th>Margin</Th>
              <Th>Min price</Th>
              <Th>Current bid</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-ink-800/10">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-ink-800/5">
                <td className="px-4 py-3">
                  <Link href={`/product/${p.id}`} className="hover:text-gold-dark font-medium">
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono">Rs. {p.cost_price.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono">{p.margin_percent}%</td>
                <td className="px-4 py-3 font-mono">Rs. {p.min_price.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono">
                  {p.current_highest_bid ? `Rs. ${p.current_highest_bid.toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <CountdownBadge endTime={p.end_time} status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide">{children}</th>;
}

function StatCard({ label, value }) {
  return (
    <div className="border border-ink-800/10 rounded-card p-5 bg-white">
      <div className="text-xs uppercase tracking-wide text-slate">{label}</div>
      <div className="font-mono text-3xl mt-1">{value}</div>
    </div>
  );
}
