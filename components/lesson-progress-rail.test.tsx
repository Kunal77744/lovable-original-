import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  LESSON_PROGRESS_UPDATED,
  type LessonProgressUpdate,
} from "@/lib/lesson-progress-events";
import { LessonProgressRail } from "./lesson-progress-rail";

describe("LessonProgressRail", () => {
  it("shows saved completion immediately without navigation", () => {
    render(
      <LessonProgressRail
        courseTitle="Web Development Foundations"
        courseSlug="web-development-foundations"
        moduleTitle="HTML foundations"
        currentLessonSlug="semantic-html"
        signedIn
        initialCompletedLessons={0}
        totalLessons={1}
        initialCourseCompleted={false}
        initialLessons={[
          {
            id: "lesson-1",
            slug: "semantic-html",
            title: "Build a page the browser understands",
            position: 1,
            estimatedMinutes: 18,
            completed: false,
            quizScore: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("0 of 1 complete")).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(
        new CustomEvent<LessonProgressUpdate>(LESSON_PROGRESS_UPDATED, {
          detail: {
            lessonSlug: "semantic-html",
            completed: true,
            savedScore: 100,
          },
        }),
      );
    });

    expect(screen.getByText("1 of 1 complete")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.getByText(/Best 100%/)).toBeInTheDocument();
  });
});
