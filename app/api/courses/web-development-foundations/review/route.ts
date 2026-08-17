import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
import {
  getWebFoundationsReviewResultForStudent,
  saveWebFoundationsReviewResultForStudent,
} from "@/db/web-foundations-review";
import { auth } from "@/lib/auth";
import { FIRST_COURSE_LESSONS } from "@/lib/first-course-content";
import {
  isBoundedWebFoundationsReviewResult,
  isWebFoundationsReviewDue,
} from "@/lib/web-foundations-review";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    correctCount?: unknown;
    totalCount?: unknown;
  } | null;
  const result = {
    correctCount: body?.correctCount,
    totalCount: body?.totalCount,
  };
  if (
    typeof result.correctCount !== "number" ||
    typeof result.totalCount !== "number" ||
    !isBoundedWebFoundationsReviewResult({
      correctCount: result.correctCount,
      totalCount: result.totalCount,
    })
  ) {
    return NextResponse.json(
      { error: "Complete every review prompt" },
      { status: 400 },
    );
  }

  const [course, savedResult] = await Promise.all([
    getOrCreateFirstCourseAssignment(session.user.id),
    getWebFoundationsReviewResultForStudent(session.user.id),
  ]);
  if (!course.courseCompleted) {
    return NextResponse.json(
      { error: `Complete all ${FIRST_COURSE_LESSONS.length} lessons before review` },
      { status: 403 },
    );
  }
  if (!isWebFoundationsReviewDue(savedResult)) {
    return NextResponse.json(
      { error: "Your next review is not due yet" },
      { status: 409 },
    );
  }

  const saved = await saveWebFoundationsReviewResultForStudent(
    session.user.id,
    {
      correctCount: result.correctCount,
      totalCount: result.totalCount,
    },
  );
  if (!saved) {
    return NextResponse.json(
      { error: "Review result could not be saved" },
      { status: 500 },
    );
  }

  return NextResponse.json(saved);
}
