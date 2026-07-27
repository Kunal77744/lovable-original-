import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getGuidedProjectForStudent,
  saveGuidedProjectDraft,
  submitGuidedProjectForReview,
} from "@/db/guided-project";
import {
  hasValidGuidedProjectHtml,
  isGuidedProjectSlug,
} from "@/lib/guided-project";
import { MAX_SEMANTIC_HTML_LENGTH } from "@/lib/semantic-html-workspace";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ projectSlug: string }>;
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
      { error: "Sign in to open your saved project." },
      { status: 401 },
    );
  }

  const { projectSlug } = await context.params;
  const project = await getGuidedProjectForStudent(userId, projectSlug);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function POST(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save this project." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn’t read that project. Try saving it again." },
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
  const action =
    typeof payload === "object" &&
    payload !== null &&
    "action" in payload &&
    (payload.action === "save" || payload.action === "submit")
      ? payload.action
      : null;

  if (!hasValidGuidedProjectHtml(html)) {
    return NextResponse.json(
      {
        error: `Keep the project between 1 and ${MAX_SEMANTIC_HTML_LENGTH.toLocaleString()} characters.`,
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

  const { projectSlug } = await context.params;

  if (!isGuidedProjectSlug(projectSlug)) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const project =
    action === "submit"
      ? await submitGuidedProjectForReview(userId, projectSlug, html)
      : await saveGuidedProjectDraft(userId, projectSlug, html);

  return NextResponse.json(project);
}
