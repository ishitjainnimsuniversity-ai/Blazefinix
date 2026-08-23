import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOOP — AI Customer-Feedback Intelligence Platform",
  description: "Enterprise multi-tenant customer feedback intelligence and AI analysis platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
