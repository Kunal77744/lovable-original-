import { headers } from "next/headers";
import {
  getPracticeFeedbackForStudent,
  savePracticeFeedbackForStudent,
} from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import { validatePracticeFeedback } from "@/lib/practice-feedback";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Sign in to view feedback." }, { status: 401 });
  }

  const problemSlug = new URL(request.url).searchParams.get("problemSlug") ?? "";
  const feedbackState = await getPracticeFeedbackForStudent(
    session.user.id,
    problemSlug,
  );

  if (!feedbackState) {
    return Response.json({ error: "Problem not found." }, { status: 404 });
  }

  return Response.json(feedbackState);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Sign in to save feedback." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "We couldn’t read that response. Try again." },
      { status: 400 },
    );
  }

  const validation = validatePracticeFeedback(payload);

  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const feedback = await savePracticeFeedbackForStudent(
    session.user.id,
    validation.problemSlug,
    validation.usefulness,
    validation.comment,
  );

  if (!feedback) {
    return Response.json(
      { error: "Reach your first Accepted result before leaving feedback." },
      { status: 403 },
    );
  }

  return Response.json({ feedback });
}
