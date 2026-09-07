"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaUploadField from "./MediaUploadField";
import { MAX_REQUEST_TITLE_LENGTH, MAX_REQUEST_NOTE_LENGTH } from "@/lib/rules";

/**
 * "Looking for something?" form — a customer describes goods they want us to
 * source, optionally attaching a photo of the kind of thing they mean.
 * Submitting sends it straight to the admin queue.
 */
export default function RequestForm({ storageEnabled = false }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSent(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, note, image_url: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send your request.");
        return;
      }
      setTitle("");
      setNote("");
      setImageUrl("");
      setSent(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-ink-800/10 rounded-card p-6 shadow-card space-y-5"
    >
      <div>
        <label htmlFor="request-title" className="text-xs uppercase tracking-wide text-slate">
          What are you looking for?
        </label>
        <input
          id="request-title"
          required
          maxLength={MAX_REQUEST_TITLE_LENGTH}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Antique brass oil lamp"
          className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring"
        />
      </div>

      <div>
        <label htmlFor="request-note" className="text-xs uppercase tracking-wide text-slate">
          Describe it — condition, size, colour, budget, anything that helps
        </label>
        <textarea
          id="request-note"
          required
          rows={4}
          maxLength={MAX_REQUEST_NOTE_LENGTH}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Looking for a pair, roughly 30cm tall, original patina rather than polished. Budget around Rs. 15,000."
          className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring"
        />
        <p className="text-xs text-slate mt-1 text-right">
          {MAX_REQUEST_NOTE_LENGTH - note.length} characters left
        </p>
      </div>

      {storageEnabled ? (
        <MediaUploadField
          kind="request"
          label="Photo of what you want (optional)"
          hint="A picture of something similar helps us find the right item."
          value={imageUrl}
          onChange={setImageUrl}
        />
      ) : (
        <p className="text-xs text-slate">
          Photo uploads need Supabase Storage configured — see SUPABASE_SETUP.md. You can still
          send the request without one.
        </p>
      )}

      {error && <p className="text-signal-warn text-sm">{error}</p>}
      {sent && (
        <p className="text-signal-go text-sm">
          Request sent — our team will take a look and get back to you.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !title.trim() || !note.trim()}
        className="bg-gold hover:bg-gold-dark text-ink-800 font-medium px-6 py-3 rounded-card transition-colors focus-ring disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
