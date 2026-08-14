import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { saveTimedCodingChallengeResultForStudent } from "@/db/timed-coding-challenge";
import { auth } from "@/lib/auth";
import {
  getTimedCodingChallengeSet,
  isTimedCodingChallengeElapsedSeconds,
  isTimedCodingChallengeSetId,
} from "@/lib/timed-coding-challenge";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    challengeSetId?: unknown;
    elapsedSeconds?: unknown;
  } | null;
  if (
    !isTimedCodingChallengeSetId(body?.challengeSetId) ||
    !isTimedCodingChallengeElapsedSeconds(body?.elapsedSeconds)
  ) {
    return NextResponse.json(
      { error: "Choose a valid timed set and elapsed time" },
      { status: 400 },
    );
  }

  const challengeSet = getTimedCodingChallengeSet(body.challengeSetId);
  if (!challengeSet) {
    return NextResponse.json({ error: "Timed set not found" }, { status: 400 });
  }

  const progress = await getCodingCatalogProgress(session.user.id);
  const acceptedSlugs = new Set(progress.completedSlugs);
  const solvedCount = challengeSet.problems.filter((problem) =>
    acceptedSlugs.has(problem.slug),
  ).length;
  const saved = await saveTimedCodingChallengeResultForStudent(
    session.user.id,
    {
      challengeSetId: body.challengeSetId,
      solvedCount,
      elapsedSeconds: body.elapsedSeconds,
    },
  );

  if (!saved) {
    return NextResponse.json(
      { error: "Timed result could not be saved" },
      { status: 500 },
    );
  }

  return NextResponse.json(saved);
}
