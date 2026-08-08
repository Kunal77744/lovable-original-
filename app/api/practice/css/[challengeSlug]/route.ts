import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getCssPracticeChallengeForStudent,
  saveCssPracticeAttempt,
  saveCssPracticeDraft,
} from "@/db/css-practice";
import { auth } from "@/lib/auth";
import {
  hasValidCssChallengeLength,
  MAX_CSS_CHALLENGE_LENGTH,
} from "@/lib/css-practice-challenges";

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
      { error: "Sign in to restore your saved CSS." },
      { status: 401 },
    );
  }

  const { challengeSlug } = await context.params;
  const state = await getCssPracticeChallengeForStudent(userId, challengeSlug);

  if (!state) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  return NextResponse.json(state);
}

export async function POST(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save this CSS attempt." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read that CSS. Try again." },
      { status: 400 },
    );
  }

  const css =
    typeof payload === "object" &&
    payload !== null &&
    "css" in payload &&
    typeof payload.css === "string"
      ? payload.css
      : "";
  const mode =
    typeof payload === "object" &&
    payload !== null &&
    "mode" in payload &&
    payload.mode === "draft"
      ? "draft"
      : "submit";

  if (!hasValidCssChallengeLength(css)) {
    return NextResponse.json(
      {
        error: `Keep the CSS between 1 and ${MAX_CSS_CHALLENGE_LENGTH.toLocaleString()} characters.`,
      },
      { status: 400 },
    );
  }

  const { challengeSlug } = await context.params;

  if (mode === "draft") {
    const draft = await saveCssPracticeDraft(userId, challengeSlug, css);

    if (!draft) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
    }

    return NextResponse.json(draft);
  }

  const attempt = await saveCssPracticeAttempt(userId, challengeSlug, css);

  if (!attempt) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  return NextResponse.json(attempt);
}
