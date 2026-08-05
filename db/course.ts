import { and, asc, eq } from "drizzle-orm";
import {
  FIRST_COURSE,
  FIRST_COURSE_LESSONS,
} from "@/lib/first-course-content";
import { getDefaultCertificateDisplayName } from "@/lib/learner-settings";
import { buildCourseProgress } from "@/lib/course-progress";
import { getDatabase } from "./index";
import {
  course,
  courseAssignment,
  courseCertificate,
  courseFeedback,
  learnerSetting,
  lesson,
  lessonArtifact,
  lessonNote,
  lessonProgress,
} from "./schema";
import {
  gradeSemanticHtml,
  SEMANTIC_HTML_STARTER,
} from "@/lib/semantic-html-workspace";
import {
  CSS_BOX_MODEL_STARTER,
  gradeCssBoxModel,
} from "@/lib/css-box-model-practice";

async function ensureFirstCourse() {
  const database = getDatabase();

  await database
    .insert(course)
    .values(FIRST_COURSE)
    .onConflictDoUpdate({
      target: course.id,
      set: {
        title: FIRST_COURSE.title,
        description: FIRST_COURSE.description,
        status: FIRST_COURSE.status,
        updatedAt: new Date(),
      },
    });

  for (const courseLesson of FIRST_COURSE_LESSONS) {
    await database
      .insert(lesson)
      .values({
        ...courseLesson,
        courseId: FIRST_COURSE.id,
      })
      .onConflictDoUpdate({
        target: lesson.id,
        set: {
          title: courseLesson.title,
          description: courseLesson.description,
          moduleTitle: courseLesson.moduleTitle,
          position: courseLesson.position,
          estimatedMinutes: courseLesson.estimatedMinutes,
          updatedAt: new Date(),
        },
      });
  }
}

async function ensureFirstCourseAssignment(userId: string) {
  const database = getDatabase();
  await ensureFirstCourse();

  await database
    .insert(courseAssignment)
    .values({
      id: crypto.randomUUID(),
      userId,
      courseId: FIRST_COURSE.id,
    })
    .onConflictDoNothing();
}

export async function getOrCreateFirstCourseAssignment(userId: string) {
  const database = getDatabase();
  await ensureFirstCourseAssignment(userId);

  const assignmentRows = await database
    .select({
      slug: course.slug,
      title: course.title,
      description: course.description,
      status: course.status,
      lessonId: lesson.id,
      lessonSlug: lesson.slug,
      lessonTitle: lesson.title,
      lessonDescription: lesson.description,
      lessonModuleTitle: lesson.moduleTitle,
      lessonPosition: lesson.position,
      estimatedMinutes: lesson.estimatedMinutes,
      progressStatus: lessonProgress.status,
      quizScore: lessonProgress.quizScore,
    })
    .from(courseAssignment)
    .innerJoin(course, eq(courseAssignment.courseId, course.id))
    .innerJoin(lesson, eq(lesson.courseId, course.id))
    .leftJoin(
      lessonProgress,
      and(
        eq(lessonProgress.lessonId, lesson.id),
        eq(lessonProgress.userId, userId),
      ),
    )
    .where(
      and(
        eq(courseAssignment.userId, userId),
        eq(courseAssignment.courseId, FIRST_COURSE.id),
      ),
    )
    .orderBy(asc(lesson.position));

  const assignment = assignmentRows[0];

  if (!assignment) {
    throw new Error("The first course could not be assigned.");
  }

  const progress = buildCourseProgress(
    assignmentRows.map((row) => ({
      id: row.lessonId,
      slug: row.lessonSlug,
      title: row.lessonTitle,
      description: row.lessonDescription,
      moduleTitle: row.lessonModuleTitle,
      position: row.lessonPosition,
      estimatedMinutes: row.estimatedMinutes,
      progressStatus: row.progressStatus,
      quizScore: row.quizScore,
    })),
  );

  return {
    slug: assignment.slug,
    title: assignment.title,
    description: assignment.description,
    status: assignment.status,
    ...progress,
  };
}

export async function getFirstCourseLessonForStudent(
  userId: string,
  courseSlug: string,
  lessonSlug: string,
) {
  const database = getDatabase();
  await ensureFirstCourseAssignment(userId);

  const courseRows = await database
    .select({
      courseSlug: course.slug,
      courseTitle: course.title,
      lessonId: lesson.id,
      lessonSlug: lesson.slug,
      lessonTitle: lesson.title,
      lessonDescription: lesson.description,
      moduleTitle: lesson.moduleTitle,
      position: lesson.position,
      estimatedMinutes: lesson.estimatedMinutes,
      progressStatus: lessonProgress.status,
      quizScore: lessonProgress.quizScore,
    })
    .from(courseAssignment)
    .innerJoin(course, eq(courseAssignment.courseId, course.id))
    .innerJoin(lesson, eq(lesson.courseId, course.id))
    .leftJoin(
      lessonProgress,
      and(
        eq(lessonProgress.lessonId, lesson.id),
        eq(lessonProgress.userId, userId),
      ),
    )
    .where(
      and(
        eq(courseAssignment.userId, userId),
        eq(course.slug, courseSlug),
      ),
    )
    .orderBy(asc(lesson.position));

  const courseRow = courseRows[0];

  if (!courseRow) {
    return null;
  }

  const progress = buildCourseProgress(
    courseRows.map((row) => ({
      id: row.lessonId,
      slug: row.lessonSlug,
      title: row.lessonTitle,
      description: row.lessonDescription,
      moduleTitle: row.moduleTitle,
      position: row.position,
      estimatedMinutes: row.estimatedMinutes,
      progressStatus: row.progressStatus,
      quizScore: row.quizScore,
    })),
  );
  const studentLesson = progress.lessons.find(
    (courseLesson) => courseLesson.slug === lessonSlug,
  );

  if (!studentLesson) {
    return null;
  }

  return {
    courseSlug: courseRow.courseSlug,
    courseTitle: courseRow.courseTitle,
    lessonId: studentLesson.id,
    lessonSlug: studentLesson.slug,
    lessonTitle: studentLesson.title,
    lessonDescription: studentLesson.description,
    moduleTitle: studentLesson.moduleTitle,
    position: studentLesson.position,
    estimatedMinutes: studentLesson.estimatedMinutes,
    completed: studentLesson.completed,
    quizScore: studentLesson.quizScore,
    ...progress,
  };
}

export async function saveFirstLessonQuizResult(
  userId: string,
  lessonSlug: string,
  score: number,
  passed: boolean,
) {
  const database = getDatabase();
  await ensureFirstCourseAssignment(userId);

  const [assignedLesson] = await database
    .select({ id: lesson.id })
    .from(courseAssignment)
    .innerJoin(course, eq(courseAssignment.courseId, course.id))
    .innerJoin(lesson, eq(lesson.courseId, course.id))
    .where(
      and(
        eq(courseAssignment.userId, userId),
        eq(course.id, FIRST_COURSE.id),
        eq(lesson.slug, lessonSlug),
      ),
    )
    .limit(1);

  if (!assignedLesson) {
    return null;
  }

  const now = new Date();
  const [existingProgress] = await database
    .select({
      quizScore: lessonProgress.quizScore,
      completedAt: lessonProgress.completedAt,
      status: lessonProgress.status,
    })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, assignedLesson.id),
      ),
    )
    .limit(1);

  const bestScore = Math.max(existingProgress?.quizScore ?? 0, score);
  const completed = existingProgress?.status === "completed" || passed;

  await database
    .insert(lessonProgress)
    .values({
      id: crypto.randomUUID(),
      userId,
      lessonId: assignedLesson.id,
      status: completed ? "completed" : "in-progress",
      quizScore: bestScore,
      startedAt: now,
      completedAt: completed ? (existingProgress?.completedAt ?? now) : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        status: completed ? "completed" : "in-progress",
        quizScore: bestScore,
        completedAt: completed ? (existingProgress?.completedAt ?? now) : null,
        updatedAt: now,
      },
    });

  const courseProgress = await getOrCreateFirstCourseAssignment(userId);

  if (courseProgress.courseCompleted) {
    await database
      .insert(courseCertificate)
      .values({
        id: crypto.randomUUID(),
        userId,
        courseId: FIRST_COURSE.id,
        awardedAt: existingProgress?.completedAt ?? now,
      })
      .onConflictDoNothing();
  }

  return {
    completed,
    quizScore: bestScore,
  };
}

export async function getLearnerSettingsForStudent(
  userId: string,
  accountName: string,
) {
  const database = getDatabase();
  const [settings] = await database
    .select({
      certificateDisplayName: learnerSetting.certificateDisplayName,
      updatedAt: learnerSetting.updatedAt,
    })
    .from(learnerSetting)
    .where(eq(learnerSetting.userId, userId))
    .limit(1);

  return {
    certificateDisplayName:
      settings?.certificateDisplayName ??
      getDefaultCertificateDisplayName(accountName),
    updatedAt: settings?.updatedAt.toISOString() ?? null,
  };
}

export async function saveLearnerSettingsForStudent(
  userId: string,
  certificateDisplayName: string,
) {
  const database = getDatabase();
  const now = new Date();

  await database
    .insert(learnerSetting)
    .values({
      id: crypto.randomUUID(),
      userId,
      certificateDisplayName,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: learnerSetting.userId,
      set: {
        certificateDisplayName,
        updatedAt: now,
      },
    });

  return {
    certificateDisplayName,
    updatedAt: now.toISOString(),
  };
}

export async function getFirstCourseCertificateForStudent(
  userId: string,
  accountName: string,
) {
  const database = getDatabase();
  await ensureFirstCourseAssignment(userId);

  const courseProgress = await getOrCreateFirstCourseAssignment(userId);
  const eligible = courseProgress.courseCompleted;

  if (eligible) {
    await database
      .insert(courseCertificate)
      .values({
        id: crypto.randomUUID(),
        userId,
        courseId: FIRST_COURSE.id,
        awardedAt: new Date(),
      })
      .onConflictDoNothing();
  }

  const [certificateRow, settings] = await Promise.all([
    database
      .select({
        id: courseCertificate.id,
        awardedAt: courseCertificate.awardedAt,
      })
      .from(courseCertificate)
      .where(
        and(
          eq(courseCertificate.userId, userId),
          eq(courseCertificate.courseId, FIRST_COURSE.id),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
    getLearnerSettingsForStudent(userId, accountName),
  ]);

  return {
    eligible,
    certificate: eligible && certificateRow
      ? {
          id: certificateRow.id,
          awardedAt: certificateRow.awardedAt.toISOString(),
          displayName: settings.certificateDisplayName,
          courseTitle: FIRST_COURSE.title,
        }
      : null,
  };
}

async function getAssignedLessonId(userId: string, lessonSlug: string) {
  const database = getDatabase();
  const [assignedLesson] = await database
    .select({ id: lesson.id })
    .from(courseAssignment)
    .innerJoin(course, eq(courseAssignment.courseId, course.id))
    .innerJoin(lesson, eq(lesson.courseId, course.id))
    .where(
      and(
        eq(courseAssignment.userId, userId),
        eq(course.id, FIRST_COURSE.id),
        eq(lesson.slug, lessonSlug),
      ),
    )
    .limit(1);

  return assignedLesson?.id ?? null;
}

function getLessonPractice(lessonSlug: string, savedContent?: string) {
  if (lessonSlug === "semantic-html") {
    const html = savedContent ?? SEMANTIC_HTML_STARTER;

    return {
      html,
      checks: gradeSemanticHtml(html),
    };
  }

  if (lessonSlug === "css-selectors-box-model") {
    const html = savedContent ?? CSS_BOX_MODEL_STARTER;

    return {
      html,
      checks: gradeCssBoxModel(html),
    };
  }

  return null;
}

export async function getFirstLessonArtifact(
  userId: string,
  lessonSlug: string,
) {
  const database = getDatabase();
  const lessonId = await getAssignedLessonId(userId, lessonSlug);

  if (!lessonId) {
    return null;
  }

  const [artifact] = await database
    .select({
      html: lessonArtifact.html,
      updatedAt: lessonArtifact.updatedAt,
    })
    .from(lessonArtifact)
    .where(
      and(
        eq(lessonArtifact.userId, userId),
        eq(lessonArtifact.lessonId, lessonId),
      ),
    )
    .limit(1);
  const practice = getLessonPractice(lessonSlug, artifact?.html);

  if (!practice) {
    return null;
  }

  const { html, checks } = practice;
  const passedChecks = checks.filter((check) => check.passed).length;

  return {
    html,
    checks,
    saved: Boolean(artifact),
    updatedAt: artifact?.updatedAt.toISOString() ?? null,
    submission: artifact
      ? {
          status:
            passedChecks === checks.length
              ? ("completed" as const)
              : ("needs-revision" as const),
          passedChecks,
          totalChecks: checks.length,
          submittedAt: artifact.updatedAt.toISOString(),
        }
      : null,
  };
}

export async function saveFirstLessonArtifact(
  userId: string,
  lessonSlug: string,
  html: string,
) {
  const database = getDatabase();
  const lessonId = await getAssignedLessonId(userId, lessonSlug);

  if (!lessonId) {
    return null;
  }

  const now = new Date();
  await database
    .insert(lessonArtifact)
    .values({
      id: crypto.randomUUID(),
      userId,
      lessonId,
      html,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [lessonArtifact.userId, lessonArtifact.lessonId],
      set: {
        html,
        updatedAt: now,
      },
    });
  const practice = getLessonPractice(lessonSlug, html);

  if (!practice) {
    return null;
  }

  const checks = practice.checks;
  const passedChecks = checks.filter((check) => check.passed).length;

  return {
    html,
    checks,
    saved: true,
    updatedAt: now.toISOString(),
    submission: {
      status:
        passedChecks === checks.length
          ? ("completed" as const)
          : ("needs-revision" as const),
      passedChecks,
      totalChecks: checks.length,
      submittedAt: now.toISOString(),
    },
  };
}

export async function getFirstLessonNote(
  userId: string,
  lessonSlug: string,
) {
  const database = getDatabase();
  const lessonId = await getAssignedLessonId(userId, lessonSlug);

  if (!lessonId) {
    return null;
  }

  const [note] = await database
    .select({
      content: lessonNote.content,
      updatedAt: lessonNote.updatedAt,
    })
    .from(lessonNote)
    .where(
      and(
        eq(lessonNote.userId, userId),
        eq(lessonNote.lessonId, lessonId),
      ),
    )
    .limit(1);

  return {
    note: note
      ? {
          content: note.content,
          updatedAt: note.updatedAt.toISOString(),
        }
      : null,
  };
}

export async function saveFirstLessonNote(
  userId: string,
  lessonSlug: string,
  content: string,
) {
  const database = getDatabase();
  const lessonId = await getAssignedLessonId(userId, lessonSlug);

  if (!lessonId) {
    return null;
  }

  const now = new Date();
  await database
    .insert(lessonNote)
    .values({
      id: crypto.randomUUID(),
      userId,
      lessonId,
      content,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [lessonNote.userId, lessonNote.lessonId],
      set: {
        content,
        updatedAt: now,
      },
    });

  return {
    content,
    updatedAt: now.toISOString(),
  };
}

export async function getCourseFeedbackForStudent(
  userId: string,
  courseSlug: string,
) {
  const database = getDatabase();
  const [row] = await database
    .select({
      courseId: course.id,
      usefulness: courseFeedback.usefulness,
      comment: courseFeedback.comment,
      updatedAt: courseFeedback.updatedAt,
    })
    .from(courseAssignment)
    .innerJoin(course, eq(courseAssignment.courseId, course.id))
    .leftJoin(
      courseFeedback,
      and(
        eq(courseFeedback.courseId, course.id),
        eq(courseFeedback.userId, userId),
      ),
    )
    .where(
      and(eq(courseAssignment.userId, userId), eq(course.slug, courseSlug)),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    feedback:
      row.usefulness && row.updatedAt
        ? {
            usefulness: row.usefulness,
            comment: row.comment ?? "",
            updatedAt: row.updatedAt.toISOString(),
          }
        : null,
  };
}

export async function saveCourseFeedbackForStudent(
  userId: string,
  courseSlug: string,
  usefulness: string,
  comment: string | null,
) {
  const database = getDatabase();
  const courseProgress = await getOrCreateFirstCourseAssignment(userId);

  if (!courseProgress.courseCompleted) {
    return null;
  }

  const [completedCourse] = await database
    .select({ courseId: course.id })
    .from(courseAssignment)
    .innerJoin(course, eq(courseAssignment.courseId, course.id))
    .where(
      and(eq(courseAssignment.userId, userId), eq(course.slug, courseSlug)),
    )
    .limit(1);

  if (!completedCourse) {
    return null;
  }

  const now = new Date();
  await database
    .insert(courseFeedback)
    .values({
      id: crypto.randomUUID(),
      userId,
      courseId: completedCourse.courseId,
      usefulness,
      comment,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [courseFeedback.userId, courseFeedback.courseId],
      set: {
        usefulness,
        comment,
        updatedAt: now,
      },
    });

  return {
    usefulness,
    comment: comment ?? "",
    updatedAt: now.toISOString(),
  };
}
