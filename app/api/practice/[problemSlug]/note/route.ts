import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { saveCodingProblemNote } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import { validatePracticeSolutionNote } from "@/lib/practice-solution-note";

type RouteContext = {
  params: Promise<{ problemSlug: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const note = validatePracticeSolutionNote(payload);

  if (!note.valid) {
    return NextResponse.json({ error: note.error }, { status: 400 });
  }

  const { problemSlug } = await params;
  const saved = await saveCodingProblemNote(
    session.user.id,
    problemSlug,
    note.content,
  );

  if (saved.status === "problem_not_found") {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  if (saved.status === "accepted_required") {
    return NextResponse.json(
      { error: "Reach Accepted before saving a solution note." },
      { status: 403 },
    );
  }

  return NextResponse.json({ note: saved.note });
}
