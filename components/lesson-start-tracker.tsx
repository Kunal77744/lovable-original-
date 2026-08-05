"use client";

import { useEffect } from "react";
import type { LearnerEntrySource } from "@/lib/learner-entry-source";
import { captureLearnerEventOnce } from "@/lib/product-analytics";

type LessonStartTrackerProps = {
  courseSlug: string;
  lessonSlug: string;
  alreadyCompleted: boolean;
  entrySource?: LearnerEntrySource;
};

export function LessonStartTracker({
  courseSlug,
  lessonSlug,
  alreadyCompleted,
  entrySource,
}: LessonStartTrackerProps) {
  useEffect(() => {
    if (alreadyCompleted) {
      return;
    }

    captureLearnerEventOnce("lesson_started", {
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      ...(entrySource ? { entry_source: entrySource } : {}),
    });
  }, [alreadyCompleted, courseSlug, entrySource, lessonSlug]);

  return null;
}
