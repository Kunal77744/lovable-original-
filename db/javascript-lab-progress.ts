import { and, eq, inArray } from "drizzle-orm";
import {
  getJavaScriptLab,
  isJavaScriptLabExercise,
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

  const completedKeys = new Set(
    rows
      .filter((row) => isJavaScriptLabExercise(row.labSlug, row.exerciseId))
      .map((row) => `${row.labSlug}:${row.exerciseId}`),
  );
  const totalCount = JAVASCRIPT_LABS.reduce(
    (count, lab) => count + lab.exerciseIds.length,
    0,
  );
  const nextLab = JAVASCRIPT_LABS.find((lab) =>
    lab.exerciseIds.some(
      (exerciseId) => !completedKeys.has(`${lab.slug}:${exerciseId}`),
    ),
  );
  const nextExerciseIndex = nextLab
    ? nextLab.exerciseIds.findIndex(
        (exerciseId) => !completedKeys.has(`${nextLab.slug}:${exerciseId}`),
      )
    : -1;

  return {
    completedCount: completedKeys.size,
    totalCount,
    nextLabSlug: nextLab?.slug ?? null,
    nextLabTitle: nextLab?.title ?? null,
    nextHref: nextLab?.href ?? "/practice/foundations",
    nextExerciseNumber: nextExerciseIndex === -1 ? null : nextExerciseIndex + 1,
  };
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
