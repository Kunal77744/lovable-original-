import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getJavaScriptLabExerciseAttemptNote,
  saveJavaScriptLabExerciseAttemptNote,
} from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import { validateGuidedJavaScriptAttemptNote } from "@/lib/guided-javascript-attempt-notes";
import { isJavaScriptCodeLabExercise } from "@/lib/javascript-lab-progress";

type RouteContext = {
  params: Promise<{ labSlug: string; exerciseId: string }>;
};

async function getSessionUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to view your guided JavaScript attempt note." },
      { status: 401 },
    );
  }

  const { labSlug, exerciseId } = await context.params;

  if (!isJavaScriptCodeLabExercise(labSlug, exerciseId)) {
    return NextResponse.json({ error: "Exercise not found." }, { status: 404 });
  }

  const note = await getJavaScriptLabExerciseAttemptNote(
    userId,
    labSlug,
    exerciseId,
  );
  return NextResponse.json({ note });
}

export async function POST(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save your guided JavaScript attempt note." },
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

  const note = validateGuidedJavaScriptAttemptNote(payload);

  if (!note.valid) {
    return NextResponse.json({ error: note.error }, { status: 400 });
  }

  const { labSlug, exerciseId } = await context.params;

  if (!isJavaScriptCodeLabExercise(labSlug, exerciseId)) {
    return NextResponse.json({ error: "Exercise not found." }, { status: 404 });
  }

  const saved = await saveJavaScriptLabExerciseAttemptNote(
    userId,
    labSlug,
    exerciseId,
    note.content,
  );

  if (!saved) {
    return NextResponse.json({ error: "Exercise not found." }, { status: 404 });
  }

  return NextResponse.json({ note: saved });
}
