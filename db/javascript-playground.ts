import { and, asc, eq } from "drizzle-orm";
import {
  MAX_PLAYGROUND_FILES,
  PLAYGROUND_STARTER_CODE,
} from "@/lib/javascript-playground";
import { getDatabase } from "./index";
import { playgroundFile } from "./schema";

export type PlaygroundWorkspaceFile = {
  id: string | null;
  name: string;
  code: string;
  quickChecks: string;
  updatedAt: string | null;
  isActive: boolean;
};

export class PlaygroundWorkspaceError extends Error {
  constructor(
    public readonly code: "file_limit" | "file_missing" | "last_file",
    message: string,
  ) {
    super(message);
  }
}

function serializeFile(file: typeof playgroundFile.$inferSelect): PlaygroundWorkspaceFile {
  return {
    id: file.id,
    name: file.name,
    code: file.code,
    quickChecks: file.quickChecks,
    updatedAt: file.updatedAt.toISOString(),
    isActive: file.isActive,
  };
}

export async function getPlaygroundWorkspace(userId: string) {
  const files = await getDatabase()
    .select()
    .from(playgroundFile)
    .where(eq(playgroundFile.userId, userId))
    .orderBy(asc(playgroundFile.slot));

  if (files.length === 0) {
    return {
      files: [
        {
          id: null,
          name: "playground.js",
          code: PLAYGROUND_STARTER_CODE,
          quickChecks: "",
          updatedAt: null,
          isActive: true,
        },
      ] satisfies PlaygroundWorkspaceFile[],
      activeFileId: null,
    };
  }

  const serializedFiles = files.map(serializeFile);
  const activeFile = serializedFiles.find((file) => file.isActive) ?? serializedFiles[0];

  return {
    files: serializedFiles,
    activeFileId: activeFile.id,
  };
}

export async function savePlaygroundFile(
  userId: string,
  fileId: string | null,
  code: string,
  quickChecks: string,
) {
  const now = new Date();

  if (!fileId) {
    const [file] = await getDatabase()
      .insert(playgroundFile)
      .values({
        id: crypto.randomUUID(),
        userId,
        name: "playground.js",
        slot: 1,
        isActive: true,
        code,
        quickChecks,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [playgroundFile.userId, playgroundFile.slot],
        set: { code, quickChecks, updatedAt: now },
      })
      .returning();

    return serializeFile(file);
  }

  const [file] = await getDatabase()
    .update(playgroundFile)
    .set({ code, quickChecks, updatedAt: now })
    .where(and(eq(playgroundFile.id, fileId), eq(playgroundFile.userId, userId)))
    .returning();

  if (!file) {
    throw new PlaygroundWorkspaceError(
      "file_missing",
      "That private file is no longer available.",
    );
  }

  return serializeFile(file);
}

export async function createPlaygroundFile(userId: string, name: string) {
  return getDatabase().transaction(async (transaction) => {
    const existingFiles = await transaction
      .select({ slot: playgroundFile.slot })
      .from(playgroundFile)
      .where(eq(playgroundFile.userId, userId))
      .orderBy(asc(playgroundFile.slot));

    if (existingFiles.length >= MAX_PLAYGROUND_FILES) {
      throw new PlaygroundWorkspaceError(
        "file_limit",
        `Keep up to ${MAX_PLAYGROUND_FILES} private JavaScript files.`,
      );
    }

    const usedSlots = new Set(existingFiles.map((file) => file.slot));
    const slot = Array.from(
      { length: MAX_PLAYGROUND_FILES },
      (_, index) => index + 1,
    ).find((candidate) => !usedSlots.has(candidate));

    if (!slot) {
      throw new PlaygroundWorkspaceError(
        "file_limit",
        `Keep up to ${MAX_PLAYGROUND_FILES} private JavaScript files.`,
      );
    }

    await transaction
      .update(playgroundFile)
      .set({ isActive: false })
      .where(eq(playgroundFile.userId, userId));

    const [file] = await transaction
      .insert(playgroundFile)
      .values({
        id: crypto.randomUUID(),
        userId,
        name,
        slot,
        isActive: true,
        code: PLAYGROUND_STARTER_CODE,
        quickChecks: "",
      })
      .returning();

    return serializeFile(file);
  });
}

export async function activatePlaygroundFile(userId: string, fileId: string) {
  return getDatabase().transaction(async (transaction) => {
    const [ownedFile] = await transaction
      .select({ id: playgroundFile.id })
      .from(playgroundFile)
      .where(and(eq(playgroundFile.id, fileId), eq(playgroundFile.userId, userId)))
      .limit(1);

    if (!ownedFile) {
      throw new PlaygroundWorkspaceError(
        "file_missing",
        "That private file is no longer available.",
      );
    }

    await transaction
      .update(playgroundFile)
      .set({ isActive: false })
      .where(eq(playgroundFile.userId, userId));

    const [file] = await transaction
      .update(playgroundFile)
      .set({ isActive: true })
      .where(and(eq(playgroundFile.id, fileId), eq(playgroundFile.userId, userId)))
      .returning();

    return serializeFile(file);
  });
}

export async function renamePlaygroundFile(
  userId: string,
  fileId: string,
  name: string,
) {
  const [file] = await getDatabase()
    .update(playgroundFile)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(playgroundFile.id, fileId), eq(playgroundFile.userId, userId)))
    .returning();

  if (!file) {
    throw new PlaygroundWorkspaceError(
      "file_missing",
      "That private file is no longer available.",
    );
  }

  return serializeFile(file);
}

export async function deletePlaygroundFile(userId: string, fileId: string) {
  return getDatabase().transaction(async (transaction) => {
    const files = await transaction
      .select()
      .from(playgroundFile)
      .where(eq(playgroundFile.userId, userId))
      .orderBy(asc(playgroundFile.slot));
    const target = files.find((file) => file.id === fileId);

    if (!target) {
      throw new PlaygroundWorkspaceError(
        "file_missing",
        "That private file is no longer available.",
      );
    }

    if (files.length === 1) {
      throw new PlaygroundWorkspaceError(
        "last_file",
        "Keep at least one private JavaScript file.",
      );
    }

    await transaction
      .delete(playgroundFile)
      .where(and(eq(playgroundFile.id, fileId), eq(playgroundFile.userId, userId)));

    let activeFile = files.find((file) => file.isActive && file.id !== fileId);

    if (!activeFile) {
      const nextFile = files.find((file) => file.id !== fileId)!;
      [activeFile] = await transaction
        .update(playgroundFile)
        .set({ isActive: true })
        .where(
          and(
            eq(playgroundFile.id, nextFile.id),
            eq(playgroundFile.userId, userId),
          ),
        )
        .returning();
    }

    return {
      deletedFileId: fileId,
      activeFile: serializeFile(activeFile),
    };
  });
}
