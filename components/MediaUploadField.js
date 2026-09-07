"use client";

import { useRef, useState } from "react";
import { MEDIA_RULES } from "@/lib/rules";

/**
 * Picks a file, uploads it to Supabase Storage via /api/uploads, and reports
 * the resulting public URL back through `onChange`.
 *
 * The upload happens as soon as a file is chosen rather than on form submit, so
 * the user sees the real stored file (and any error) before committing.
 *
 * @param {"lot"|"lot_video"|"comment"|"request"} kind  server decides the folder
 * @param {"image"|"video"} media  what may be picked, and how to preview it
 * @param {string} value           current URL ("" when none)
 * @param {(url: string) => void} onChange
 */
export default function MediaUploadField({
  kind,
  media = "image",
  value,
  onChange,
  label = "File",
  hint,
}) {
  const rules = MEDIA_RULES[media];
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Cheap client-side checks first — no point uploading a file the server
    // will only reject. A video takes a while, so this matters more here.
    if (!rules.mime.includes(file.type)) {
      setError(rules.wrongType);
      resetInput();
      return;
    }
    if (file.size > rules.maxBytes) {
      setError(
        `That ${rules.noun} is ${(file.size / (1024 * 1024)).toFixed(1)} MB — the limit is ${rules.maxLabel}.`
      );
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
          <div className="w-40 rounded-card overflow-hidden bg-ink-800/5 border border-ink-800/10 shrink-0">
            {media === "video" ? (
              <video src={value} controls preload="metadata" className="w-full h-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="Selected upload" className="w-full aspect-[4/3] object-cover" />
            )}
          </div>
          <div className="text-sm">
            <p className="text-signal-go">
              {media === "video" ? "Video uploaded." : "Photo uploaded."}
            </p>
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
            accept={rules.accept}
            onChange={handleFile}
            disabled={uploading}
            className="block w-full text-sm text-slate border border-ink-800/15 rounded-card px-3 py-2.5 focus-ring
                       file:mr-4 file:py-1.5 file:px-4 file:rounded-card file:border-0
                       file:bg-ink-800 file:text-paper file:text-sm file:cursor-pointer
                       hover:file:bg-ink-700 disabled:opacity-50"
          />
          <p className="text-xs text-slate mt-1.5">
            {uploading
              ? media === "video"
                ? "Uploading — a video can take a moment…"
                : "Uploading…"
              : hint || rules.hint}
          </p>
        </div>
      )}

      {error && <p className="text-signal-warn text-sm mt-2">{error}</p>}
    </div>
  );
}
