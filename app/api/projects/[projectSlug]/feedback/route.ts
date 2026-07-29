import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getGuidedProjectFeedbackForStudent,
  saveGuidedProjectFeedbackForStudent,
} from "@/db/guided-project";
import { auth } from "@/lib/auth";
import { validateProjectFeedback } from "@/lib/project-feedback";

type RouteContext = {
  params: Promise<{ projectSlug: string }>;
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
      { error: "Sign in to view your project feedback." },
      { status: 401 },
    );
  }

  const { projectSlug } = await context.params;
  const result = await getGuidedProjectFeedbackForStudent(
    userId,
    projectSlug,
  );

  if (!result) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save project feedback." },
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

  const feedback = validateProjectFeedback(payload);

  if (!feedback.valid) {
    return NextResponse.json({ error: feedback.error }, { status: 400 });
  }

  const { projectSlug } = await context.params;
  const saved = await saveGuidedProjectFeedbackForStudent(
    userId,
    projectSlug,
    feedback.confidence,
    feedback.comment,
  );

  if (!saved) {
    return NextResponse.json(
      { error: "Complete the project before leaving feedback." },
      { status: 403 },
    );
  }

  return NextResponse.json({ feedback: saved });
}
