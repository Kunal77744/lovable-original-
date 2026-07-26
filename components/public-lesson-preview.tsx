import Link from "next/link";
import { FIRST_LESSON_PASS_PERCENT } from "@/lib/first-course-content";
import { LessonReading } from "./lesson-reading";

type PublicLessonPreviewProps = {
  course: {
    slug: string;
    title: string;
  };
  lesson: {
    slug: string;
    title: string;
    description: string;
    moduleTitle: string;
    position: number;
    estimatedMinutes: number;
  };
};

export function PublicLessonPreview({
  course,
  lesson,
}: PublicLessonPreviewProps) {
  return (
    <div className="lesson-shell public-lesson-shell">
      <aside className="lesson-rail public-lesson-rail" aria-label="Lesson path">
        <Link className="lesson-back-link" href="/courses">
          <span aria-hidden="true">←</span>
          All learning paths
        </Link>
        <p>{course.title}</p>
        <div className="public-access-note">
          <span>Free for students</span>
          <p>No payment or account needed to read this lesson.</p>
        </div>
        <ol>
          <li aria-current="step">
            <span>{lesson.position}</span>
            <div>
              <strong>{lesson.title}</strong>
              <small>{lesson.estimatedMinutes} min · Open now</small>
            </div>
          </li>
        </ol>
      </aside>

      <article className="lesson-content">
        <header className="lesson-hero public-lesson-hero">
          <div className="lesson-meta">
            <span>{lesson.moduleTitle}</span>
            <span>{lesson.estimatedMinutes} min lesson · Free</span>
          </div>
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>
          <a className="lesson-start-link" href="#lesson-idea">
            Read the lesson
            <span aria-hidden="true">↓</span>
          </a>
        </header>

        <LessonReading />

        <section
          className="lesson-save-boundary"
          aria-labelledby="save-boundary-title"
        >
          <div className="save-boundary-copy">
            <p className="eyebrow">Your private workspace</p>
            <h2 id="save-boundary-title">Keep the work you do next.</h2>
            <p>
              The lesson is free to read. A free student account gives your
              notes, graded assignment, quiz result, and revision progress a
              private place to return to.
            </p>
            <Link className="primary-action" href="/account">
              Create a free account to save
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ul aria-label="What a free student account saves">
            <li>
              <strong>Private notes</strong>
              <span>Your own explanation stays attached to the lesson.</span>
            </li>
            <li>
              <strong>Graded page</strong>
              <span>Your semantic HTML and five-check result return intact.</span>
            </li>
            <li>
              <strong>Quiz and revision</strong>
              <span>
                Keep your best score, pass at {FIRST_LESSON_PASS_PERCENT}%, and
                revisit five flashcards.
              </span>
            </li>
          </ul>
        </section>
      </article>
    </div>
  );
}
