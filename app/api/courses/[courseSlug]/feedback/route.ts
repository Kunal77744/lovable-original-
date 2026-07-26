import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getCourseFeedbackForStudent,
  saveCourseFeedbackForStudent,
} from "@/db/course";
import { validateCourseFeedback } from "@/lib/course-feedback";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ courseSlug: string }>;
};

async function getSessionUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user.id ?? null;
}

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to view your feedback." },
      { status: 401 },
    );
  }

  const { courseSlug } = await context.params;
  const result = await getCourseFeedbackForStudent(userId, courseSlug);

  if (!result) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save feedback." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read that feedback. Try again." },
      { status: 400 },
    );
  }

  const feedback = validateCourseFeedback(payload);

  if (!feedback.valid) {
    return NextResponse.json({ error: feedback.error }, { status: 400 });
  }

  const { courseSlug } = await context.params;
  const saved = await saveCourseFeedbackForStudent(
    userId,
    courseSlug,
    feedback.usefulness,
    feedback.comment,
  );

  if (!saved) {
    return NextResponse.json(
      { error: "Complete the course before leaving feedback." },
      { status: 403 },
    );
  }

  return NextResponse.json({ feedback: saved });
}
