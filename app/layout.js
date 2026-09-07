import "./globals.css";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "BidMart — Timed Auctions",
  description: "A modern timed-auction marketplace.",
};

export default function RootLayout({ children }) {
  const user = getCurrentUser();
  return (
    <html lang="en">
      <body className="font-body min-h-screen flex flex-col">
        <Navbar user={user} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-ink-800/10 py-8 mt-16">
          <div className="max-w-6xl mx-auto px-6 text-sm text-slate flex justify-between">
            <span>BidMart — demo marketplace prototype</span>
            <span className="font-mono">payments: not yet connected</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
