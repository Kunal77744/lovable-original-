import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  removeCodingProblemBookmark,
  saveCodingProblemBookmark,
} from "@/db/coding-practice";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ problemSlug: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("bookmarked" in body) ||
    typeof body.bookmarked !== "boolean"
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { problemSlug } = await params;
  const bookmark = body.bookmarked
    ? await saveCodingProblemBookmark(session.user.id, problemSlug)
    : await removeCodingProblemBookmark(session.user.id, problemSlug);

  if (!bookmark) {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  return NextResponse.json({ bookmark });
}
