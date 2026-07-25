import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LessonQuiz } from "@/components/lesson-quiz";
import { getFirstCourseLessonForStudent } from "@/db/course";
import {
  FIRST_LESSON_PASS_PERCENT,
  getPublicFirstLessonQuiz,
} from "@/lib/first-course-content";
import { auth } from "@/lib/auth";
import { SiteNav } from "../../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Semantic HTML lesson | Lovable Original",
  description:
    "Learn to build an accessible page structure with semantic HTML, then check your understanding.",
  robots: {
    index: false,
    follow: false,
  },
};

type LessonPageProps = {
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const { courseSlug, lessonSlug } = await params;
  const studentLesson = await getFirstCourseLessonForStudent(
    session.user.id,
    courseSlug,
    lessonSlug,
  );

  if (!studentLesson) {
    notFound();
  }

  const quiz = getPublicFirstLessonQuiz();

  return (
    <main className="lesson-page">
      <SiteNav currentPage="lesson" />
      <div className="lesson-shell">
        <aside className="lesson-rail" aria-label="Course progress">
          <Link className="lesson-back-link" href="/dashboard">
            <span aria-hidden="true">←</span>
            Dashboard
          </Link>
          <p>{studentLesson.courseTitle}</p>
          <div className="lesson-rail-progress">
            <span
              className={studentLesson.completed ? "is-complete" : ""}
              aria-hidden="true"
            />
            <div>
              <strong>{studentLesson.moduleTitle}</strong>
              <small>
                {studentLesson.completed ? "1 of 1 complete" : "0 of 1 complete"}
              </small>
            </div>
          </div>
          <ol>
            <li aria-current="step">
              <span>{studentLesson.completed ? "✓" : "1"}</span>
              <div>
                <strong>{studentLesson.lessonTitle}</strong>
                <small>{studentLesson.estimatedMinutes} min</small>
              </div>
            </li>
          </ol>
        </aside>

        <article className="lesson-content">
          <header className="lesson-hero">
            <div className="lesson-meta">
              <span>{studentLesson.moduleTitle}</span>
              <span>{studentLesson.estimatedMinutes} min lesson</span>
            </div>
            <h1>{studentLesson.lessonTitle}</h1>
            <p>{studentLesson.lessonDescription}</p>
            <a className="lesson-start-link" href="#lesson-idea">
              Start with the idea
              <span aria-hidden="true">↓</span>
            </a>
          </header>

          <section className="lesson-section" id="lesson-idea">
            <p className="lesson-section-number">01</p>
            <div>
              <h2>Structure is meaning before it is styling.</h2>
              <p>
                A browser does more than draw boxes. It builds a document outline
                from your HTML so keyboards, screen readers, search engines, and
                your future CSS can understand what each part is for.
              </p>
              <p>
                Start every page with a small, valid skeleton. The metadata belongs
                in <code>&lt;head&gt;</code>; everything a person sees belongs in{" "}
                <code>&lt;body&gt;</code>.
              </p>
              <pre aria-label="A minimal HTML document">
                <code>{`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>My first article</title>
  </head>
  <body>
    <!-- Visible page content goes here -->
  </body>
</html>`}</code>
              </pre>
              <div className="lesson-note">
                <strong>Why the language matters</strong>
                <p>
                  <code>lang=&quot;en&quot;</code> helps assistive technology use
                  the right pronunciation rules. It is a tiny detail with a real
                  user effect.
                </p>
              </div>
            </div>
          </section>

          <section className="lesson-section">
            <p className="lesson-section-number">02</p>
            <div>
              <h2>Choose elements by purpose, not appearance.</h2>
              <p>
                Semantic elements name the job a region performs. A{" "}
                <code>&lt;header&gt;</code> introduces content,{" "}
                <code>&lt;main&gt;</code> holds the page’s unique focus, and{" "}
                <code>&lt;footer&gt;</code> closes it with supporting information.
              </p>
              <div className="semantic-map" aria-label="Semantic page structure">
                <div>
                  <span>&lt;header&gt;</span>
                  <small>Identity and navigation</small>
                </div>
                <div className="semantic-map-main">
                  <span>&lt;main&gt;</span>
                  <small>The page’s unique content</small>
                  <div>
                    <span>&lt;article&gt;</span>
                    <small>A complete, standalone story</small>
                  </div>
                </div>
                <div>
                  <span>&lt;footer&gt;</span>
                  <small>Supporting context</small>
                </div>
              </div>
              <p>
                Use <code>&lt;article&gt;</code> when content could stand on its
                own, such as a tutorial or post. Use <code>&lt;section&gt;</code>{" "}
                to group a themed part of that content. Reach for{" "}
                <code>&lt;div&gt;</code> only when no meaningful element fits.
              </p>
            </div>
          </section>

          <section className="lesson-section">
            <p className="lesson-section-number">03</p>
            <div>
              <h2>Build a heading outline someone can scan.</h2>
              <p>
                Headings communicate hierarchy. Use one clear <code>&lt;h1&gt;</code>{" "}
                for the page topic, then <code>&lt;h2&gt;</code> for its direct
                sections. Do not pick a heading level because of its default font
                size; CSS controls appearance.
              </p>
              <pre aria-label="A semantic article structure">
                <code>{`<body>
  <header>
    <nav aria-label="Main navigation">…</nav>
  </header>

  <main>
    <article>
      <h1>How the browser reads a page</h1>
      <section>
        <h2>Start with landmarks</h2>
        <p>…</p>
      </section>
    </article>
  </main>

  <footer>Written by Kunal</footer>
</body>`}</code>
              </pre>
              <div className="lesson-practice">
                <p className="quiz-kicker">Two-minute build</p>
                <h3>Explain the structure before you style it.</h3>
                <p>
                  In a blank file, recreate the example without copying it. Then
                  point to each element and say its job aloud. If you cannot name
                  the job, reconsider the element.
                </p>
              </div>
            </div>
          </section>

          <LessonQuiz
            lessonSlug={studentLesson.lessonSlug}
            questions={quiz}
            passPercent={FIRST_LESSON_PASS_PERCENT}
            initialCompleted={studentLesson.completed}
            initialScore={studentLesson.quizScore}
          />
        </article>
      </div>
    </main>
  );
}
