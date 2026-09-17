import Link from "next/link";
import CountdownBadge from "./CountdownBadge";

export default function ProductCard({ product }) {
  const currentBid = product.current_highest_bid || product.min_price;
  const label = product.current_highest_bid ? "current bid" : "starting bid";

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-ink-800/5
                 shadow-card-3d hover:shadow-card-3d-hover
                 transition-all duration-300 ease-out
                 hover:-translate-y-2 hover:rotate-[0.5deg]
                 focus-ring"
    >
      <div className="relative aspect-[4/3] bg-ink-800/5 overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate text-sm">
            No image
          </div>
        )}

        {/* Bottom gradient keeps the badges legible over any photo, and adds
            the kind of subtle depth a flat product photo otherwise lacks. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/25 via-transparent to-transparent" />

        <div className="absolute top-3 left-3">
          <CountdownBadge endTime={product.end_time} status={product.status} />
        </div>
        {product.video_url && (
          <span
            className="absolute top-3 right-3 bg-ink-900/80 text-paper text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur"
            title="This lot has a video"
          >
            ▶ Video
          </span>
        )}
      </div>

      <div className="p-5 relative">
        {/* A hairline that lights up orange on hover — a cheap but effective
            way to sell "this card just lifted toward you". */}
        <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-ink-800/10 to-transparent group-hover:via-gold/50 transition-colors duration-300" />

        <h3 className="font-display text-lg leading-snug mb-1 group-hover:text-gold-dark transition-colors">
          {product.title}
        </h3>
        <div className="flex items-baseline justify-between mt-3">
          <div>
            <div className="text-xs text-slate uppercase tracking-wide">{label}</div>
            <div className="font-mono text-xl font-semibold text-ink-800 group-hover:text-gold-dark transition-colors">
              Rs. {currentBid.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
