import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { saveFirstLessonQuizResult } from "@/db/course";
import {
  gradeLessonQuiz,
  type QuizAnswers,
} from "@/lib/first-course-content";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ lessonSlug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Sign in to save progress." }, { status: 401 });
  }

  let payload: { answers?: QuizAnswers };

  try {
    payload = (await request.json()) as { answers?: QuizAnswers };
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read those answers. Try again." },
      { status: 400 },
    );
  }

  if (!payload.answers || typeof payload.answers !== "object") {
    return NextResponse.json(
      { error: "Answer every question before checking your work." },
      { status: 400 },
    );
  }

  const { lessonSlug } = await context.params;
  const result = gradeLessonQuiz(lessonSlug, payload.answers);

  if (!result.valid) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === "Lesson not found." ? 404 : 400 },
    );
  }

  const progress = await saveFirstLessonQuizResult(
    session.user.id,
    lessonSlug,
    result.score,
    result.passed,
  );

  if (!progress) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  return NextResponse.json({
    score: result.score,
    correctCount: result.correctCount,
    totalCount: result.totalCount,
    passed: result.passed,
    completed: progress.completed,
    savedScore: progress.quizScore,
    review: result.review,
  });
}
