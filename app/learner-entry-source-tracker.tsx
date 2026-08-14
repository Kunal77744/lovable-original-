"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { rememberLearnerEntrySource } from "@/lib/product-analytics";

const searchEntryPaths = new Set([
  "/learn/why-use-semantic-html",
  "/learn/what-is-the-css-box-model",
  "/learn/how-to-practice-javascript",
]);

export function LearnerEntrySourceTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serializedSearchParams = searchParams.toString();

  useEffect(() => {
    const sourceValues = new URLSearchParams(
      serializedSearchParams,
    ).getAll("entry_source");

    const entrySource =
      sourceValues.length > 0
        ? sourceValues.length === 1
          ? sourceValues[0]
          : sourceValues
        : searchEntryPaths.has(pathname)
          ? "search_page"
          : undefined;

    rememberLearnerEntrySource(entrySource);
  }, [pathname, serializedSearchParams]);

  return null;
}
