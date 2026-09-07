import crypto from "crypto";
import { getSupabase, isStorageConfigured, publicUrlPrefix, BUCKET } from "./supabase/admin";
import { MEDIA_RULES } from "./rules";

/**
 * File types we accept, keyed by the signature ("magic bytes") we expect to
 * find. The browser-supplied MIME type is only a hint and can be faked, so the
 * real bytes decide both whether we accept the file and what content type we
 * store it as.
 */
const SIGNATURES = {
  image: [
    { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    {
      ext: "png",
      mime: "image/png",
      test: (b) =>
        b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
        b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
    },
    {
      ext: "gif",
      mime: "image/gif",
      test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
    },
    {
      ext: "webp",
      mime: "image/webp",
      test: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
    },
  ],
  video: [
    {
      // WebM/Matroska both start with the EBML header.
      ext: "webm",
      mime: "video/webm",
      test: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
    },
    {
      // MP4 and MOV share the ISO base media layout: a size field, then "ftyp".
      // The brand that follows tells the two apart — "qt  " means QuickTime.
      ext: "mov",
      mime: "video/quicktime",
      test: (b) => b.toString("ascii", 4, 8) === "ftyp" && b.toString("ascii", 8, 12) === "qt  ",
    },
    {
      ext: "mp4",
      mime: "video/mp4",
      test: (b) => b.toString("ascii", 4, 8) === "ftyp",
    },
  ],
};

function detectType(buffer, media) {
  if (buffer.length < 12) return null;
  return SIGNATURES[media].find((s) => s.test(buffer)) || null;
}

/**
 * Validates and uploads one file to Supabase Storage.
 *
 * @param {File} file      a File from a multipart form (request.formData())
 * @param {string} folder  path prefix inside the bucket, e.g. "lots"
 * @param {"image"|"video"} media  which family of file is allowed here
 * @returns {Promise<{ ok: true, url: string, path: string }
 *                 | { ok: false, error: string, status: number }>}
 */
export async function uploadMedia(file, folder, media = "image") {
  const rules = MEDIA_RULES[media];
  if (!rules) return { ok: false, error: "Unknown media type.", status: 400 };

  if (!file || typeof file.arrayBuffer !== "function") {
    return { ok: false, error: `No ${rules.noun} file was received.`, status: 400 };
  }
  if (file.size === 0) {
    return { ok: false, error: `That ${rules.noun} file is empty.`, status: 400 };
  }
  if (file.size > rules.maxBytes) {
    return {
      ok: false,
      error: `That ${rules.noun} is too large — the limit is ${rules.maxLabel}.`,
      status: 413,
    };
  }

  // Validate the file itself before worrying about the destination, so a bad
  // file always gets the same answer whether or not storage is set up.
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = detectType(buffer, media);
  if (!type) {
    return { ok: false, error: rules.wrongType, status: 415 };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      error: "Uploads aren't configured on this server yet.",
      status: 503,
    };
  }

  // Random name, never the user-supplied filename — that keeps path traversal,
  // odd characters and collisions out of the bucket entirely.
  const path = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${type.ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: type.mime,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("[supabase] upload failed:", error.message);
    const missingBucket = /bucket not found/i.test(error.message);
    const tooBig = /maximum allowed size|payload too large/i.test(error.message);
    return {
      ok: false,
      error: missingBucket
        ? `Storage bucket "${BUCKET}" doesn't exist yet — create it in your Supabase dashboard.`
        : tooBig
          ? `Your Supabase bucket rejected this file for being too large. Raise the bucket's file size limit to at least ${rules.maxLabel}.`
          : "Upload failed. Please try again.",
      status: 502,
    };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}

/**
 * True only for a URL that points into our own storage bucket.
 *
 * User-submitted media has to be files we uploaded ourselves, otherwise a
 * crafted request could hang any third-party URL off a page.
 */
export function isUploadedUrl(url) {
  const prefix = publicUrlPrefix();
  if (!prefix || typeof url !== "string") return false;
  return url.startsWith(prefix) && !url.includes("..");
}

/** Recovers the in-bucket path from a public URL, or null if it isn't ours. */
export function pathFromUploadedUrl(url) {
  if (!isUploadedUrl(url)) return null;
  return url.slice(publicUrlPrefix().length).split("?")[0];
}

/**
 * Best-effort delete, used when a record that owned a file is removed.
 * Never throws: a leftover file is a much smaller problem than a failed delete.
 */
export async function deleteImage(path) {
  if (!path || !isStorageConfigured()) return;
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error("[supabase] delete failed:", error.message);
}
