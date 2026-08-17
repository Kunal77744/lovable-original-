import { asc, eq } from "drizzle-orm";
import { getDatabase } from "./index";
import {
  codingLabExerciseDraft,
  codingLabExerciseProgress,
  codingPracticeGoal,
  codingProblemBookmark,
  codingProblemNote,
  codingProblemProgress,
  codingProblemTestCaseSet,
  codingSubmission,
  courseAssignment,
  courseCertificate,
  courseFeedback,
  cssPracticeAttempt,
  cssPracticeFeedback,
  cssPracticeProgress,
  dailyCodingChallengeCompletion,
  guidedProject,
  guidedProjectFeedback,
  interviewDrillProgress,
  javascriptMixedReviewResult,
  javascriptReadinessResult,
  learnerSetting,
  lessonArtifact,
  lessonNote,
  lessonProgress,
  lessonQuizAttempt,
  playgroundFile,
  practiceFeedback,
  projectReviewAttempt,
  timedCodingChallengeResult,
  user,
  webFoundationsReviewResult,
} from "./schema";

function withoutAccountScope<T extends Record<string, unknown>>(rows: T[]) {
  return rows.map((row) => {
    const learnerRow: Record<string, unknown> = { ...row };
    delete learnerRow.userId;
    return learnerRow;
  });
}

export async function getLearningDataExportForStudent(userId: string) {
  const database = getDatabase();
  const [
    accountRows,
    settings,
    courseAssignments,
    courseFeedbackRows,
    courseQuizAttempts,
    lessonProgressRows,
    lessonArtifacts,
    lessonNotes,
    certificates,
    webFoundationsReviews,
    projects,
    projectReviewAttempts,
    projectFeedback,
    interviewProgress,
    problemProgress,
    submissions,
    practiceGoals,
    dailyChallenges,
    timedChallengeResults,
    bookmarks,
    problemNotes,
    privateTestCases,
    practiceFeedbackRows,
    guidedExerciseProgress,
    guidedExerciseDrafts,
    readinessResults,
    mixedReviewResults,
    cssProgress,
    cssAttempts,
    cssFeedback,
    playgroundFiles,
  ] = await Promise.all([
    database
      .select({
        displayName: user.name,
        email: user.email,
        joinedAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId)),
    database.select().from(learnerSetting).where(eq(learnerSetting.userId, userId)),
    database.select().from(courseAssignment).where(eq(courseAssignment.userId, userId)),
    database.select().from(courseFeedback).where(eq(courseFeedback.userId, userId)),
    database
      .select()
      .from(lessonQuizAttempt)
      .where(eq(lessonQuizAttempt.userId, userId))
      .orderBy(asc(lessonQuizAttempt.createdAt)),
    database.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    database.select().from(lessonArtifact).where(eq(lessonArtifact.userId, userId)),
    database.select().from(lessonNote).where(eq(lessonNote.userId, userId)),
    database.select().from(courseCertificate).where(eq(courseCertificate.userId, userId)),
    database
      .select()
      .from(webFoundationsReviewResult)
      .where(eq(webFoundationsReviewResult.userId, userId)),
    database.select().from(guidedProject).where(eq(guidedProject.userId, userId)),
    database
      .select()
      .from(projectReviewAttempt)
      .where(eq(projectReviewAttempt.userId, userId))
      .orderBy(asc(projectReviewAttempt.createdAt)),
    database
      .select()
      .from(guidedProjectFeedback)
      .where(eq(guidedProjectFeedback.userId, userId)),
    database
      .select()
      .from(interviewDrillProgress)
      .where(eq(interviewDrillProgress.userId, userId)),
    database
      .select()
      .from(codingProblemProgress)
      .where(eq(codingProblemProgress.userId, userId)),
    database
      .select()
      .from(codingSubmission)
      .where(eq(codingSubmission.userId, userId))
      .orderBy(asc(codingSubmission.createdAt)),
    database
      .select()
      .from(codingPracticeGoal)
      .where(eq(codingPracticeGoal.userId, userId)),
    database
      .select()
      .from(dailyCodingChallengeCompletion)
      .where(eq(dailyCodingChallengeCompletion.userId, userId))
      .orderBy(asc(dailyCodingChallengeCompletion.completedAt)),
    database
      .select()
      .from(timedCodingChallengeResult)
      .where(eq(timedCodingChallengeResult.userId, userId))
      .orderBy(asc(timedCodingChallengeResult.completedAt)),
    database
      .select()
      .from(codingProblemBookmark)
      .where(eq(codingProblemBookmark.userId, userId)),
    database
      .select()
      .from(codingProblemNote)
      .where(eq(codingProblemNote.userId, userId)),
    database
      .select()
      .from(codingProblemTestCaseSet)
      .where(eq(codingProblemTestCaseSet.userId, userId)),
    database
      .select()
      .from(practiceFeedback)
      .where(eq(practiceFeedback.userId, userId)),
    database
      .select()
      .from(codingLabExerciseProgress)
      .where(eq(codingLabExerciseProgress.userId, userId)),
    database
      .select()
      .from(codingLabExerciseDraft)
      .where(eq(codingLabExerciseDraft.userId, userId)),
    database
      .select()
      .from(javascriptReadinessResult)
      .where(eq(javascriptReadinessResult.userId, userId)),
    database
      .select()
      .from(javascriptMixedReviewResult)
      .where(eq(javascriptMixedReviewResult.userId, userId)),
    database
      .select()
      .from(cssPracticeProgress)
      .where(eq(cssPracticeProgress.userId, userId)),
    database
      .select()
      .from(cssPracticeAttempt)
      .where(eq(cssPracticeAttempt.userId, userId))
      .orderBy(asc(cssPracticeAttempt.createdAt)),
    database
      .select()
      .from(cssPracticeFeedback)
      .where(eq(cssPracticeFeedback.userId, userId)),
    database.select().from(playgroundFile).where(eq(playgroundFile.userId, userId)),
  ]);

  return {
    schemaVersion: 1,
    account: accountRows[0] ?? null,
    settings: withoutAccountScope(settings),
    courses: {
      assignments: withoutAccountScope(courseAssignments),
      feedback: withoutAccountScope(courseFeedbackRows),
      quizAttempts: withoutAccountScope(courseQuizAttempts),
      lessonProgress: withoutAccountScope(lessonProgressRows),
      lessonWorkspaces: withoutAccountScope(lessonArtifacts),
      lessonNotes: withoutAccountScope(lessonNotes),
      certificates: withoutAccountScope(certificates),
      spacedReviews: withoutAccountScope(webFoundationsReviews),
    },
    projects: {
      work: withoutAccountScope(projects),
      reviewAttempts: withoutAccountScope(projectReviewAttempts),
      feedback: withoutAccountScope(projectFeedback),
    },
    interviewPractice: withoutAccountScope(interviewProgress),
    javascript: {
      problemProgress: withoutAccountScope(problemProgress),
      submissions: withoutAccountScope(submissions),
      practiceGoals: withoutAccountScope(practiceGoals),
      dailyChallenges: withoutAccountScope(dailyChallenges),
      timedChallengeResults: withoutAccountScope(timedChallengeResults),
      bookmarks: withoutAccountScope(bookmarks),
      problemJournals: withoutAccountScope(problemNotes),
      privateTestCases: withoutAccountScope(privateTestCases),
      feedback: withoutAccountScope(practiceFeedbackRows),
      guidedExerciseProgress: withoutAccountScope(guidedExerciseProgress),
      guidedExerciseDrafts: withoutAccountScope(guidedExerciseDrafts),
      readinessResults: withoutAccountScope(readinessResults),
      mixedReviews: withoutAccountScope(mixedReviewResults),
    },
    css: {
      progress: withoutAccountScope(cssProgress),
      attempts: withoutAccountScope(cssAttempts),
      feedback: withoutAccountScope(cssFeedback),
    },
    playground: withoutAccountScope(playgroundFiles),
  };
}
