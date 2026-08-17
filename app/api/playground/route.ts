import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  activatePlaygroundFile,
  createPlaygroundFile,
  deletePlaygroundFile,
  getPlaygroundWorkspace,
  PlaygroundWorkspaceError,
  renamePlaygroundFile,
  savePlaygroundFile,
} from "@/db/javascript-playground";
import { auth } from "@/lib/auth";
import {
  validatePlaygroundFile,
  validatePlaygroundFileId,
  validatePlaygroundFileName,
} from "@/lib/javascript-playground";

async function getSessionUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user.id ?? null;
}

async function readPayload(request: Request) {
  try {
    return { valid: true as const, payload: (await request.json()) as unknown };
  } catch {
    return {
      valid: false as const,
      response: NextResponse.json(
        { error: "We couldn’t read that file request. Try again." },
        { status: 400 },
      ),
    };
  }
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function workspaceErrorResponse(error: unknown) {
  if (error instanceof PlaygroundWorkspaceError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "file_missing" ? 404 : 409 },
    );
  }

  if (isUniqueViolation(error)) {
    return NextResponse.json(
      { error: "That filename is already in your private workspace." },
      { status: 409 },
    );
  }

  throw error;
}

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to open your saved playground." },
      { status: 401 },
    );
  }

  return NextResponse.json({ workspace: await getPlaygroundWorkspace(userId) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save a private JavaScript file." },
      { status: 401 },
    );
  }

  const readResult = await readPayload(request);
  if (!readResult.valid) return readResult.response;

  const result = validatePlaygroundFile(readResult.payload);

  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    const file = await savePlaygroundFile(
      userId,
      result.fileId,
      result.code,
      result.quickChecks,
    );
    return NextResponse.json({ file });
  } catch (error) {
    return workspaceErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to manage private JavaScript files." },
      { status: 401 },
    );
  }

  const readResult = await readPayload(request);
  if (!readResult.valid) return readResult.response;
  const payload = readResult.payload;
  const action =
    typeof payload === "object" &&
    payload !== null &&
    "action" in payload &&
    typeof payload.action === "string"
      ? payload.action
      : "";

  try {
    if (action === "create") {
      const nameResult = validatePlaygroundFileName(payload);
      if (!nameResult.valid) {
        return NextResponse.json(
          { error: nameResult.error },
          { status: 400 },
        );
      }

      return NextResponse.json({
        file: await createPlaygroundFile(userId, nameResult.name),
      });
    }

    const fileIdResult = validatePlaygroundFileId(payload);
    if (!fileIdResult.valid) {
      return NextResponse.json(
        { error: fileIdResult.error },
        { status: 400 },
      );
    }

    if (action === "activate") {
      return NextResponse.json({
        file: await activatePlaygroundFile(userId, fileIdResult.fileId),
      });
    }

    if (action === "rename") {
      const nameResult = validatePlaygroundFileName(payload);
      if (!nameResult.valid) {
        return NextResponse.json(
          { error: nameResult.error },
          { status: 400 },
        );
      }

      return NextResponse.json({
        file: await renamePlaygroundFile(
          userId,
          fileIdResult.fileId,
          nameResult.name,
        ),
      });
    }

    return NextResponse.json(
      { error: "Choose create, switch, or rename and try again." },
      { status: 400 },
    );
  } catch (error) {
    return workspaceErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to delete a private JavaScript file." },
      { status: 401 },
    );
  }

  const readResult = await readPayload(request);
  if (!readResult.valid) return readResult.response;
  const fileIdResult = validatePlaygroundFileId(readResult.payload);

  if (!fileIdResult.valid) {
    return NextResponse.json(
      { error: fileIdResult.error },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await deletePlaygroundFile(userId, fileIdResult.fileId),
    );
  } catch (error) {
    return workspaceErrorResponse(error);
  }
}
