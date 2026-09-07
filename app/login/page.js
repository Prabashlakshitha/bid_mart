"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      router.push(data.role === "admin" ? "/admin" : "/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="font-display italic text-3xl mb-2">Welcome back</h1>
      <p className="text-slate mb-8">Log in to place bids and track your lots.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="text-xs uppercase tracking-wide text-slate">Password</label>
          <input
            type="password"
            required
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
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="text-sm text-slate mt-6">
        No account?{" "}
        <Link href="/register" className="text-gold-dark hover:underline">
          Sign up
        </Link>
      </p>

      <div className="mt-10 text-xs text-slate bg-ink-800/5 rounded-card p-4">
        Demo accounts — Admin: admin@bidmart.test / admin123 · Buyer: buyer@bidmart.test / buyer123
      </div>
    </div>
  );
}
