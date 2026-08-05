import { headers } from "next/headers";
import {
  getCssPracticePathFeedbackForStudent,
  saveCssPracticePathFeedbackForStudent,
} from "@/db/css-practice";
import { auth } from "@/lib/auth";
import { validateCssPathFeedback } from "@/lib/css-path-feedback";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json(
      { error: "Sign in to view feedback." },
      { status: 401 },
    );
  }

  return Response.json(
    await getCssPracticePathFeedbackForStudent(session.user.id),
  );
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json(
      { error: "Sign in to save feedback." },
      { status: 401 },
    );
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

  const validation = validateCssPathFeedback(payload);

  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const feedback = await saveCssPracticePathFeedbackForStudent(
    session.user.id,
    validation.usefulness,
    validation.comment,
  );

  if (!feedback) {
    return Response.json(
      { error: "Complete all six CSS challenges before leaving feedback." },
      { status: 403 },
    );
  }

  return Response.json({ feedback });
}
