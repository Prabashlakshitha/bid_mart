import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Navbar({ user }) {
  return (
    <header className="border-b border-ink-800/10 bg-paper/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-2.5 h-2.5 rounded-full bg-gold group-hover:bg-gold-dark transition-colors" />
          <span className="font-display italic text-xl tracking-tight">BidMart</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="hover:text-gold-dark transition-colors focus-ring rounded">
            Auctions
          </Link>

          <Link href="/request" className="hover:text-gold-dark transition-colors focus-ring rounded">
            Request an item
          </Link>

          {user?.role === "admin" && (
            <Link href="/admin" className="hover:text-gold-dark transition-colors focus-ring rounded">
              Admin
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-slate">Hi, {user.name.split(" ")[0]}</span>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hover:text-gold-dark transition-colors focus-ring rounded"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-ink-800 text-paper px-4 py-2 rounded-card hover:bg-ink-700 transition-colors focus-ring"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
