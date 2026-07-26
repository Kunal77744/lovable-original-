import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getCodingProblemForStudent,
  saveCodingDraft,
  saveCodingSubmission,
} from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import {
  hasValidCodingSolutionLength,
  MAX_CODING_SOLUTION_LENGTH,
} from "@/lib/coding-problems";

type RouteContext = {
  params: Promise<{ problemSlug: string }>;
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
      { error: "Sign in to restore your saved solution." },
      { status: 401 },
    );
  }

  const { problemSlug } = await context.params;
  const state = await getCodingProblemForStudent(userId, problemSlug);

  if (!state) {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  return NextResponse.json(state);
}

export async function POST(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save and submit your solution." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read that solution. Try again." },
      { status: 400 },
    );
  }

  const code =
    typeof payload === "object" &&
    payload !== null &&
    "code" in payload &&
    typeof payload.code === "string"
      ? payload.code
      : "";
  const mode =
    typeof payload === "object" &&
    payload !== null &&
    "mode" in payload &&
    payload.mode === "draft"
      ? "draft"
      : "submit";

  if (!hasValidCodingSolutionLength(code)) {
    return NextResponse.json(
      {
        error: `Keep the solution between 1 and ${MAX_CODING_SOLUTION_LENGTH.toLocaleString()} characters.`,
      },
      { status: 400 },
    );
  }

  const { problemSlug } = await context.params;

  if (mode === "draft") {
    const draft = await saveCodingDraft(userId, problemSlug, code);

    if (!draft) {
      return NextResponse.json({ error: "Problem not found." }, { status: 404 });
    }

    return NextResponse.json(draft);
  }

  const outputs =
    typeof payload === "object" && payload !== null && "outputs" in payload
      ? payload.outputs
      : null;
  const submission = await saveCodingSubmission(
    userId,
    problemSlug,
    code,
    outputs,
  );

  if (!submission) {
    return NextResponse.json(
      { error: "The test result was incomplete. Run the checks again." },
      { status: 400 },
    );
  }

  return NextResponse.json(submission);
}
