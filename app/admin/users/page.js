import { readDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Every registered account. Signups are written to data/db.json by
 * /api/auth/register; this page is how you actually see them.
 *
 * Password hashes are deliberately never sent to the browser — only the
 * counts and contact details an admin needs.
 */
export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const db = readDb();
  const users = [...db.users]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      bids: db.bids.filter((b) => b.user_id === u.id).length,
      orders: db.orders.filter((o) => o.user_id === u.id).length,
      requests: db.requests.filter((r) => r.user_id === u.id).length,
    }));

  const buyers = users.filter((u) => u.role !== "admin").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl">Registered users</h1>
          <p className="text-slate mt-1">
            Everyone who has signed up, newest first.
          </p>
        </div>
        <Link
          href="/admin"
          className="border border-ink-800/15 px-4 py-2.5 rounded-card hover:bg-ink-800/5 transition-colors focus-ring shrink-0"
        >
          Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total accounts" value={users.length} />
        <StatCard label="Buyers" value={buyers} />
        <StatCard label="Admins" value={users.length - buyers} />
      </div>

      <div className="border border-ink-800/10 rounded-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-paper">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Bids</Th>
              <Th>Orders</Th>
              <Th>Requests</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-ink-800/10">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-ink-800/5">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">
                  <a href={`mailto:${u.email}`} className="hover:text-gold-dark underline">
                    {u.email}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      u.role === "admin"
                        ? "bg-gold/20 text-gold-dark"
                        : "bg-ink-800/10 text-ink-800"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono">{u.bids}</td>
                <td className="px-4 py-3 font-mono">{u.orders}</td>
                <td className="px-4 py-3 font-mono">{u.requests}</td>
                <td className="px-4 py-3 text-slate whitespace-nowrap">
                  {new Date(u.created_at).toLocaleDateString()}
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
