import { NextResponse } from "next/server";
import { readDb, writeDb, nextId } from "@/lib/db";
import { hashPassword, createSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const db = readDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const password_hash = await hashPassword(password);
  const user = {
    id: nextId(db, "users"),
    name,
    email,
    password_hash,
    role: "user",
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  writeDb(db);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, createSessionCookieValue(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
