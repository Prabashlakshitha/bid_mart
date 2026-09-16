import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const status = /email not confirmed/i.test(error.message) ? 403 : 401;
    const message = status === 403
      ? "Please confirm your email before logging in — check your inbox for the link."
      : "Invalid email or password.";
    return NextResponse.json({ error: message }, { status });
  }

  // Own row is always readable under the profiles_select policy.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  // createClient() already wrote the session cookie via its cookies.setAll.
  return NextResponse.json({ ok: true, role: profile?.role || "user" });
}
