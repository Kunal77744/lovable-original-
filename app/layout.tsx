import type { Metadata } from "next";
import "./globals.css";
import { PublicPageviews } from "./public-pageviews";

export const metadata: Metadata = {
  metadataBase: new URL("https://lovable-original-eight.vercel.app"),
  title: "Lovable Original | Web Development Foundations",
  description:
    "Build and save a semantic HTML page in one 18-minute lesson, check your recall with four questions, and return to your saved result.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Lovable Original",
    title: "Lovable Original | Web Development Foundations",
    description:
      "Build and save a semantic HTML page in one 18-minute lesson, check your recall with four questions, and return to your saved result.",
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
    title: "Lovable Original | Web Development Foundations",
    description:
      "Build and save a semantic HTML page in one 18-minute lesson, check your recall with four questions, and return to your saved result.",
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
