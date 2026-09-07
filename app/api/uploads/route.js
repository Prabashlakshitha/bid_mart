import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadImage } from "@/lib/uploads";

/**
 * Accepts one image file and returns its public URL.
 *
 * The client never talks to Supabase directly, so "who may upload what" is
 * decided here: `kind` maps to a fixed folder, which means a caller can't
 * choose its own path inside the bucket.
 */
const FOLDERS = {
  lot: { folder: "lots", adminOnly: true },
  comment: { folder: "comments", adminOnly: false },
};

export async function POST(request) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to upload." }, { status: 401 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const kind = String(form.get("kind") || "comment");
  const target = FOLDERS[kind];
  if (!target) {
    return NextResponse.json({ error: "Unknown upload type." }, { status: 400 });
  }
  if (target.adminOnly && user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const result = await uploadImage(form.get("file"), target.folder);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ url: result.url, path: result.path }, { status: 201 });
}
