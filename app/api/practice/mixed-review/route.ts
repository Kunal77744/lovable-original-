import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getJavaScriptMixedReviewResultForStudent,
  saveJavaScriptMixedReviewResultForStudent,
} from "@/db/javascript-mixed-review";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import {
  buildJavaScriptMixedReviewSession,
  isBoundedJavaScriptMixedReviewResult,
  isJavaScriptMixedReviewDue,
} from "@/lib/javascript-mixed-review";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    correctCount?: unknown;
    totalCount?: unknown;
  } | null;
  const result = {
    correctCount: body?.correctCount,
    totalCount: body?.totalCount,
  };
  if (
    typeof result.correctCount !== "number" ||
    typeof result.totalCount !== "number" ||
    !isBoundedJavaScriptMixedReviewResult({
      correctCount: result.correctCount,
      totalCount: result.totalCount,
    })
  ) {
    return NextResponse.json(
      { error: "Complete every review prompt" },
      { status: 400 },
    );
  }

  const [labProgress, savedResult] = await Promise.all([
    getJavaScriptLabCatalogProgress(session.user.id),
    getJavaScriptMixedReviewResultForStudent(session.user.id),
  ]);
  if (!isJavaScriptMixedReviewDue(savedResult)) {
    return NextResponse.json(
      { error: "Your next review is not due yet" },
      { status: 409 },
    );
  }

  const availablePromptCount = buildJavaScriptMixedReviewSession(
    labProgress.labs,
  ).length;
  if (availablePromptCount === 0 || result.totalCount !== availablePromptCount) {
    return NextResponse.json(
      { error: "Complete the current review set" },
      { status: 400 },
    );
  }

  const saved = await saveJavaScriptMixedReviewResultForStudent(session.user.id, {
    correctCount: result.correctCount,
    totalCount: result.totalCount,
  });
  if (!saved) {
    return NextResponse.json(
      { error: "Review result could not be saved" },
      { status: 500 },
    );
  }

  return NextResponse.json(saved);
}
