"use client";

import { useRef, useState } from "react";
import { ACCEPT_ATTR, ACCEPTED_IMAGE_MIME, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/rules";

/**
 * Picks an image, uploads it to Supabase Storage via /api/uploads, and reports
 * the resulting public URL back through `onChange`.
 *
 * The upload happens as soon as a file is chosen rather than on form submit, so
 * the user sees the real stored image (and any error) before committing.
 *
 * @param {"lot"|"comment"} kind  decides which folder the server files it under
 * @param {string} value          current image URL ("" when none)
 * @param {(url: string) => void} onChange
 */
export default function ImageUploadField({
  kind,
  value,
  onChange,
  label = "Photo",
  hint,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Cheap client-side checks first — no point uploading a file the server
    // will only reject.
    if (!ACCEPTED_IMAGE_MIME.includes(file.type)) {
      setError("Please choose a JPG, PNG, GIF or WebP image.");
      resetInput();
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`That image is ${(file.size / (1024 * 1024)).toFixed(1)} MB — the limit is ${MAX_UPLOAD_LABEL}.`);
      resetInput();
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);

      const res = await fetch("/api/uploads", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
      resetInput();
    }
  }

  // Clearing the input means picking the same file again still fires onChange.
  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-slate">{label}</label>

      {value ? (
        <div className="mt-1 flex items-start gap-4">
          <div className="w-32 h-24 rounded-card overflow-hidden bg-ink-800/5 border border-ink-800/10 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Selected upload" className="w-full h-full object-cover" />
          </div>
          <div className="text-sm">
            <p className="text-signal-go">Photo uploaded.</p>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setError("");
              }}
              className="mt-1 text-slate underline hover:text-signal-warn transition-colors focus-ring rounded"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-1">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            onChange={handleFile}
            disabled={uploading}
            className="block w-full text-sm text-slate border border-ink-800/15 rounded-card px-3 py-2.5 focus-ring
                       file:mr-4 file:py-1.5 file:px-4 file:rounded-card file:border-0
                       file:bg-ink-800 file:text-paper file:text-sm file:cursor-pointer
                       hover:file:bg-ink-700 disabled:opacity-50"
          />
          <p className="text-xs text-slate mt-1.5">
            {uploading ? "Uploading…" : hint || `JPG, PNG, GIF or WebP — up to ${MAX_UPLOAD_LABEL}.`}
          </p>
        </div>
      )}

      {error && <p className="text-signal-warn text-sm mt-2">{error}</p>}
    </div>
  );
}
