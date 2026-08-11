"use client";

import { useEffect } from "react";
import type { LearnerEntrySource } from "@/lib/learner-entry-source";
import { capturePracticeProblemStarted } from "@/lib/product-analytics";

type PracticeProblemStartTrackerProps = {
  problemSlug: string;
  entrySource?: LearnerEntrySource;
};

export function PracticeProblemStartTracker({
  problemSlug,
  entrySource,
}: PracticeProblemStartTrackerProps) {
  useEffect(() => {
    capturePracticeProblemStarted({ problemSlug, entrySource });
  }, [entrySource, problemSlug]);

  return null;
}
