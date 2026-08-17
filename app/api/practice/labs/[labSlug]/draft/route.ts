import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  MAX_JAVASCRIPT_LAB_DRAFT_LENGTH,
  saveJavaScriptLabExerciseDraft,
} from "@/db/javascript-lab-progress";
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
    source?: unknown;
  } | null;
  const exerciseId =
    typeof body?.exerciseId === "string" ? body.exerciseId.trim() : "";
  const source = typeof body?.source === "string" ? body.source : null;

  if (source === null || source.length > MAX_JAVASCRIPT_LAB_DRAFT_LENGTH) {
    return NextResponse.json(
      {
        error: `Source must be at most ${MAX_JAVASCRIPT_LAB_DRAFT_LENGTH} characters`,
      },
      { status: 400 },
    );
  }

  const saved = await saveJavaScriptLabExerciseDraft(
    session.user.id,
    labSlug,
    exerciseId,
    source,
  );

  if (!saved) {
    return NextResponse.json(
      { error: "Unknown code exercise" },
      { status: 404 },
    );
  }

  return NextResponse.json(saved);
}
