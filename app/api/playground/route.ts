import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getPlaygroundFile,
  savePlaygroundFile,
} from "@/db/javascript-playground";
import { auth } from "@/lib/auth";
import { validatePlaygroundCode } from "@/lib/javascript-playground";

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
      { error: "Sign in to open your saved playground." },
      { status: 401 },
    );
  }

  return NextResponse.json({ file: await getPlaygroundFile(userId) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save playground.js." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read that file. Try saving it again." },
      { status: 400 },
    );
  }

  const result = validatePlaygroundCode(payload);

  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const file = await savePlaygroundFile(userId, result.code);
  return NextResponse.json({ file });
}
