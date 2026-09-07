"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "./ImageUploadField";

export default function NewProductForm({ storageEnabled = false }) {
  const router = useRouter();
  // Upload a file when Supabase Storage is set up, otherwise fall back to
  // pasting a link so the form still works on a fresh clone.
  const [imageMode, setImageMode] = useState(storageEnabled ? "upload" : "url");
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    cost_price: "",
    margin_percent: "20",
    bid_increment: "",
    duration_hours: "48",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const minPrice = useMemo(() => {
    const cost = Number(form.cost_price);
    const margin = Number(form.margin_percent);
    if (!cost || Number.isNaN(margin)) return null;
    return Math.round((cost + cost * (margin / 100)) * 100) / 100;
  }, [form.cost_price, form.margin_percent]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create lot.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label className="text-xs uppercase tracking-wide text-slate">Title</label>
        <input
          required
          value={form.title}
          onChange={update("title")}
          className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring"
          placeholder="e.g. Vintage Leica M3 Camera"
        />
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide text-slate">Description</label>
        <textarea
          value={form.description}
          onChange={update("description")}
          rows={3}
          className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring"
        />
      </div>

      <div>
        {imageMode === "upload" ? (
          <ImageUploadField
            kind="lot"
            label="Product photo"
            value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
          />
        ) : (
          <>
            <label className="text-xs uppercase tracking-wide text-slate">Image URL</label>
            <input
              value={form.image_url}
              onChange={update("image_url")}
              className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring"
              placeholder="https://…"
            />
            {!storageEnabled && (
              <p className="text-xs text-slate mt-1.5">
                File uploads need Supabase Storage configured — see the README. Paste a link for now.
              </p>
            )}
          </>
        )}

        {storageEnabled && (
          <button
            type="button"
            onClick={() => setImageMode((m) => (m === "upload" ? "url" : "upload"))}
            className="text-xs text-slate underline hover:text-gold-dark transition-colors mt-2 focus-ring rounded"
          >
            {imageMode === "upload" ? "or paste an image URL instead" : "or upload a file instead"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-slate">Cost price (Rs.)</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.cost_price}
            onChange={update("cost_price")}
            className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring font-mono"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate">Profit margin (%)</label>
          <input
            required
            type="number"
            min="0"
            step="0.1"
            value={form.margin_percent}
            onChange={update("margin_percent")}
            className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring font-mono"
          />
        </div>
      </div>

      <div className="bg-ink-800 text-paper rounded-card p-4 flex items-center justify-between">
        <span className="text-sm">Calculated minimum (starting) price</span>
        <span className="font-mono text-xl text-gold-light">
          {minPrice !== null ? `Rs. ${minPrice.toLocaleString()}` : "—"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-slate">Bid increment (Rs., optional)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.bid_increment}
            onChange={update("bid_increment")}
            placeholder="Auto: 1% of min price"
            className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring font-mono"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate">Auction duration (hours)</label>
          <input
            required
            type="number"
            min="1"
            value={form.duration_hours}
            onChange={update("duration_hours")}
            className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring font-mono"
          />
        </div>
      </div>

      {error && <p className="text-signal-warn text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-gold hover:bg-gold-dark text-ink-800 font-medium px-6 py-3 rounded-card transition-colors focus-ring disabled:opacity-50"
      >
        {loading ? "Publishing…" : "Publish lot"}
      </button>
    </form>
  );
}
