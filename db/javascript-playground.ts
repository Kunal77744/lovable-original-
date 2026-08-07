import { eq } from "drizzle-orm";
import { PLAYGROUND_STARTER_CODE } from "@/lib/javascript-playground";
import { getDatabase } from "./index";
import { playgroundFile } from "./schema";

export async function getPlaygroundFile(userId: string) {
  const [file] = await getDatabase()
    .select({
      code: playgroundFile.code,
      quickChecks: playgroundFile.quickChecks,
      updatedAt: playgroundFile.updatedAt,
    })
    .from(playgroundFile)
    .where(eq(playgroundFile.userId, userId))
    .limit(1);

  return {
    code: file?.code ?? PLAYGROUND_STARTER_CODE,
    quickChecks: file?.quickChecks ?? "",
    updatedAt: file?.updatedAt.toISOString() ?? null,
  };
}

export async function savePlaygroundFile(
  userId: string,
  code: string,
  quickChecks: string,
) {
  const now = new Date();
  const [file] = await getDatabase()
    .insert(playgroundFile)
    .values({
      id: crypto.randomUUID(),
      userId,
      code,
      quickChecks,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: playgroundFile.userId,
      set: {
        code,
        quickChecks,
        updatedAt: now,
      },
    })
    .returning({
      code: playgroundFile.code,
      quickChecks: playgroundFile.quickChecks,
      updatedAt: playgroundFile.updatedAt,
    });

  return {
    code: file.code,
    quickChecks: file.quickChecks,
    updatedAt: file.updatedAt.toISOString(),
  };
}
