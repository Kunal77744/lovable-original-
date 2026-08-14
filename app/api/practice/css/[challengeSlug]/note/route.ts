import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getCssPracticeAttemptNoteForStudent,
  saveCssPracticeAttemptNote,
} from "@/db/css-practice";
import { auth } from "@/lib/auth";
import { validateCssAttemptNote } from "@/lib/css-attempt-notes";
import { getCssPracticeChallenge } from "@/lib/css-practice-challenges";

type RouteContext = {
  params: Promise<{ challengeSlug: string }>;
};

async function getSessionUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to view your CSS attempt note." },
      { status: 401 },
    );
  }

  const { challengeSlug } = await context.params;

  if (!getCssPracticeChallenge(challengeSlug)) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  const note = await getCssPracticeAttemptNoteForStudent(userId, challengeSlug);
  return NextResponse.json({ note });
}

export async function POST(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save your CSS attempt note." },
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

  const note = validateCssAttemptNote(payload);

  if (!note.valid) {
    return NextResponse.json({ error: note.error }, { status: 400 });
  }

  const { challengeSlug } = await context.params;
  const saved = await saveCssPracticeAttemptNote(
    userId,
    challengeSlug,
    note.content,
  );

  if (!saved) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  return NextResponse.json({ note: saved });
}
