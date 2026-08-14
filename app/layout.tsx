import type { Metadata } from "next";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import { FIRST_COURSE_LESSONS } from "@/lib/first-course-content";
import "./globals.css";
import { PublicPageviews } from "./public-pageviews";

const javascriptProblemCount = CODING_PROBLEMS.length;
const courseLessonCount = FIRST_COURSE_LESSONS.length;
const courseMinutes = FIRST_COURSE_LESSONS.reduce(
  (total, lesson) => total + lesson.estimatedMinutes,
  0,
);
const pageDescription = `Take ${courseLessonCount} Web Foundations lessons totaling ${courseMinutes} minutes, build and check saved work, then continue into ${javascriptProblemCount} browser-run JavaScript problems.`;

export const metadata: Metadata = {
  metadataBase: new URL("https://lovable-original-eight.vercel.app"),
  title: "Lovable Original | Learn coding by doing",
  description: pageDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Lovable Original",
    title: "Lovable Original | Learn coding by doing",
    description: pageDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `Lovable Original: learn coding through ${courseLessonCount} Web Foundations lessons, saved project work, and ${javascriptProblemCount} JavaScript problems.`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lovable Original | Learn coding by doing",
    description: pageDescription,
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
