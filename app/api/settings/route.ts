import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getLearnerSettingsForStudent,
  saveLearnerSettingsForStudent,
} from "@/db/course";
import { auth } from "@/lib/auth";
import { validateLearnerSettings } from "@/lib/learner-settings";

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Sign in to view your settings." },
      { status: 401 },
    );
  }

  const settings = await getLearnerSettingsForStudent(
    session.user.id,
    session.user.name,
  );

  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Sign in to save your settings." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read those settings. Try saving again." },
      { status: 400 },
    );
  }

  const result = validateLearnerSettings(payload);

  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const settings = await saveLearnerSettingsForStudent(
    session.user.id,
    result.certificateDisplayName,
  );

  return NextResponse.json({ settings });
}
