import { readDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import RequestList from "@/components/RequestList";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const db = readDb();
  // The requester's email is looked up rather than copied onto the request, so
  // it stays correct if they ever change it.
  const requests = db.requests
    .map((r) => ({ ...r, user_email: db.users.find((u) => u.id === r.user_id)?.email || "" }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const counts = {
    new: requests.filter((r) => r.status === "new").length,
    reviewed: requests.filter((r) => r.status === "reviewed").length,
    closed: requests.filter((r) => r.status === "closed").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl">Customer requests</h1>
          <p className="text-slate mt-1">
            Items customers have asked us to source, newest first.
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
        <StatCard label="New" value={counts.new} />
        <StatCard label="Reviewed" value={counts.reviewed} />
        <StatCard label="Closed" value={counts.closed} />
      </div>

      <RequestList
        requests={requests}
        isAdmin
        emptyMessage="No customer requests yet. They'll appear here as soon as someone sends one."
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="border border-ink-800/10 rounded-card p-5 bg-white">
      <div className="text-xs uppercase tracking-wide text-slate">{label}</div>
      <div className="font-mono text-3xl mt-1">{value}</div>
    </div>
  );
}
