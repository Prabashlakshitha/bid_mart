import Link from "next/link";
import { closeExpiredAuctions, getProducts } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await closeExpiredAuctions();
  const products = await getProducts();
  const active = products.filter((p) => p.status === "active");
  const ended = products.filter((p) => p.status !== "active");

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-800/10">
        {/* Soft blurred shapes give the white hero some depth without a hard
            gradient band — pure decoration, so they're aria-hidden. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-gold-light/30 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-gold-dark bg-gold/10 border border-gold/20 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Lot 001 — 0{active.length + ended.length} live now
            </span>

            <h1 className="font-display italic text-4xl md:text-6xl leading-tight mt-5">
              Every item starts at its <span className="text-gold not-italic">true floor</span>.
              You decide how high it goes.
            </h1>

            <p className="text-slate mt-5 text-lg max-w-xl">
              Each lot's starting price is set from its real cost plus a fixed margin —
              no inflated "market value" guesswork. Place a bid, watch the clock, win the lot.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="#latest-arrivals"
                className="bg-gold hover:bg-gold-dark text-white font-medium px-7 py-3.5 rounded-card
                           transition-all hover:-translate-y-0.5 shadow-glow hover:shadow-glow-lg
                           animate-glow-pulse hover:animate-none focus-ring"
              >
                Browse live auctions
              </Link>
              <Link
                href="/request"
                className="text-ink-800 font-medium px-7 py-3.5 rounded-card border border-ink-800/15
                           hover:border-gold/40 hover:bg-gold/5 transition-colors focus-ring"
              >
                Request an item →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="latest-arrivals" className="max-w-6xl mx-auto px-6 py-14 scroll-mt-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl">Latest arrivals</h2>
          <span className="text-sm text-slate font-mono">{active.length} active</span>
        </div>

        {active.length === 0 ? (
          <div className="text-center py-20 text-slate">
            No active auctions right now. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {active.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {ended.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <h2 className="font-display text-2xl mb-6">Recently closed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 opacity-70">
            {ended.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
