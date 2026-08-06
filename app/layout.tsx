import type { Metadata } from "next";
import "./globals.css";
import { PublicPageviews } from "./public-pageviews";

export const metadata: Metadata = {
  metadataBase: new URL("https://lovable-original-eight.vercel.app"),
  title: "Lovable Original | Learn coding by doing",
  description:
    "Take one 18-minute semantic HTML lesson, build and check saved work, then continue into six browser-run JavaScript problems.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Lovable Original",
    title: "Lovable Original | Learn coding by doing",
    description:
      "Take one 18-minute semantic HTML lesson, build and check saved work, then continue into six browser-run JavaScript problems.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Lovable Original: learn coding through a short lesson, saved semantic HTML work, and six JavaScript problems.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lovable Original | Learn coding by doing",
    description:
      "Take one 18-minute semantic HTML lesson, build and check saved work, then continue into six browser-run JavaScript problems.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
        <PublicPageviews />
      </body>
    </html>
  );
}
