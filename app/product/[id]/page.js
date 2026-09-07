import { closeExpiredAuctions } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isStorageConfigured } from "@/lib/supabase";
import CountdownBadge from "@/components/CountdownBadge";
import BidForm from "@/components/BidForm";
import ProductComments from "@/components/ProductComments";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ProductPage({ params }) {
  const db = closeExpiredAuctions();
  const product = db.products.find((p) => p.id === Number(params.id));
  if (!product) notFound();

  const bids = db.bids
    .filter((b) => b.product_id === product.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const comments = db.comments
    .filter((c) => c.product_id === product.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const user = getCurrentUser();
  const currentBid = product.current_highest_bid || product.min_price;
  const label = product.current_highest_bid ? "Current bid" : "Starting bid";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="aspect-[4/3] bg-ink-800/5 rounded-card overflow-hidden">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate">No image</div>
            )}
          </div>
        </div>

        <div>
          <CountdownBadge endTime={product.end_time} status={product.status} />
          <h1 className="font-display text-3xl mt-4 mb-3">{product.title}</h1>
          <p className="text-slate leading-relaxed mb-6">{product.description}</p>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-xs uppercase tracking-wide text-slate">{label}</span>
          </div>
          <div className="font-mono text-4xl font-medium mb-6">
            Rs. {currentBid.toLocaleString()}
          </div>

          <BidForm product={product} isLoggedIn={!!user} />

          {product.status === "ended_sold" && user && product.highest_bidder_id === user.id && (
            <div className="mt-4 bg-signal-go/10 border border-signal-go/30 text-signal-go rounded-card p-4 text-sm">
              🎉 You won this auction! Head to{" "}
              <a href="/admin/orders" className="underline font-medium">
                your orders
              </a>{" "}
              — payment isn't connected yet, checkout will be enabled once the payment gateway is added.
            </div>
          )}

          <div className="mt-10">
            <h2 className="font-display text-xl mb-4">Bid history</h2>
            {bids.length === 0 ? (
              <p className="text-slate text-sm">No bids yet — be the first.</p>
            ) : (
              <ul className="divide-y divide-ink-800/10 border border-ink-800/10 rounded-card overflow-hidden">
                {bids.map((bid) => (
                  <li key={bid.id} className="flex justify-between items-center px-4 py-3 text-sm bg-white">
                    <span>{bid.bidder_name}</span>
                    <span className="font-mono">Rs. {bid.amount.toLocaleString()}</span>
                    <span className="text-slate text-xs">
                      {new Date(bid.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Only the fields the comment UI needs — no need to ship the rest of the
          user record to the browser. */}
      <ProductComments
        productId={product.id}
        comments={comments}
        currentUser={user ? { id: user.id, name: user.name, role: user.role } : null}
        storageEnabled={isStorageConfigured()}
      />
    </div>
  );
}
