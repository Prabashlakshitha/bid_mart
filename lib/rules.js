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

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const ACCEPTED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/** Value for an <input type="file" accept="…"> attribute. */
export const ACCEPT_ATTR = ACCEPTED_IMAGE_MIME.join(",");

export const MAX_UPLOAD_LABEL = `${MAX_UPLOAD_BYTES / (1024 * 1024)} MB`;

// ---- Buyer comments ------------------------------------------------------

/** How much a buyer may write in one comment about a lot. */
export const MAX_COMMENT_LENGTH = 1000;
