import { NextResponse } from "next/server";
import { getCommentById, deleteCommentById } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteImage } from "@/lib/uploads";

/** A comment can be removed by whoever wrote it, or by an admin moderating. */
export async function DELETE(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { id } = await params;
  const comment = await getCommentById(Number(id));
  if (!comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }
  if (comment.user_id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "You can only delete your own comment." }, { status: 403 });
  }

  await deleteCommentById(comment.id);

  // The record is already gone; a failed file delete shouldn't fail the request.
  await deleteImage(comment.image_path);

  return NextResponse.json({ ok: true });
}
