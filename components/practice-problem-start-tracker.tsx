"use client";

import { useEffect } from "react";
import { capturePracticeProblemStarted } from "@/lib/product-analytics";

type PracticeProblemStartTrackerProps = {
  problemSlug: string;
};

export function PracticeProblemStartTracker({
  problemSlug,
}: PracticeProblemStartTrackerProps) {
  useEffect(() => {
    capturePracticeProblemStarted({ problemSlug });
  }, [problemSlug]);

  return null;
}
