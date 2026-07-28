export const LESSON_PROGRESS_UPDATED = "lesson-progress-updated";

export type LessonProgressUpdate = {
  lessonSlug: string;
  completed: boolean;
  savedScore: number;
};

export function announceLessonProgress(update: LessonProgressUpdate) {
  window.dispatchEvent(
    new CustomEvent<LessonProgressUpdate>(LESSON_PROGRESS_UPDATED, {
      detail: update,
    }),
  );
}
