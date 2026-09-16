"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }
      if (data.needsConfirmation) {
        // Email confirmation is on for this project — no session yet.
        setNeedsConfirmation(true);
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirmation) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <h1 className="font-display italic text-3xl mb-2">Check your email</h1>
        <p className="text-slate">
          We sent a confirmation link to <strong>{email}</strong>. Click it, then{" "}
          <Link href="/login" className="text-gold-dark hover:underline">
            log in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="font-display italic text-3xl mb-2">Create your account</h1>
      <p className="text-slate mb-8">Join to start bidding on live lots.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-slate">Full name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate">Password (min 6 characters)</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 px-4 py-3 border border-ink-800/15 rounded-card focus-ring"
          />
        </div>
        {error && <p className="text-signal-warn text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink-800 text-paper font-medium py-3 rounded-card hover:bg-ink-700 transition-colors focus-ring disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="text-sm text-slate mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-gold-dark hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
