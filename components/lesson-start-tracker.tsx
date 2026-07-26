"use client";

import { useEffect } from "react";
import { captureLearnerEventOnce } from "@/lib/product-analytics";

type LessonStartTrackerProps = {
  courseSlug: string;
  lessonSlug: string;
  alreadyCompleted: boolean;
};

export function LessonStartTracker({
  courseSlug,
  lessonSlug,
  alreadyCompleted,
}: LessonStartTrackerProps) {
  useEffect(() => {
    if (alreadyCompleted) {
      return;
    }

    captureLearnerEventOnce("lesson_started", {
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
    });
  }, [alreadyCompleted, courseSlug, lessonSlug]);

  return null;
}
