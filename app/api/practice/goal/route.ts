import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { saveCodingPracticeGoalForStudent } from "@/db/coding-practice-goal";
import { auth } from "@/lib/auth";
import { isCodingPracticeGoalTarget } from "@/lib/coding-practice-goal";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    targetActiveDays?: unknown;
  } | null;
  if (!isCodingPracticeGoalTarget(body?.targetActiveDays)) {
    return NextResponse.json(
      { error: "Choose 1, 3, or 5 active days" },
      { status: 400 },
    );
  }

  const saved = await saveCodingPracticeGoalForStudent(
    session.user.id,
    body.targetActiveDays,
  );
  if (!saved) {
    return NextResponse.json(
      { error: "Weekly target could not be saved" },
      { status: 500 },
    );
  }

  return NextResponse.json(saved);
}
