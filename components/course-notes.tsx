import Link from "next/link";
import { getFirstCourseLessonHref } from "@/lib/first-course-content";
import type { SavedLessonNote } from "@/lib/lesson-notes";
import styles from "./course-notes.module.css";

type CourseNotesLesson = {
  id: string;
  slug: string;
  title: string;
  description: string;
  moduleTitle: string;
  position: number;
  estimatedMinutes: number;
  completed: boolean;
  quizScore: number | null;
  note: SavedLessonNote | null;
};

type CourseNotesNextLesson = Pick<
  CourseNotesLesson,
  "slug" | "title" | "position"
>;

type CourseNotesCourse = {
  title: string;
  completedLessons: number;
  totalLessons: number;
  courseCompleted: boolean;
  nextLesson: CourseNotesNextLesson | null;
  lessons: CourseNotesLesson[];
};

function formatSavedTime(updatedAt: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(updatedAt));
}

export function CourseNotes({ course }: { course: CourseNotesCourse }) {
  const savedCount = course.lessons.filter((lesson) => lesson.note).length;
  const nextLesson = course.nextLesson ?? course.lessons[0] ?? null;
  const nextHref = course.courseCompleted
    ? "/courses/web-development-foundations/review"
    : nextLesson
      ? getFirstCourseLessonHref(nextLesson.slug)
      : "/dashboard";
  const nextLabel = course.courseCompleted
    ? "Open course review"
    : nextLesson
      ? `Continue lesson ${nextLesson.position}`
      : "Return to dashboard";

  return (
    <div className={styles.layout}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className="eyebrow">Private course notes</p>
          <h1 id="course-notes-title">Keep the ideas worth returning to.</h1>
          <p>
            Review what you wrote across {course.title}, then reopen the exact
            lesson to revise a note beside the idea and practice that shaped it.
          </p>
        </div>
        <aside className={styles.summary} aria-label="Course notes summary">
          <span>Saved to your account</span>
          <strong>
            {savedCount}<small>/{course.totalLessons}</small>
          </strong>
          <p>
            {savedCount === 1 ? "lesson has" : "lessons have"} a private note.
            Note text stays out of progress, grading, and analytics.
          </p>
        </aside>
      </header>

      <section className={styles.continue} aria-labelledby="notes-next-title">
        <div>
          <p>{course.courseCompleted ? "Recall is ready" : "Keep moving"}</p>
          <h2 id="notes-next-title">
            {course.courseCompleted
              ? "Turn your notes back into active recall."
              : nextLesson?.title ?? "Continue your course."}
          </h2>
          <span>
            {course.courseCompleted
              ? "Your completed course review keeps the saved result and schedule truthful."
              : `${course.completedLessons} of ${course.totalLessons} lessons complete. Your exact next lesson is ready.`}
          </span>
        </div>
        <Link className={styles.primaryAction} href={nextHref}>
          {nextLabel} <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className={styles.collection} aria-labelledby="saved-notes-title">
        <div className={styles.collectionHeading}>
          <div>
            <p className="eyebrow">Your notebook</p>
            <h2 id="saved-notes-title">One place for every lesson note.</h2>
          </div>
          <p>
            This view reads the notes you already saved. Opening it creates no
            learning record or analytics event.
          </p>
        </div>

        <ol className={styles.noteList}>
          {course.lessons.map((lesson) => (
            <li className={styles.noteCard} key={lesson.id}>
              <div className={styles.noteNumber} aria-hidden="true">
                {String(lesson.position).padStart(2, "0")}
              </div>
              <article>
                <div className={styles.noteHeading}>
                  <div>
                    <p>{lesson.moduleTitle}</p>
                    <h3>{lesson.title}</h3>
                  </div>
                  <span className={lesson.note ? styles.saved : styles.emptyStatus}>
                    {lesson.note ? "Saved note" : "No note yet"}
                  </span>
                </div>

                {lesson.note ? (
                  <>
                    <blockquote>{lesson.note.content}</blockquote>
                    <p className={styles.savedTime}>
                      Saved {formatSavedTime(lesson.note.updatedAt)}
                    </p>
                  </>
                ) : (
                  <p className={styles.emptyCopy}>
                    Open this lesson when you are ready to put one useful rule,
                    question, or example into your own words.
                  </p>
                )}

                <Link
                  className={styles.lessonLink}
                  href={`${getFirstCourseLessonHref(lesson.slug)}#lesson-notes`}
                >
                  {lesson.note ? "Revise in lesson" : "Write a lesson note"}
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
