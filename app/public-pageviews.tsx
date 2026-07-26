"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { capturePublicPageview } from "@/lib/product-analytics";

const publicRoutes = new Map([
  ["/", "homepage"],
  ["/about", "about"],
]);

let lastCapturedPath: string | null = null;

export function PublicPageviews() {
  const pathname = usePathname();

  useEffect(() => {
    const routeName = publicRoutes.get(pathname);

    if (!routeName) {
      lastCapturedPath = null;
      return;
    }

    if (lastCapturedPath === pathname) {
      return;
    }

    if (capturePublicPageview(routeName, pathname)) {
      lastCapturedPath = pathname;
    }
  }, [pathname]);

  return null;
}
