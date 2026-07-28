import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getInterviewDrillForStudent,
  saveInterviewDrillAnswer,
  startInterviewDrill,
} from "@/db/interview-drill";
import { auth } from "@/lib/auth";
import { validateInterviewDrillRequest } from "@/lib/interview-drill";

type RouteContext = {
  params: Promise<{ drillSlug: string }>;
};

async function getSessionUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user.id ?? null;
}

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to view your interview drill." },
      { status: 401 },
    );
  }

  const { drillSlug } = await context.params;
  const progress = await getInterviewDrillForStudent(userId, drillSlug);

  if (!progress) {
    return NextResponse.json({ error: "Drill not found." }, { status: 404 });
  }

  return NextResponse.json({ progress });
}

export async function POST(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save your interview answers." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read that response. Try again." },
      { status: 400 },
    );
  }

  const requestPayload = validateInterviewDrillRequest(payload);

  if (!requestPayload.valid) {
    return NextResponse.json(
      { error: requestPayload.error },
      { status: 400 },
    );
  }

  const { drillSlug } = await context.params;
  const progress =
    requestPayload.action === "start"
      ? await startInterviewDrill(userId, drillSlug)
      : await saveInterviewDrillAnswer(
          userId,
          drillSlug,
          requestPayload.questionSlug,
          requestPayload.answer,
          requestPayload.rating,
        );

  if (!progress) {
    return NextResponse.json({ error: "Drill not found." }, { status: 404 });
  }

  return NextResponse.json({ progress });
}
