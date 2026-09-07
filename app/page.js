import { closeExpiredAuctions } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const db = closeExpiredAuctions();
  const products = [...db.products].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  const active = products.filter((p) => p.status === "active");
  const ended = products.filter((p) => p.status !== "active");

  return (
    <div>
      <section className="border-b border-ink-800/10">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-gold-dark">
              Lot 001 — 0{active.length + ended.length} live now
            </span>
            <h1 className="font-display italic text-4xl md:text-5xl leading-tight mt-3">
              Every item starts at its true floor. You decide how high it goes.
            </h1>
            <p className="text-slate mt-4 text-lg">
              Each lot's starting price is set from its real cost plus a fixed margin —
              no inflated "market value" guesswork. Place a bid, watch the clock, win the lot.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl">Latest arrivals</h2>
          <span className="text-sm text-slate font-mono">{active.length} active</span>
        </div>

        {active.length === 0 ? (
          <div className="text-center py-20 text-slate">
            No active auctions right now. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {active.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {ended.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <h2 className="font-display text-2xl mb-6">Recently closed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
            {ended.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
