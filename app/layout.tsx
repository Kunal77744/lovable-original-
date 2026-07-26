import type { Metadata } from "next";
import "./globals.css";
import { PublicPageviews } from "./public-pageviews";

export const metadata: Metadata = {
  metadataBase: new URL("https://lovable-original-eight.vercel.app"),
  title: "Lovable Original | Free student learning",
  description:
    "Read every available course and lesson free, then create a free student account only when you want to save private work and progress.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Lovable Original",
    title: "Lovable Original | Free student learning",
    description:
      "Read every available course and lesson free, then create a free student account only when you want to save private work and progress.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt:
          "Lovable Original Web Development Foundations: learn semantic HTML, build and save a page, and check your recall.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lovable Original | Free student learning",
    description:
      "Read every available course and lesson free, then create a free student account only when you want to save private work and progress.",
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
