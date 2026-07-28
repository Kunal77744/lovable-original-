import { and, eq } from "drizzle-orm";
import {
  EMPTY_INTERVIEW_DRILL_PROGRESS,
  type InterviewDrillProgress,
  type InterviewSelfRating,
  JAVASCRIPT_INTERVIEW_DRILL,
} from "@/lib/interview-drill";
import { getDatabase } from "./index";
import { interviewDrillProgress } from "./schema";

type StoredAnswers = Record<string, string>;
type StoredRatings = Record<string, InterviewSelfRating>;

function parseRecord<T extends Record<string, string>>(
  value: string,
): T {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function serializeProgress(row: {
  answers: string;
  ratings: string;
  status: string;
  currentQuestion: number;
  startedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
}): InterviewDrillProgress {
  const answers = parseRecord<StoredAnswers>(row.answers);
  const ratings = parseRecord<StoredRatings>(row.ratings);

  return {
    status: row.status === "completed" ? "completed" : "in-progress",
    currentQuestion: row.currentQuestion,
    answers: JAVASCRIPT_INTERVIEW_DRILL.questions.flatMap((question) => {
      const answer = answers[question.slug];
      const rating = ratings[question.slug];

      return answer && rating
        ? [{ questionSlug: question.slug, answer, rating }]
        : [];
    }),
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getStoredProgress(userId: string, drillSlug: string) {
  const database = getDatabase();
  const [row] = await database
    .select({
      answers: interviewDrillProgress.answers,
      ratings: interviewDrillProgress.ratings,
      status: interviewDrillProgress.status,
      currentQuestion: interviewDrillProgress.currentQuestion,
      startedAt: interviewDrillProgress.startedAt,
      completedAt: interviewDrillProgress.completedAt,
      updatedAt: interviewDrillProgress.updatedAt,
    })
    .from(interviewDrillProgress)
    .where(
      and(
        eq(interviewDrillProgress.userId, userId),
        eq(interviewDrillProgress.drillSlug, drillSlug),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getInterviewDrillForStudent(
  userId: string,
  drillSlug: string,
) {
  if (drillSlug !== JAVASCRIPT_INTERVIEW_DRILL.slug) {
    return null;
  }

  const row = await getStoredProgress(userId, drillSlug);
  return row ? serializeProgress(row) : EMPTY_INTERVIEW_DRILL_PROGRESS;
}

export async function startInterviewDrill(
  userId: string,
  drillSlug: string,
) {
  if (drillSlug !== JAVASCRIPT_INTERVIEW_DRILL.slug) {
    return null;
  }

  const existing = await getStoredProgress(userId, drillSlug);

  if (existing) {
    return serializeProgress(existing);
  }

  const database = getDatabase();
  const now = new Date();
  const [created] = await database
    .insert(interviewDrillProgress)
    .values({
      id: crypto.randomUUID(),
      userId,
      drillSlug,
      startedAt: now,
      updatedAt: now,
    })
    .returning({
      answers: interviewDrillProgress.answers,
      ratings: interviewDrillProgress.ratings,
      status: interviewDrillProgress.status,
      currentQuestion: interviewDrillProgress.currentQuestion,
      startedAt: interviewDrillProgress.startedAt,
      completedAt: interviewDrillProgress.completedAt,
      updatedAt: interviewDrillProgress.updatedAt,
    });

  return serializeProgress(created);
}

export async function saveInterviewDrillAnswer(
  userId: string,
  drillSlug: string,
  questionSlug: string,
  answer: string,
  rating: InterviewSelfRating,
) {
  if (drillSlug !== JAVASCRIPT_INTERVIEW_DRILL.slug) {
    return null;
  }

  const existing = await getStoredProgress(userId, drillSlug);
  const answers = existing
    ? parseRecord<StoredAnswers>(existing.answers)
    : {};
  const ratings = existing
    ? parseRecord<StoredRatings>(existing.ratings)
    : {};
  answers[questionSlug] = answer;
  ratings[questionSlug] = rating;

  const firstUnanswered = JAVASCRIPT_INTERVIEW_DRILL.questions.findIndex(
    (question) => !answers[question.slug] || !ratings[question.slug],
  );
  const completed = firstUnanswered === -1;
  const currentQuestion = completed
    ? JAVASCRIPT_INTERVIEW_DRILL.questions.length - 1
    : firstUnanswered;
  const now = new Date();
  const database = getDatabase();

  await database
    .insert(interviewDrillProgress)
    .values({
      id: crypto.randomUUID(),
      userId,
      drillSlug,
      answers: JSON.stringify(answers),
      ratings: JSON.stringify(ratings),
      status: completed ? "completed" : "in-progress",
      currentQuestion,
      startedAt: existing?.startedAt ?? now,
      completedAt: completed ? (existing?.completedAt ?? now) : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        interviewDrillProgress.userId,
        interviewDrillProgress.drillSlug,
      ],
      set: {
        answers: JSON.stringify(answers),
        ratings: JSON.stringify(ratings),
        status: completed ? "completed" : "in-progress",
        currentQuestion,
        completedAt: completed ? (existing?.completedAt ?? now) : null,
        updatedAt: now,
      },
    });

  const saved = await getStoredProgress(userId, drillSlug);
  return saved ? serializeProgress(saved) : null;
}
