import { and, eq, inArray } from "drizzle-orm";
import {
  buildJavaScriptLabActivity,
  buildJavaScriptLabCatalogProgress,
  getJavaScriptLab,
  isJavaScriptLabExercise,
  isJavaScriptCodeLabExercise,
  JAVASCRIPT_LABS,
} from "@/lib/javascript-lab-progress";
import type { SavedGuidedJavaScriptAttemptNote } from "@/lib/guided-javascript-attempt-notes";
import { getDatabase } from "./index";
import {
  codingLabExerciseDraft,
  codingLabExerciseNote,
  codingLabExerciseProgress,
} from "./schema";

export const MAX_JAVASCRIPT_LAB_DRAFT_LENGTH = 20_000;

export async function getJavaScriptLabExerciseAttemptNote(
  userId: string,
  labSlug: string,
  exerciseId: string,
): Promise<SavedGuidedJavaScriptAttemptNote | null> {
  if (!isJavaScriptCodeLabExercise(labSlug, exerciseId)) return null;

  const [note] = await getDatabase()
    .select({
      content: codingLabExerciseNote.content,
      updatedAt: codingLabExerciseNote.updatedAt,
    })
    .from(codingLabExerciseNote)
    .where(
      and(
        eq(codingLabExerciseNote.userId, userId),
        eq(codingLabExerciseNote.labSlug, labSlug),
        eq(codingLabExerciseNote.exerciseId, exerciseId),
      ),
    )
    .limit(1);

  return note
    ? { content: note.content, updatedAt: note.updatedAt.toISOString() }
    : null;
}

export async function saveJavaScriptLabExerciseAttemptNote(
  userId: string,
  labSlug: string,
  exerciseId: string,
  content: string,
): Promise<SavedGuidedJavaScriptAttemptNote | null> {
  if (!isJavaScriptCodeLabExercise(labSlug, exerciseId)) return null;

  const now = new Date();
  await getDatabase()
    .insert(codingLabExerciseNote)
    .values({
      id: crypto.randomUUID(),
      userId,
      labSlug,
      exerciseId,
      content,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        codingLabExerciseNote.userId,
        codingLabExerciseNote.labSlug,
        codingLabExerciseNote.exerciseId,
      ],
      set: { content, updatedAt: now },
    });

  return { content, updatedAt: now.toISOString() };
}

export async function getJavaScriptLabExerciseDrafts(
  userId: string,
  labSlug: string,
) {
  const lab = getJavaScriptLab(labSlug);
  if (!lab) return {};

  const rows = await getDatabase()
    .select({
      exerciseId: codingLabExerciseDraft.exerciseId,
      source: codingLabExerciseDraft.source,
    })
    .from(codingLabExerciseDraft)
    .where(
      and(
        eq(codingLabExerciseDraft.userId, userId),
        eq(codingLabExerciseDraft.labSlug, labSlug),
        inArray(codingLabExerciseDraft.exerciseId, [...lab.exerciseIds]),
      ),
    );

  return Object.fromEntries(rows.map((row) => [row.exerciseId, row.source]));
}

export async function saveJavaScriptLabExerciseDraft(
  userId: string,
  labSlug: string,
  exerciseId: string,
  source: string,
) {
  if (
    !isJavaScriptCodeLabExercise(labSlug, exerciseId) ||
    source.length > MAX_JAVASCRIPT_LAB_DRAFT_LENGTH
  ) {
    return null;
  }

  const now = new Date();
  await getDatabase()
    .insert(codingLabExerciseDraft)
    .values({
      id: crypto.randomUUID(),
      userId,
      labSlug,
      exerciseId,
      source,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        codingLabExerciseDraft.userId,
        codingLabExerciseDraft.labSlug,
        codingLabExerciseDraft.exerciseId,
      ],
      set: { source, updatedAt: now },
    });

  return { updatedAt: now.toISOString() };
}

export async function getCompletedJavaScriptLabExerciseIds(
  userId: string,
  labSlug: string,
) {
  const lab = getJavaScriptLab(labSlug);
  if (!lab) return [];

  const rows = await getDatabase()
    .select({ exerciseId: codingLabExerciseProgress.exerciseId })
    .from(codingLabExerciseProgress)
    .where(
      and(
        eq(codingLabExerciseProgress.userId, userId),
        eq(codingLabExerciseProgress.labSlug, labSlug),
        inArray(codingLabExerciseProgress.exerciseId, [...lab.exerciseIds]),
      ),
    );

  return rows.map((row) => row.exerciseId);
}

export async function getJavaScriptLabCatalogProgress(userId: string) {
  const rows = await getDatabase()
    .select({
      labSlug: codingLabExerciseProgress.labSlug,
      exerciseId: codingLabExerciseProgress.exerciseId,
    })
    .from(codingLabExerciseProgress)
    .where(
      and(
        eq(codingLabExerciseProgress.userId, userId),
        inArray(
          codingLabExerciseProgress.labSlug,
          JAVASCRIPT_LABS.map((lab) => lab.slug),
        ),
      ),
    );

  return buildJavaScriptLabCatalogProgress(rows);
}

export async function getJavaScriptLabActivityForStudent(userId: string) {
  const rows = await getDatabase()
    .select({
      labSlug: codingLabExerciseProgress.labSlug,
      exerciseId: codingLabExerciseProgress.exerciseId,
      completedAt: codingLabExerciseProgress.completedAt,
    })
    .from(codingLabExerciseProgress)
    .where(
      and(
        eq(codingLabExerciseProgress.userId, userId),
        inArray(
          codingLabExerciseProgress.labSlug,
          JAVASCRIPT_LABS.map((lab) => lab.slug),
        ),
      ),
    );

  return buildJavaScriptLabActivity(rows);
}

export async function saveJavaScriptLabExerciseCompletion(
  userId: string,
  labSlug: string,
  exerciseId: string,
) {
  if (!isJavaScriptLabExercise(labSlug, exerciseId)) return null;

  const now = new Date();
  await getDatabase()
    .insert(codingLabExerciseProgress)
    .values({
      id: crypto.randomUUID(),
      userId,
      labSlug,
      exerciseId,
      completedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        codingLabExerciseProgress.userId,
        codingLabExerciseProgress.labSlug,
        codingLabExerciseProgress.exerciseId,
      ],
      set: { updatedAt: now },
    });

  return { completedAt: now.toISOString() };
}
