/**
 * Validation rules shared by the browser and the server.
 *
 * This module deliberately imports nothing — it gets pulled into client
 * components, so it has to stay free of Node built-ins (that's why these
 * don't live in lib/db.js, which reads the filesystem). The server always
 * re-checks these limits; the copies here just let the UI warn the user
 * before spending time on a request that would be rejected.
 */

// ---- Image uploads -------------------------------------------------------

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ACCEPTED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// ---- Video uploads -------------------------------------------------------

/**
 * Short clips only — a lot video is meant to show the item from a few angles,
 * not be a full production. Large files are slow to upload over the kind of
 * connection an admin is likely on, and slow to play back for bidders.
 */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * MP4 and WebM play natively in every current browser. QuickTime .mov files
 * are accepted because phones produce them, but they only play back if the
 * video inside is H.264 — which is the usual case.
 */
export const ACCEPTED_VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime"];

// ---- Helpers for both ----------------------------------------------------

const mb = (bytes) => `${Math.round(bytes / (1024 * 1024))} MB`;

/** Per-media-kind settings, keyed by the `media` prop/field used everywhere. */
export const MEDIA_RULES = {
  image: {
    mime: ACCEPTED_IMAGE_MIME,
    accept: ACCEPTED_IMAGE_MIME.join(","),
    maxBytes: MAX_IMAGE_BYTES,
    maxLabel: mb(MAX_IMAGE_BYTES),
    noun: "image",
    hint: `JPG, PNG, GIF or WebP — up to ${mb(MAX_IMAGE_BYTES)}.`,
    wrongType: "Please choose a JPG, PNG, GIF or WebP image.",
  },
  video: {
    mime: ACCEPTED_VIDEO_MIME,
    accept: ACCEPTED_VIDEO_MIME.join(","),
    maxBytes: MAX_VIDEO_BYTES,
    maxLabel: mb(MAX_VIDEO_BYTES),
    noun: "video",
    hint: `MP4, WebM or MOV — up to ${mb(MAX_VIDEO_BYTES)}.`,
    wrongType: "Please choose an MP4, WebM or MOV video.",
  },
};

// ---- Buyer comments ------------------------------------------------------

/** How much a buyer may write in one comment about a lot. */
export const MAX_COMMENT_LENGTH = 1000;

// ---- Item requests -------------------------------------------------------

/** Short "what are you looking for" line on a request. */
export const MAX_REQUEST_TITLE_LENGTH = 120;

/** The longer note describing the item the customer wants. */
export const MAX_REQUEST_NOTE_LENGTH = 1000;

/**
 * How far along the admin is with a request. Requests arrive as "new"; the
 * admin moves them on so the queue doesn't grow forever.
 */
export const REQUEST_STATUSES = ["new", "reviewed", "closed"];

export const REQUEST_STATUS_LABELS = {
  new: "New",
  reviewed: "Reviewed",
  closed: "Closed",
};
