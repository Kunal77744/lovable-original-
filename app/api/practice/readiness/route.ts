import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { saveJavaScriptReadinessResultForStudent } from "@/db/javascript-readiness";
import { auth } from "@/lib/auth";
import {
  gradeJavaScriptReadiness,
  type JavaScriptReadinessAnswer,
} from "@/lib/javascript-readiness";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    answers?: unknown;
  } | null;
  if (!Array.isArray(body?.answers)) {
    return NextResponse.json({ error: "Complete every readiness check" }, { status: 400 });
  }

  const answers = body.answers.every(
    (answer) =>
      typeof answer === "object" &&
      answer !== null &&
      typeof (answer as { questionId?: unknown }).questionId === "string" &&
      typeof (answer as { optionId?: unknown }).optionId === "string",
  )
    ? (body.answers as JavaScriptReadinessAnswer[])
    : null;
  const grade = answers ? gradeJavaScriptReadiness(answers) : null;
  if (!grade) {
    return NextResponse.json({ error: "Complete every readiness check" }, { status: 400 });
  }

  const saved = await saveJavaScriptReadinessResultForStudent(
    session.user.id,
    grade,
  );
  if (!saved) {
    return NextResponse.json({ error: "Readiness result could not be saved" }, { status: 500 });
  }

  return NextResponse.json(saved);
}
