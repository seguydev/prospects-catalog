import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prospects Catalog",
  description: "Catalogue de prospects LinkedIn — accessible à Claude via MCP Supabase",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
