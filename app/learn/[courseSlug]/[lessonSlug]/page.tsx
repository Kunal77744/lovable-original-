import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { LessonQuiz } from "@/components/lesson-quiz";
import { LessonProgressRail } from "@/components/lesson-progress-rail";
import { LessonStartTracker } from "@/components/lesson-start-tracker";
import { LessonNotes } from "@/components/lesson-notes";
import { SemanticHtmlTutor } from "@/components/semantic-html-tutor";
import { SemanticHtmlWorkspace } from "@/components/semantic-html-workspace";
import {
  getFirstCourseLessonForStudent,
  getCourseFeedbackForStudent,
  getFirstLessonArtifact,
  getFirstLessonNote,
} from "@/db/course";
import {
  FIRST_COURSE,
  FIRST_COURSE_LESSONS,
  FIRST_LESSON,
  FIRST_LESSON_PASS_PERCENT,
  getPublicFirstLessonQuiz,
} from "@/lib/first-course-content";
import {
  gradeSemanticHtml,
  SEMANTIC_HTML_STARTER,
} from "@/lib/semantic-html-workspace";
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
  const { courseSlug, lessonSlug } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const publicLesson =
    courseSlug === FIRST_COURSE.slug && lessonSlug === FIRST_LESSON.slug
      ? {
          courseSlug: FIRST_COURSE.slug,
          courseTitle: FIRST_COURSE.title,
          lessonId: FIRST_LESSON.id,
          lessonSlug: FIRST_LESSON.slug,
          lessonTitle: FIRST_LESSON.title,
          lessonDescription: FIRST_LESSON.description,
          moduleTitle: FIRST_LESSON.moduleTitle,
          position: FIRST_LESSON.position,
          estimatedMinutes: FIRST_LESSON.estimatedMinutes,
          completed: false,
          quizScore: null,
          completedLessons: 0,
          totalLessons: FIRST_COURSE_LESSONS.length,
          courseCompleted: false,
          lessons: FIRST_COURSE_LESSONS.map((courseLesson) => ({
            id: courseLesson.id,
            slug: courseLesson.slug,
            title: courseLesson.title,
            description: courseLesson.description,
            moduleTitle: courseLesson.moduleTitle,
            position: courseLesson.position,
            estimatedMinutes: courseLesson.estimatedMinutes,
            completed: false,
            quizScore: null,
          })),
        }
      : null;

  const studentLesson = session
    ? await getFirstCourseLessonForStudent(
        session.user.id,
        courseSlug,
        lessonSlug,
      )
    : publicLesson;

  if (!studentLesson) {
    notFound();
  }

  const [workspace, lessonNote, courseFeedback] = session
    ? await Promise.all([
        getFirstLessonArtifact(session.user.id, studentLesson.lessonSlug),
        getFirstLessonNote(session.user.id, studentLesson.lessonSlug),
        getCourseFeedbackForStudent(session.user.id, courseSlug),
      ])
    : [
        {
          html: SEMANTIC_HTML_STARTER,
          checks: gradeSemanticHtml(SEMANTIC_HTML_STARTER),
          saved: false,
        },
        { note: null },
        null,
      ];

  if (!workspace || !lessonNote) {
    notFound();
  }

  const quiz = getPublicFirstLessonQuiz();
  const completesCourse = studentLesson.lessons.every(
    (courseLesson) =>
      courseLesson.completed ||
      courseLesson.slug === studentLesson.lessonSlug,
  );

  return (
    <main className="lesson-page">
      {session ? (
        <LessonStartTracker
          courseSlug={courseSlug}
          lessonSlug={studentLesson.lessonSlug}
          alreadyCompleted={studentLesson.completed}
        />
      ) : null}
      <SiteNav currentPage="lesson" studentSession={Boolean(session)} />
      <div className="lesson-shell">
        <LessonProgressRail
          courseTitle={studentLesson.courseTitle}
          courseSlug={studentLesson.courseSlug}
          moduleTitle={studentLesson.moduleTitle}
          currentLessonSlug={studentLesson.lessonSlug}
          signedIn={Boolean(session)}
          initialCompletedLessons={studentLesson.completedLessons}
          totalLessons={studentLesson.totalLessons}
          initialCourseCompleted={studentLesson.courseCompleted}
          initialLessons={studentLesson.lessons}
        />

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
                <h3>Build the structure before you style it.</h3>
                <p>
                  Use the workspace below to recreate the example without copying
                  it. Then point to each element and say its job aloud. If you
                  cannot name the job, reconsider the element.
                </p>
              </div>
            </div>
          </section>

          <SemanticHtmlTutor />

          <LessonNotes
            lessonSlug={studentLesson.lessonSlug}
            initialNote={lessonNote.note}
            isSignedIn={Boolean(session)}
          />

          <SemanticHtmlWorkspace
            lessonSlug={studentLesson.lessonSlug}
            initialHtml={workspace.html}
            initialChecks={workspace.checks}
            initiallySaved={workspace.saved}
            isSignedIn={Boolean(session)}
          />

          <LessonQuiz
            courseTitle={studentLesson.courseTitle}
            courseLessonCount={studentLesson.totalLessons}
            completesCourse={completesCourse}
            courseSlug={courseSlug}
            lessonSlug={studentLesson.lessonSlug}
            questions={quiz}
            passPercent={FIRST_LESSON_PASS_PERCENT}
            initialCompleted={studentLesson.completed}
            initialScore={studentLesson.quizScore}
            initialFeedback={courseFeedback?.feedback ?? null}
            isSignedIn={Boolean(session)}
          />
        </article>
      </div>
    </main>
  );
}
