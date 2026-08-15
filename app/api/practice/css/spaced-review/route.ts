import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getCssPracticeCatalogProgress } from "@/db/css-practice";
import {
  getCssSpacedReviewResultForStudent,
  saveCssSpacedReviewResultForStudent,
} from "@/db/css-spaced-review";
import { auth } from "@/lib/auth";
import {
  isBoundedCssSpacedReviewResult,
  isCssSpacedReviewDue,
} from "@/lib/css-spaced-review";

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
    !isBoundedCssSpacedReviewResult({
      correctCount: result.correctCount,
      totalCount: result.totalCount,
    })
  ) {
    return NextResponse.json(
      { error: "Complete every review prompt" },
      { status: 400 },
    );
  }

  const [progress, savedResult] = await Promise.all([
    getCssPracticeCatalogProgress(session.user.id),
    getCssSpacedReviewResultForStudent(session.user.id),
  ]);
  if (progress.completedCount !== progress.totalCount) {
    return NextResponse.json(
      { error: "Complete all six CSS challenges before review" },
      { status: 403 },
    );
  }
  if (!isCssSpacedReviewDue(savedResult)) {
    return NextResponse.json(
      { error: "Your next review is not due yet" },
      { status: 409 },
    );
  }

  const saved = await saveCssSpacedReviewResultForStudent(session.user.id, {
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
