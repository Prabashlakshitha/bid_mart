"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BidForm({ product, isLoggedIn }) {
  const router = useRouter();
  const floor = product.current_highest_bid
    ? product.current_highest_bid + product.bid_increment
    : product.min_price;

  const [amount, setAmount] = useState(floor);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isEnded = product.status !== "active" || new Date(product.end_time).getTime() <= Date.now();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not place bid.");
      } else {
        setSuccess(true);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isEnded) {
    return (
      <div className="bg-ink-800 text-paper rounded-card p-5 text-sm">
        This auction has ended.{" "}
        {product.status === "ended_sold" ? "It was won by another bidder." : "It received no bids."}
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-ink-800/5 border border-ink-800/10 rounded-card p-5 text-sm">
        <a href="/login" className="text-gold-dark font-medium hover:underline">
          Log in
        </a>{" "}
        to place a bid on this lot.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-ink-800/10 rounded-card p-5 shadow-card">
      <label htmlFor="amount" className="text-xs uppercase tracking-wide text-slate">
        Your bid (minimum Rs. {floor.toLocaleString()})
      </label>
      <div className="flex gap-3 mt-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate">Rs.</span>
          <input
            id="amount"
            type="number"
            step="0.01"
            min={floor}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full font-mono text-lg pl-10 pr-3 py-3 border border-ink-800/15 rounded-card focus-ring"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-gold hover:bg-gold-dark text-ink-800 font-medium px-6 py-3 rounded-card transition-colors focus-ring disabled:opacity-50"
        >
          {loading ? "Placing…" : "Place bid"}
        </button>
      </div>
      {error && <p className="text-signal-warn text-sm mt-2">{error}</p>}
      {success && <p className="text-signal-go text-sm mt-2">Bid placed — you're the highest bidder!</p>}
    </form>
  );
}
