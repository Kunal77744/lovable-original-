import { and, eq, inArray } from "drizzle-orm";
import {
  buildJavaScriptLabCatalogProgress,
  getJavaScriptLab,
  JAVASCRIPT_LABS,
} from "@/lib/javascript-lab-progress";
import { getDatabase } from "./index";
import { codingLabExerciseProgress } from "./schema";

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
