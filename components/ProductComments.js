"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "./ImageUploadField";
import { MAX_COMMENT_LENGTH } from "@/lib/rules";

/**
 * Buyer comments on a lot — a short description of the item in the buyer's own
 * words, optionally with their own photo of it.
 *
 * Comments are readable by everyone; posting needs a login, and a comment can
 * be removed by its author or by an admin.
 */
export default function ProductComments({
  productId,
  comments,
  currentUser,
  storageEnabled = false,
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const remaining = MAX_COMMENT_LENGTH - body.length;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, image_url: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not post your comment.");
        return;
      }
      setBody("");
      setImageUrl("");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    setDeletingId(id);
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Could not delete that comment.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl mb-1">Buyer photos &amp; comments</h2>
      <p className="text-slate text-sm mb-5">
        Seen this item in person, or own one already? Add your own description and a photo.
      </p>

      {currentUser ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-ink-800/10 rounded-card p-5 shadow-card space-y-4"
        >
          <div>
            <label htmlFor="comment-body" className="text-xs uppercase tracking-wide text-slate">
              Your description of this item
            </label>
            <textarea
              id="comment-body"
              required
              rows={3}
              maxLength={MAX_COMMENT_LENGTH}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. The stitching on the border is much finer than the photo shows…"
              className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring"
            />
            <p className="text-xs text-slate mt-1 text-right">{remaining} characters left</p>
          </div>

          {storageEnabled ? (
            <ImageUploadField
              kind="comment"
              label="Add a photo (optional)"
              value={imageUrl}
              onChange={setImageUrl}
            />
          ) : (
            <p className="text-xs text-slate">
              Photo uploads need Supabase Storage configured — see the README.
            </p>
          )}

          {error && <p className="text-signal-warn text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="bg-gold hover:bg-gold-dark text-ink-800 font-medium px-6 py-3 rounded-card transition-colors focus-ring disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <div className="bg-ink-800/5 border border-ink-800/10 rounded-card p-5 text-sm">
          <a href="/login" className="text-gold-dark font-medium hover:underline">
            Log in
          </a>{" "}
          to add your own photo and description.
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-slate text-sm mt-6">No comments yet — be the first to add one.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {comments.map((c) => {
            const canDelete =
              currentUser && (currentUser.id === c.user_id || currentUser.role === "admin");
            return (
              <li
                key={c.id}
                className="bg-white border border-ink-800/10 rounded-card p-5 shadow-card"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{c.author_name}</span>
                  <span className="text-slate text-xs">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>

                <p className="text-slate leading-relaxed mt-2 whitespace-pre-line">{c.body}</p>

                {c.image_url && (
                  <a
                    href={c.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-3 w-40 aspect-[4/3] rounded-card overflow-hidden bg-ink-800/5 border border-ink-800/10 focus-ring"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.image_url}
                      alt={`Photo from ${c.author_name}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </a>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="mt-3 text-xs text-slate underline hover:text-signal-warn transition-colors focus-ring rounded disabled:opacity-50"
                  >
                    {deletingId === c.id ? "Removing…" : "Delete"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
