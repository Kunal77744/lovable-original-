import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lovable-original-eight.vercel.app"),
  title: "Lovable Original | AI-first learning that sticks",
  description:
    "Learn through focused lessons, active recall, real projects, and interview practice in one AI-first learning platform.",
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

