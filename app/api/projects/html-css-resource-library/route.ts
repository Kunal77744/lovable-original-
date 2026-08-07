import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getCssPracticeCatalogProgress } from "@/db/css-practice";
import {
  getHtmlCssCapstoneForStudent,
  saveHtmlCssCapstoneDraft,
  submitHtmlCssCapstone,
} from "@/db/html-css-capstone";
import { auth } from "@/lib/auth";
import {
  hasValidHtmlCssCapstoneSource,
  MAX_HTML_CSS_CAPSTONE_CSS_LENGTH,
  MAX_HTML_CSS_CAPSTONE_HTML_LENGTH,
} from "@/lib/html-css-capstone";

async function getEligibleUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { userId: null, eligible: false };
  const progress = await getCssPracticeCatalogProgress(session.user.id);
  return {
    userId: session.user.id,
    eligible: progress.completedCount === progress.totalCount,
  };
}

export async function GET() {
  const { userId, eligible } = await getEligibleUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to restore your saved HTML and CSS project." },
      { status: 401 },
    );
  }
  if (!eligible) {
    return NextResponse.json(
      { error: "Complete all six CSS challenges before opening this capstone." },
      { status: 403 },
    );
  }
  return NextResponse.json(await getHtmlCssCapstoneForStudent(userId));
}

export async function POST(request: Request) {
  const { userId, eligible } = await getEligibleUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save and review this project." },
      { status: 401 },
    );
  }
  if (!eligible) {
    return NextResponse.json(
      { error: "Complete all six CSS challenges before saving this capstone." },
      { status: 403 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "We couldn’t read that project. Try again." }, { status: 400 });
  }

  const html =
    typeof payload === "object" && payload !== null && "html" in payload && typeof payload.html === "string"
      ? payload.html
      : "";
  const css =
    typeof payload === "object" && payload !== null && "css" in payload && typeof payload.css === "string"
      ? payload.css
      : "";
  const action =
    typeof payload === "object" && payload !== null && "action" in payload &&
    (payload.action === "save" || payload.action === "submit")
      ? payload.action
      : null;

  if (!hasValidHtmlCssCapstoneSource(html, css)) {
    return NextResponse.json(
      {
        error: `Keep HTML between 1 and ${MAX_HTML_CSS_CAPSTONE_HTML_LENGTH.toLocaleString()} characters and CSS between 1 and ${MAX_HTML_CSS_CAPSTONE_CSS_LENGTH.toLocaleString()}.`,
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
    const project = await saveHtmlCssCapstoneDraft(userId, html, css);
    return project
      ? NextResponse.json(project)
      : NextResponse.json({ error: "The project could not be saved." }, { status: 500 });
  }

  const result = await submitHtmlCssCapstone(userId, html, css);
  return result
    ? NextResponse.json({
        ...result.project,
        firstCompletedReview: result.completedForFirstTime,
      })
    : NextResponse.json({ error: "The review could not be saved." }, { status: 500 });
}
