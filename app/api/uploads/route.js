import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadMedia } from "@/lib/uploads";

/**
 * Accepts one file and returns its public URL.
 *
 * The client never talks to Supabase directly, so "who may upload what" is
 * decided here: `kind` maps to a fixed folder and a fixed media family, which
 * means a caller can't choose its own path inside the bucket or slip a video
 * in where an image is expected.
 */
const KINDS = {
  lot: { folder: "lots", media: "image", adminOnly: true },
  lot_video: { folder: "videos", media: "video", adminOnly: true },
  comment: { folder: "comments", media: "image", adminOnly: false },
  request: { folder: "requests", media: "image", adminOnly: false },
};

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to upload." }, { status: 401 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const target = KINDS[String(form.get("kind") || "comment")];
  if (!target) {
    return NextResponse.json({ error: "Unknown upload type." }, { status: 400 });
  }
  if (target.adminOnly && user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const result = await uploadMedia(form.get("file"), target.folder, target.media);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ url: result.url, path: result.path }, { status: 201 });
}
