import { readDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isStorageConfigured } from "@/lib/supabase/admin";
import RequestForm from "@/components/RequestForm";
import RequestList from "@/components/RequestList";

export const dynamic = "force-dynamic";

export default function RequestPage() {
  const user = getCurrentUser();

  // Logged-out visitors still see what the page is for, with a prompt to join —
  // more useful than bouncing them straight to the login screen.
  const myRequests = user
    ? readDb()
        .requests.filter((r) => r.user_id === user.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl mb-1">Looking for something?</h1>
      <p className="text-slate mb-8">
        Tell us what you want and send a photo of the kind of thing you mean. It goes straight to
        our team, and we&apos;ll try to source it for an upcoming auction.
      </p>

      {user ? (
        <RequestForm storageEnabled={isStorageConfigured()} />
      ) : (
        <div className="bg-ink-800/5 border border-ink-800/10 rounded-card p-6">
          <p className="text-sm">
            <a href="/login" className="text-gold-dark font-medium hover:underline">
              Log in
            </a>{" "}
            or{" "}
            <a href="/register" className="text-gold-dark font-medium hover:underline">
              create an account
            </a>{" "}
            to send us a request. We need a way to reach you when we find it.
          </p>
        </div>
      )}

      {user && (
        <section className="mt-12">
          <h2 className="font-display text-xl mb-4">Your requests</h2>
          <RequestList
            requests={myRequests}
            emptyMessage="You haven't sent any requests yet."
          />
        </section>
      )}
    </div>
  );
}
