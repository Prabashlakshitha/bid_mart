"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REQUEST_STATUS_LABELS } from "@/lib/rules";

const STATUS_STYLES = {
  new: "bg-gold/20 text-gold-dark",
  reviewed: "bg-ink-800/10 text-ink-800",
  closed: "bg-signal-go/10 text-signal-go",
};

/**
 * Renders item requests as cards. Used in two places, which is why the admin
 * controls are a prop rather than a separate component:
 *
 *  - /admin/requests  — the whole queue, with the requester's contact details
 *                       and buttons to move the request along
 *  - /request         — the customer's own requests, read-only apart from delete
 */
export default function RequestList({ requests, isAdmin = false, emptyMessage }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function setStatus(id, status) {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setError((await res.json()).error || "Could not update that request.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id) {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError((await res.json()).error || "Could not delete that request.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) {
    return <p className="text-slate text-sm">{emptyMessage}</p>;
  }

  return (
    <div>
      {error && <p className="text-signal-warn text-sm mb-3">{error}</p>}

      <ul className="space-y-4">
        {requests.map((r) => {
          const busy = busyId === r.id;
          return (
            <li
              key={r.id}
              className="bg-white border border-ink-800/10 rounded-card p-5 shadow-card flex gap-5"
            >
              {r.image_url ? (
                <a
                  href={r.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-36 aspect-[4/3] rounded-card overflow-hidden bg-ink-800/5 border border-ink-800/10 shrink-0 focus-ring"
                  title="Open full size"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.image_url}
                    alt={r.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </a>
              ) : (
                <div className="w-36 aspect-[4/3] rounded-card bg-ink-800/5 border border-ink-800/10 shrink-0 flex items-center justify-center text-slate text-xs text-center px-2">
                  No photo
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-lg leading-snug">{r.title}</h3>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                      STATUS_STYLES[r.status] || STATUS_STYLES.new
                    }`}
                  >
                    {REQUEST_STATUS_LABELS[r.status] || r.status}
                  </span>
                </div>

                <p className="text-slate leading-relaxed mt-2 whitespace-pre-line">{r.note}</p>

                <p className="text-xs text-slate mt-3">
                  {isAdmin && (
                    <>
                      <span className="font-medium text-ink-800">{r.user_name}</span>
                      {r.user_email && (
                        <>
                          {" · "}
                          <a href={`mailto:${r.user_email}`} className="underline hover:text-gold-dark">
                            {r.user_email}
                          </a>
                        </>
                      )}
                      {" · "}
                    </>
                  )}
                  {new Date(r.created_at).toLocaleString()}
                </p>

                <div className="flex items-center gap-3 mt-3 text-xs">
                  {isAdmin && r.status !== "reviewed" && (
                    <Action busy={busy} onClick={() => setStatus(r.id, "reviewed")}>
                      Mark reviewed
                    </Action>
                  )}
                  {isAdmin && r.status !== "closed" && (
                    <Action busy={busy} onClick={() => setStatus(r.id, "closed")}>
                      Close
                    </Action>
                  )}
                  {isAdmin && r.status !== "new" && (
                    <Action busy={busy} onClick={() => setStatus(r.id, "new")}>
                      Reopen
                    </Action>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    disabled={busy}
                    className="text-slate underline hover:text-signal-warn transition-colors focus-ring rounded disabled:opacity-50"
                  >
                    {busy ? "Working…" : "Delete"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Action({ busy, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="border border-ink-800/15 px-3 py-1.5 rounded-card hover:bg-ink-800/5 transition-colors focus-ring disabled:opacity-50"
    >
      {children}
    </button>
  );
}
