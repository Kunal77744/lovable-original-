import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { saveJavaScriptLabExerciseCompletion } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  context: { params: Promise<{ labSlug: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { labSlug } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    exerciseId?: unknown;
  } | null;
  const exerciseId =
    typeof body?.exerciseId === "string" ? body.exerciseId.trim() : "";
  const saved = await saveJavaScriptLabExerciseCompletion(
    session.user.id,
    labSlug,
    exerciseId,
  );

  if (!saved) {
    return NextResponse.json({ error: "Unknown lab exercise" }, { status: 404 });
  }

  return NextResponse.json(saved);
}
