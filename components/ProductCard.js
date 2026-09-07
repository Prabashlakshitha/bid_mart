import Link from "next/link";
import CountdownBadge from "./CountdownBadge";

export default function ProductCard({ product }) {
  const currentBid = product.current_highest_bid || product.min_price;
  const label = product.current_highest_bid ? "current bid" : "starting bid";

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block bg-white rounded-card shadow-card overflow-hidden border border-ink-800/5 hover:-translate-y-0.5 hover:shadow-lg transition-all focus-ring"
    >
      <div className="relative aspect-[4/3] bg-ink-800/5 overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate text-sm">
            No image
          </div>
        )}
        <div className="absolute top-3 left-3">
          <CountdownBadge endTime={product.end_time} status={product.status} />
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg leading-snug mb-1 group-hover:text-gold-dark transition-colors">
          {product.title}
        </h3>
        <div className="flex items-baseline justify-between mt-3">
          <div>
            <div className="text-xs text-slate uppercase tracking-wide">{label}</div>
            <div className="font-mono text-xl font-medium">
              Rs. {currentBid.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
