import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getFirstLessonNote,
  saveFirstLessonNote,
} from "@/db/course";
import { validateLessonNote } from "@/lib/lesson-notes";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ lessonSlug: string }>;
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
      { error: "Sign in to view your lesson note." },
      { status: 401 },
    );
  }

  const { lessonSlug } = await context.params;
  const result = await getFirstLessonNote(userId, lessonSlug);

  if (!result) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save your lesson note." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read that note. Try saving it again." },
      { status: 400 },
    );
  }

  const note = validateLessonNote(payload);

  if (!note.valid) {
    return NextResponse.json({ error: note.error }, { status: 400 });
  }

  const { lessonSlug } = await context.params;
  const saved = await saveFirstLessonNote(userId, lessonSlug, note.content);

  if (!saved) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  return NextResponse.json({ note: saved });
}
