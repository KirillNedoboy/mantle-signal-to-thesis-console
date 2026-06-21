import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mantle Signal-to-Thesis Console",
  description: "Self-hosted AI research console for structured Web3 ecosystem signal review.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="shell">
          <nav className="nav">
            <Link className="brand" href="/">Signal-to-Thesis</Link>
            <div className="nav-links">
              <Link href="/signals">Signals</Link>
              <a href="https://www.mantle.xyz" target="_blank" rel="noreferrer">Mantle</a>
            </div>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
