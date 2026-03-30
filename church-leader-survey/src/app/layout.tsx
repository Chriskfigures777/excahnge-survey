import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Survey120",
  title: { default: "Church Leader Research Survey", template: "%s | Survey120" },
  description:
    "Confidential church leader research survey — responsive multi-step form with optional Airtable storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
