import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getFirstLessonArtifact, saveFirstLessonArtifact } from "@/db/course";
import {
  hasValidSemanticHtmlLength,
  MAX_SEMANTIC_HTML_LENGTH,
} from "@/lib/semantic-html-workspace";
import {
  hasValidCssPracticeLength,
  MAX_CSS_PRACTICE_LENGTH,
} from "@/lib/css-box-model-practice";
import {
  hasValidResponsiveCssLength,
  MAX_RESPONSIVE_CSS_LENGTH,
} from "@/lib/responsive-css-practice";
import {
  hasValidAccessibleFormsLength,
  MAX_ACCESSIBLE_FORMS_LENGTH,
} from "@/lib/accessible-forms-practice";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ lessonSlug: string }>;
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
      { error: "Sign in to open your saved workspace." },
      { status: 401 },
    );
  }

  const { lessonSlug } = await context.params;
  const artifact = await getFirstLessonArtifact(userId, lessonSlug);

  if (!artifact) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  return NextResponse.json(artifact);
}

export async function POST(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save this workspace." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read that draft. Try saving it again." },
      { status: 400 },
    );
  }

  const html =
    typeof payload === "object" &&
    payload !== null &&
    "html" in payload &&
    typeof payload.html === "string"
      ? payload.html
      : "";

  const { lessonSlug } = await context.params;
  const isBoxModelLesson = lessonSlug === "css-selectors-box-model";
  const isResponsiveLesson = lessonSlug === "responsive-css-grid";
  const isAccessibleFormsLesson = lessonSlug === "accessible-html-forms";
  const maxLength = isAccessibleFormsLesson
    ? MAX_ACCESSIBLE_FORMS_LENGTH
    : isResponsiveLesson
    ? MAX_RESPONSIVE_CSS_LENGTH
    : isBoxModelLesson
      ? MAX_CSS_PRACTICE_LENGTH
      : MAX_SEMANTIC_HTML_LENGTH;
  const hasValidLength = isAccessibleFormsLesson
    ? hasValidAccessibleFormsLength(html)
    : isResponsiveLesson
    ? hasValidResponsiveCssLength(html)
    : isBoxModelLesson
      ? hasValidCssPracticeLength(html)
      : hasValidSemanticHtmlLength(html);

  if (!hasValidLength) {
    return NextResponse.json(
      {
        error: `Keep the draft between 1 and ${maxLength.toLocaleString()} characters.`,
      },
      { status: 400 },
    );
  }

  const artifact = await saveFirstLessonArtifact(userId, lessonSlug, html);

  if (!artifact) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  return NextResponse.json(artifact);
}
