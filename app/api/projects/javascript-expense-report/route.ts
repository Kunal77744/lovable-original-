import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getJavaScriptCapstoneForStudent,
  saveJavaScriptCapstoneDraft,
  submitJavaScriptCapstone,
} from "@/db/javascript-capstone";
import { auth } from "@/lib/auth";
import {
  hasValidJavaScriptCapstoneCode,
  MAX_JAVASCRIPT_CAPSTONE_LENGTH,
} from "@/lib/javascript-capstone";

async function getSessionUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user.id ?? null;
}

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to restore your saved JavaScript project." },
      { status: 401 },
    );
  }

  return NextResponse.json(await getJavaScriptCapstoneForStudent(userId));
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save and review this project." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read that project. Try again." },
      { status: 400 },
    );
  }

  const code =
    typeof payload === "object" &&
    payload !== null &&
    "code" in payload &&
    typeof payload.code === "string"
      ? payload.code
      : "";
  const action =
    typeof payload === "object" &&
    payload !== null &&
    "action" in payload &&
    (payload.action === "save" || payload.action === "submit")
      ? payload.action
      : null;

  if (!hasValidJavaScriptCapstoneCode(code)) {
    return NextResponse.json(
      {
        error: `Keep the project between 1 and ${MAX_JAVASCRIPT_CAPSTONE_LENGTH.toLocaleString()} characters.`,
      },
      { status: 400 },
    );
  }

  if (!action) {
    return NextResponse.json(
      { error: "Choose whether to save the draft or submit it for review." },
      { status: 400 },
    );
  }

  if (action === "save") {
    const project = await saveJavaScriptCapstoneDraft(userId, code);
    return project
      ? NextResponse.json(project)
      : NextResponse.json(
          { error: "The project could not be saved." },
          { status: 500 },
        );
  }

  const outputs =
    typeof payload === "object" && payload !== null && "outputs" in payload
      ? payload.outputs
      : null;
  const result = await submitJavaScriptCapstone(userId, code, outputs);

  if (!result) {
    return NextResponse.json(
      { error: "The review result was incomplete. Run all six checks again." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ...result.project,
    firstCompletedReview: result.completedForFirstTime,
  });
}
