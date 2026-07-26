import type { Metadata } from "next";
import "./globals.css";
import { PublicPageviews } from "./public-pageviews";

export const metadata: Metadata = {
  metadataBase: new URL("https://lovable-original-eight.vercel.app"),
  title: "Lovable Original | AI-first learning that sticks",
  description:
    "Learn through focused lessons, active recall, real projects, and interview practice in one AI-first learning platform.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Lovable Original",
    title: "Lovable Original | AI-first learning that sticks",
    description:
      "Learn through focused lessons, active recall, real projects, and interview practice in one AI-first learning platform.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt:
          "Lovable Original learning platform: learn concepts, practice recall, and build with what you know.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lovable Original | AI-first learning that sticks",
    description:
      "Learn through focused lessons, active recall, real projects, and interview practice in one AI-first learning platform.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PublicPageviews />
      </body>
    </html>
  );
}
