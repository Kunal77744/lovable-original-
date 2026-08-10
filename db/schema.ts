import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { GuidedProjectCheck } from "@/lib/guided-project";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_id_idx").on(table.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const rateLimit = pgTable(
  "rate_limit",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    count: integer("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
  },
  (table) => [uniqueIndex("rate_limit_key_unique").on(table.key)],
);

export const course = pgTable(
  "course",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull().default("topic-selection"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("course_slug_unique").on(table.slug)],
);

export const courseAssignment = pgTable(
  "course_assignment",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("course_assignment_user_course_unique").on(
      table.userId,
      table.courseId,
    ),
    index("course_assignment_user_id_idx").on(table.userId),
  ],
);

export const courseFeedback = pgTable(
  "course_feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    usefulness: text("usefulness").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("course_feedback_user_course_unique").on(
      table.userId,
      table.courseId,
    ),
    index("course_feedback_user_id_idx").on(table.userId),
  ],
);

export const learnerSetting = pgTable(
  "learner_setting",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    certificateDisplayName: text("certificate_display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("learner_setting_user_unique").on(table.userId)],
);

export const lesson = pgTable(
  "lesson",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    moduleTitle: text("module_title").notNull(),
    position: integer("position").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lesson_course_slug_unique").on(table.courseId, table.slug),
    uniqueIndex("lesson_course_position_unique").on(
      table.courseId,
      table.position,
    ),
    index("lesson_course_id_idx").on(table.courseId),
  ],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("in-progress"),
    quizScore: integer("quiz_score").notNull().default(0),
    furthestSection: integer("furthest_section").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lesson_progress_user_lesson_unique").on(
      table.userId,
      table.lessonId,
    ),
    index("lesson_progress_user_id_idx").on(table.userId),
  ],
);

export const lessonArtifact = pgTable(
  "lesson_artifact",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    html: text("html").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lesson_artifact_user_lesson_unique").on(
      table.userId,
      table.lessonId,
    ),
    index("lesson_artifact_user_id_idx").on(table.userId),
  ],
);

export const lessonNote = pgTable(
  "lesson_note",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lesson_note_user_lesson_unique").on(
      table.userId,
      table.lessonId,
    ),
    index("lesson_note_user_id_idx").on(table.userId),
  ],
);

export const guidedProject = pgTable(
  "guided_project",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectSlug: text("project_slug").notNull(),
    html: text("html").notNull(),
    reviewedHtml: text("reviewed_html"),
    status: text("status").notNull().default("draft"),
    reviewChecks: jsonb("review_checks").$type<GuidedProjectCheck[]>(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completionId: text("completion_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("guided_project_user_slug_unique").on(
      table.userId,
      table.projectSlug,
    ),
    index("guided_project_user_id_idx").on(table.userId),
  ],
);

export const guidedProjectFeedback = pgTable(
  "guided_project_feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectSlug: text("project_slug").notNull(),
    confidence: text("confidence").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("guided_project_feedback_user_slug_unique").on(
      table.userId,
      table.projectSlug,
    ),
    index("guided_project_feedback_user_id_idx").on(table.userId),
  ],
);

export const interviewDrillProgress = pgTable(
  "interview_drill_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    drillSlug: text("drill_slug").notNull(),
    answers: text("answers").notNull().default("{}"),
    ratings: text("ratings").notNull().default("{}"),
    status: text("status").notNull().default("in-progress"),
    currentQuestion: integer("current_question").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("interview_drill_user_slug_unique").on(
      table.userId,
      table.drillSlug,
    ),
    index("interview_drill_user_id_idx").on(table.userId),
  ],
);

export const earlyAccessSignup = pgTable(
  "early_access_signup",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    courseSlug: text("course_slug").notNull().default("first-course"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("early_access_signup_email_course_unique").on(
      table.email,
      table.courseSlug,
    ),
  ],
);

export const codingProblemProgress = pgTable(
  "coding_problem_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemSlug: text("problem_slug").notNull(),
    code: text("code").notNull(),
    bestVerdict: text("best_verdict"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("coding_problem_progress_user_problem_unique").on(
      table.userId,
      table.problemSlug,
    ),
    index("coding_problem_progress_user_id_idx").on(table.userId),
  ],
);

export const codingSubmission = pgTable(
  "coding_submission",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemSlug: text("problem_slug").notNull(),
    code: text("code"),
    verdict: text("verdict").notNull(),
    passedTests: integer("passed_tests").notNull(),
    totalTests: integer("total_tests").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("coding_submission_user_problem_idx").on(
      table.userId,
      table.problemSlug,
    ),
    index("coding_submission_user_id_idx").on(table.userId),
  ],
);

export const codingPracticeGoal = pgTable(
  "coding_practice_goal",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetActiveDays: integer("target_active_days").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("coding_practice_goal_user_unique").on(table.userId),
    index("coding_practice_goal_user_id_idx").on(table.userId),
  ],
);

export const dailyCodingChallengeCompletion = pgTable(
  "daily_coding_challenge_completion",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    challengeDate: text("challenge_date").notNull(),
    problemSlug: text("problem_slug").notNull(),
    submissionId: text("submission_id")
      .notNull()
      .references(() => codingSubmission.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("daily_coding_challenge_user_date_unique").on(
      table.userId,
      table.challengeDate,
    ),
    index("daily_coding_challenge_user_id_idx").on(table.userId),
  ],
);

export const timedCodingChallengeResult = pgTable(
  "timed_coding_challenge_result",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    challengeSetId: text("challenge_set_id").notNull(),
    solvedCount: integer("solved_count").notNull(),
    elapsedSeconds: integer("elapsed_seconds").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("timed_coding_challenge_result_user_completed_idx").on(
      table.userId,
      table.completedAt,
    ),
    check(
      "timed_coding_challenge_result_solved_count_check",
      sql`${table.solvedCount} between 0 and 3`,
    ),
    check(
      "timed_coding_challenge_result_elapsed_seconds_check",
      sql`${table.elapsedSeconds} between 0 and 1800`,
    ),
  ],
);

export const codingProblemBookmark = pgTable(
  "coding_problem_bookmark",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemSlug: text("problem_slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("coding_problem_bookmark_user_problem_unique").on(
      table.userId,
      table.problemSlug,
    ),
    index("coding_problem_bookmark_user_id_idx").on(table.userId),
  ],
);

export const codingProblemNote = pgTable(
  "coding_problem_note",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemSlug: text("problem_slug").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("coding_problem_note_user_problem_unique").on(
      table.userId,
      table.problemSlug,
    ),
    index("coding_problem_note_user_id_idx").on(table.userId),
  ],
);

export const codingProblemTestCaseSet = pgTable(
  "coding_problem_test_case_set",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemSlug: text("problem_slug").notNull(),
    inputs: jsonb("inputs").$type<string[]>().notNull(),
    expectedOutputs: jsonb("expected_outputs")
      .$type<(string | null)[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("coding_problem_test_case_set_user_problem_unique").on(
      table.userId,
      table.problemSlug,
    ),
    index("coding_problem_test_case_set_user_id_idx").on(table.userId),
  ],
);

export const cssPracticeProgress = pgTable(
  "css_practice_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    challengeSlug: text("challenge_slug").notNull(),
    css: text("css").notNull(),
    bestVerdict: text("best_verdict"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("css_practice_progress_user_challenge_unique").on(
      table.userId,
      table.challengeSlug,
    ),
    index("css_practice_progress_user_id_idx").on(table.userId),
  ],
);

export const cssPracticeAttempt = pgTable(
  "css_practice_attempt",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    challengeSlug: text("challenge_slug").notNull(),
    verdict: text("verdict").notNull(),
    passedChecks: integer("passed_checks").notNull(),
    totalChecks: integer("total_checks").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("css_practice_attempt_user_challenge_idx").on(
      table.userId,
      table.challengeSlug,
    ),
    index("css_practice_attempt_user_id_idx").on(table.userId),
  ],
);

export const cssPracticeFeedback = pgTable(
  "css_practice_feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pathSlug: text("path_slug").notNull(),
    usefulness: text("usefulness").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("css_practice_feedback_user_path_unique").on(
      table.userId,
      table.pathSlug,
    ),
    index("css_practice_feedback_user_id_idx").on(table.userId),
  ],
);

export const practiceFeedback = pgTable(
  "practice_feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemSlug: text("problem_slug").notNull(),
    usefulness: text("usefulness").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("practice_feedback_user_unique").on(table.userId),
    index("practice_feedback_user_id_idx").on(table.userId),
  ],
);

export const codingLabExerciseProgress = pgTable(
  "coding_lab_exercise_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    labSlug: text("lab_slug").notNull(),
    exerciseId: text("exercise_id").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("coding_lab_progress_user_lab_exercise_unique").on(
      table.userId,
      table.labSlug,
      table.exerciseId,
    ),
    index("coding_lab_progress_user_id_idx").on(table.userId),
  ],
);

export const javascriptReadinessResult = pgTable(
  "javascript_readiness_result",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    correctCount: integer("correct_count").notNull(),
    totalCount: integer("total_count").notNull(),
    recommendedLabSlug: text("recommended_lab_slug").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("javascript_readiness_result_user_unique").on(table.userId),
    index("javascript_readiness_result_user_id_idx").on(table.userId),
  ],
);

export const javascriptMixedReviewResult = pgTable(
  "javascript_mixed_review_result",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    correctCount: integer("correct_count").notNull(),
    totalCount: integer("total_count").notNull(),
    nextDueAt: timestamp("next_due_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("javascript_mixed_review_result_user_unique").on(table.userId),
    index("javascript_mixed_review_result_user_id_idx").on(table.userId),
  ],
);

export const webFoundationsReviewResult = pgTable(
  "web_foundations_review_result",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    correctCount: integer("correct_count").notNull(),
    totalCount: integer("total_count").notNull(),
    nextDueAt: timestamp("next_due_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("web_foundations_review_result_user_unique").on(table.userId),
    index("web_foundations_review_result_user_id_idx").on(table.userId),
  ],
);

export const courseCertificate = pgTable(
  "course_certificate",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("course_certificate_user_course_unique").on(
      table.userId,
      table.courseId,
    ),
    index("course_certificate_user_id_idx").on(table.userId),
  ],
);

export const playgroundFile = pgTable(
  "playground_file",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    quickChecks: text("quick_checks").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("playground_file_user_unique").on(table.userId),
    index("playground_file_user_id_idx").on(table.userId),
  ],
);
