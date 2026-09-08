import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteImage } from "@/lib/uploads";

/** A comment can be removed by whoever wrote it, or by an admin moderating. */
export async function DELETE(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { id } = await params;
  const db = readDb();
  const index = db.comments.findIndex((c) => c.id === Number(id));
  if (index === -1) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  const comment = db.comments[index];
  if (comment.user_id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "You can only delete your own comment." }, { status: 403 });
  }

  db.comments.splice(index, 1);
  writeDb(db);

  // The record is already gone; a failed file delete shouldn't fail the request.
  await deleteImage(comment.image_path);

  return NextResponse.json({ ok: true });
}
