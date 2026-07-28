"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LESSON_PROGRESS_UPDATED,
  type LessonProgressUpdate,
} from "@/lib/lesson-progress-events";

type RailLesson = {
  id: string;
  slug: string;
  title: string;
  position: number;
  estimatedMinutes: number;
  completed: boolean;
  quizScore: number | null;
};

type LessonProgressRailProps = {
  courseTitle: string;
  courseSlug: string;
  moduleTitle: string;
  currentLessonSlug: string;
  signedIn: boolean;
  initialCompletedLessons: number;
  totalLessons: number;
  initialCourseCompleted: boolean;
  initialLessons: readonly RailLesson[];
};

export function LessonProgressRail({
  courseTitle,
  courseSlug,
  moduleTitle,
  currentLessonSlug,
  signedIn,
  initialCompletedLessons,
  totalLessons,
  initialCourseCompleted,
  initialLessons,
}: LessonProgressRailProps) {
  const [progress, setProgress] = useState({
    completedLessons: initialCompletedLessons,
    courseCompleted: initialCourseCompleted,
    lessons: [...initialLessons],
  });

  useEffect(() => {
    function updateProgress(event: Event) {
      const { lessonSlug, completed, savedScore } = (
        event as CustomEvent<LessonProgressUpdate>
      ).detail;

      setProgress((current) => {
        if (!current.lessons.some((lesson) => lesson.slug === lessonSlug)) {
          return current;
        }

        const lessons = current.lessons.map((lesson) =>
          lesson.slug === lessonSlug
            ? {
                ...lesson,
                completed: lesson.completed || completed,
                quizScore: savedScore,
              }
            : lesson,
        );
        const completedLessons = lessons.filter(
          (lesson) => lesson.completed,
        ).length;

        return {
          lessons,
          completedLessons,
          courseCompleted:
            totalLessons > 0 && completedLessons === totalLessons,
        };
      });
    }

    window.addEventListener(LESSON_PROGRESS_UPDATED, updateProgress);
    return () =>
      window.removeEventListener(LESSON_PROGRESS_UPDATED, updateProgress);
  }, [totalLessons]);

  return (
    <aside className="lesson-rail" aria-label="Course progress">
      <Link
        className="lesson-back-link"
        href={signedIn ? "/dashboard" : "/courses/web-development-foundations"}
      >
        <span aria-hidden="true">←</span>
        {signedIn ? "Dashboard" : "Course overview"}
      </Link>
      <p>{courseTitle}</p>
      <div className="lesson-rail-progress">
        <span
          className={progress.courseCompleted ? "is-complete" : ""}
          aria-hidden="true"
        />
        <div>
          <strong>{moduleTitle}</strong>
          <small>
            {signedIn
              ? `${progress.completedLessons} of ${totalLessons} complete`
              : "Full lesson · Free to read"}
          </small>
        </div>
      </div>
      <ol>
        {progress.lessons.map((courseLesson) => (
          <li
            key={courseLesson.id}
            aria-current={
              courseLesson.slug === currentLessonSlug ? "step" : undefined
            }
          >
            <span>
              {courseLesson.completed ? "✓" : courseLesson.position}
            </span>
            <div>
              <Link href={`/learn/${courseSlug}/${courseLesson.slug}`}>
                <strong>{courseLesson.title}</strong>
              </Link>
              <small>
                {courseLesson.estimatedMinutes} min
                {courseLesson.quizScore !== null
                  ? ` · Best ${courseLesson.quizScore}%`
                  : ""}
              </small>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
