import type { Metadata } from "next";
import Link from "next/link";
import {
  LEARNING_PATHS,
  STUDENT_ACCESS_PROMISE,
} from "@/lib/first-course-content";
import { SiteFooter, SiteNav, SkipLink } from "../site-chrome";

export const metadata: Metadata = {
  title: "Free learning paths | Lovable Original",
  description:
    "Explore every Lovable Original course path for free. Read lessons without an account, then create one only to save private work and progress.",
  alternates: {
    canonical: "/courses",
  },
};

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
    >
      <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function CoursesPage() {
  return (
    <>
      <SkipLink />
      <SiteNav currentPage="course" />

      <main id="main-content" tabIndex={-1}>
        <section
          className="catalog-hero"
          aria-labelledby="learning-paths-title"
        >
          <div className="catalog-hero-copy">
            <p className="eyebrow">Free student learning</p>
            <h1 id="learning-paths-title">
              Every learning path here is free.
            </h1>
            <p className="catalog-lede">{STUDENT_ACCESS_PROMISE}</p>
            <p className="catalog-boundary">
              Read every available course and lesson without a payment gate.
              Create a free account only when you want to save private notes,
              graded work, quiz results, or revision progress.
            </p>
          </div>

          <aside className="catalog-promise" aria-label="The free access promise">
            <p>What free means here</p>
            <ol>
              <li>
                <span>01</span>
                <strong>No course paywall</strong>
              </li>
              <li>
                <span>02</span>
                <strong>Lessons open before signup</strong>
              </li>
              <li>
                <span>03</span>
                <strong>Your saved work stays private</strong>
              </li>
            </ol>
          </aside>
        </section>

        <section className="catalog-list" aria-labelledby="catalog-title">
          <div className="catalog-heading">
            <div>
              <p className="eyebrow">Available now</p>
              <h2 id="catalog-title">Start with one complete path.</h2>
            </div>
            <p>
              {LEARNING_PATHS.length} live{" "}
              {LEARNING_PATHS.length === 1 ? "course" : "courses"}
            </p>
          </div>

          <div className="catalog-courses">
            {LEARNING_PATHS.map((path) => {
              const firstLesson = path.lessons[0];
              const totalMinutes = path.lessons.reduce(
                (total, lesson) => total + lesson.estimatedMinutes,
                0,
              );

              return (
                <article className="catalog-course" key={path.slug}>
                  <div className="catalog-course-copy">
                    <div className="catalog-course-meta">
                      <span>Free for students</span>
                      <span>
                        {path.lessons.length}{" "}
                        {path.lessons.length === 1 ? "lesson" : "lessons"} ·{" "}
                        {totalMinutes} min
                      </span>
                    </div>
                    <h3>
                      <Link href={`/courses/${path.slug}`}>{path.title}</Link>
                    </h3>
                    <p>{path.description}</p>
                    <strong>{path.outcome}</strong>
                  </div>

                  <div className="catalog-course-lesson">
                    <span className="catalog-lesson-number">Lesson 01</span>
                    <p>{firstLesson.moduleTitle}</p>
                    <h4>{firstLesson.title}</h4>
                    <span>{firstLesson.description}</span>
                    <Link
                      className="primary-action"
                      href={`/learn/${path.slug}/${firstLesson.slug}`}
                    >
                      Read the free lesson
                      <ArrowIcon />
                    </Link>
                    <small>No account needed to read</small>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
