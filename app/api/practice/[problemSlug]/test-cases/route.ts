import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { saveCodingProblemTestCases } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import {
  buildLegacyCodingTestCases,
  validateCodingTestCases,
} from "@/lib/coding-test-cases";

type RouteContext = {
  params: Promise<{ problemSlug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json(
      { error: "Sign in to save private test cases." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read those test cases. Try again." },
      { status: 400 },
    );
  }

  const submittedCases =
    typeof body === "object" && body !== null && "cases" in body
      ? body.cases
      : typeof body === "object" && body !== null && "inputs" in body
        ? buildLegacyCodingTestCases(body.inputs)
        : null;
  const validation = validateCodingTestCases(submittedCases);

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { problemSlug } = await context.params;
  const testCases = await saveCodingProblemTestCases(
    session.user.id,
    problemSlug,
    validation.cases,
  );

  if (!testCases) {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  return NextResponse.json({ testCases });
}
