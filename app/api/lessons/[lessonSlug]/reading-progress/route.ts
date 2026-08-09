import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { saveLessonReadingProgressForStudent } from "@/db/course";
import { auth } from "@/lib/auth";
import { isValidLessonReadingSection } from "@/lib/lesson-reading-progress";

type RouteContext = {
  params: Promise<{ lessonSlug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json(
      { error: "Sign in to save your reading place." },
      { status: 401 },
    );
  }

  let payload: { section?: unknown };

  try {
    payload = (await request.json()) as { section?: unknown };
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read that checkpoint. Try again." },
      { status: 400 },
    );
  }

  if (!isValidLessonReadingSection(payload.section)) {
    return NextResponse.json(
      { error: "Choose a lesson section from 1 to 3." },
      { status: 400 },
    );
  }

  const { lessonSlug } = await context.params;
  const progress = await saveLessonReadingProgressForStudent(
    session.user.id,
    lessonSlug,
    Number(payload.section),
  );

  if (!progress) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  return NextResponse.json(progress);
}
